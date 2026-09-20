"""
Document Store Repository - Single Source of Truth for Document Storage
CONTRACT: This layer abstracts MongoDB connectivity. It tries to write/read from MongoDB first,
and falls back to an active in-memory _fallback_store on ANY connection error, timeout, or lookup failure.
Routes MUST NOT call Motor/Mongo directly, they must use this layer to ensure resilience and avoid 503 errors.
"""
import logging
from typing import Any
from datetime import datetime, timezone
from app.core.database import get_collection
from app.models.document import COLLECTION_NAME

logger = logging.getLogger(__name__)

# Module-level in-memory fallback store
_fallback_store: dict[str, dict[str, Any]] = {}
def _sort_key(doc: dict[str, Any]) -> datetime:
    """Normalize uploaded_at into a timezone-aware datetime for safe sorting,
    regardless of whether it's missing, a string, naive, or aware."""
    val = doc.get("uploaded_at")
    if val is None:
        return datetime.min.replace(tzinfo=timezone.utc)
    if isinstance(val, str):
        try:
            val = datetime.fromisoformat(val)
        except ValueError:
            return datetime.min.replace(tzinfo=timezone.utc)
    if isinstance(val, datetime):
        if val.tzinfo is None:
            return val.replace(tzinfo=timezone.utc)
        return val
    return datetime.min.replace(tzinfo=timezone.utc)

class DocumentStore:
    def __init__(self):
        self._is_offline = False

    def get_fallback_count(self) -> int:
        return len(_fallback_store)

    async def save_document(self, document_id: str, document_data: dict[str, Any]) -> None:
        """Write-through to both Mongo (if available) and in-memory store."""
        # 1. Always save to fallback store for resilience
        _fallback_store[document_id] = document_data
        
        # 2. Try Mongo
        if self._is_offline:
            return
            
        try:
            collection = get_collection(COLLECTION_NAME)
            # Find document if it exists, otherwise insert
            await collection.replace_one(
                {"_id": document_id},
                document_data,
                upsert=True
            )
        except Exception as exc:
            logger.warning("Mongo write failed for %s. Continuing with fallback store. Error: %s", document_id, exc)
            self._is_offline = True

    async def get_document(self, document_id: str) -> dict[str, Any] | None:
        """Read from Mongo with graceful fallback to in-memory store."""
        if not self._is_offline:
            try:
                collection = get_collection(COLLECTION_NAME)
                doc = await collection.find_one({"_id": document_id})
                if doc:
                    # Cache it in fallback just in case
                    _fallback_store[document_id] = doc
                    return doc
            except Exception as exc:
                logger.warning("Mongo read failed for %s. Falling back to memory. Error: %s", document_id, exc)
                self._is_offline = True
            
        # Fallback
        return _fallback_store.get(document_id)

    async def list_documents(self, skip: int, limit: int) -> tuple[list[dict[str, Any]], int]:
        """List documents using Mongo, fallback to in-memory store if down."""
        if not self._is_offline:
            try:
                collection = get_collection(COLLECTION_NAME)
                total = await collection.count_documents({})
                cursor = collection.find({}).sort("uploaded_at", -1).skip(skip).limit(limit)
                docs = await cursor.to_list(length=limit)
                
                # Update cache
                for d in docs:
                    _fallback_store[d["_id"]] = d
                    
                return docs, total
            except Exception as exc:
                logger.warning("Mongo list failed. Falling back to memory. Error: %s", exc)
                self._is_offline = True
            
        # Fallback
        docs = list(_fallback_store.values())
        # Sort by uploaded_at descending
        docs.sort(key=_sort_key, reverse=True)
        total = len(docs)
        paginated_docs = docs[skip : skip + limit]
        return paginated_docs, total

    async def get_study_materials(self, document_id: str) -> dict | None:
        """Read study materials."""
        doc = await self.get_document(document_id)
        if doc and "study_materials" in doc:
            return doc["study_materials"]
        return None

    async def save_study_materials(self, document_id: str, materials: dict) -> None:
        """Save study materials inside the document."""
        if document_id in _fallback_store:
            _fallback_store[document_id]["study_materials"] = materials
        else:
            _fallback_store[document_id] = {"_id": document_id, "study_materials": materials}
        
        if self._is_offline:
            return
            
        try:
            collection = get_collection(COLLECTION_NAME)
            await collection.update_one(
                {"_id": document_id},
                {"$set": {"study_materials": materials}},
                upsert=True
            )
        except Exception as exc:
            logger.warning("Mongo write failed for save_study_materials %s. Error: %s", document_id, exc)
            self._is_offline = True

    async def update_status(self, document_id: str, status: str, error_message: str | None = None) -> None:
        if document_id in _fallback_store:
            _fallback_store[document_id]["status"] = status
            if error_message:
                _fallback_store[document_id]["error_message"] = error_message
                
        if self._is_offline:
            return
            
        try:
            collection = get_collection(COLLECTION_NAME)
            update_fields = {"status": status}
            if error_message:
                update_fields["error_message"] = error_message
            await collection.update_one(
                {"_id": document_id},
                {"$set": update_fields}
            )
        except Exception as exc:
            logger.warning("Mongo update_status failed for %s. Error: %s", document_id, exc)
            self._is_offline = True

    async def delete_document(self, document_id: str) -> bool:
        """Delete from both Mongo (if available) and in-memory fallback."""
        existed = document_id in _fallback_store
        _fallback_store.pop(document_id, None)
        
        if self._is_offline:
            return existed
            
        try:
            collection = get_collection(COLLECTION_NAME)
            result = await collection.delete_one({"_id": document_id})
            existed = existed or result.deleted_count > 0
        except Exception as exc:
            logger.warning("Mongo delete failed for %s. Fallback delete only. Error: %s", document_id, exc)
            self._is_offline = True
        return existed

document_store = DocumentStore()
