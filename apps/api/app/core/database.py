"""MongoDB async connection management via Motor, with in-memory fallback."""

import logging
from typing import Any
from uuid import uuid4

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.core.config import settings

logger = logging.getLogger(__name__)


class MockCursor:
    def __init__(self, data: list[dict[str, Any]]) -> None:
        self._data = data

    def sort(self, key: str, direction: int = 1) -> "MockCursor":
        reverse = direction < 0
        try:
            self._data.sort(key=lambda x: x.get(key), reverse=reverse)
        except Exception as exc:
            logger.debug("Failed to sort mock collection: %s", exc)
        return self

    def skip(self, n: int) -> "MockCursor":
        self._data = self._data[n:]
        return self

    def limit(self, n: int) -> "MockCursor":
        self._data = self._data[:n]
        return self

    async def to_list(self, length: int | None = None) -> list[dict[str, Any]]:
        if length is not None:
            return self._data[:length]
        return self._data


class MockCollection:
    def __init__(self, name: str) -> None:
        self.name = name
        self._store: dict[str, dict[str, Any]] = {}

    async def insert_one(self, document: dict[str, Any]) -> Any:
        doc = dict(document)
        if "_id" not in doc:
            doc["_id"] = str(uuid4())
        self._store[doc["_id"]] = doc
        class Result:
            inserted_id = doc["_id"]
        return Result()

    async def find_one(self, filter: dict[str, Any]) -> dict[str, Any] | None:
        for doc in self._store.values():
            match = True
            for k, v in filter.items():
                if doc.get(k) != v:
                    match = False
                    break
            if match:
                return dict(doc)
        return None

    def find(self, filter: dict[str, Any]) -> MockCursor:
        matches = []
        for doc in self._store.values():
            match = True
            for k, v in filter.items():
                if doc.get(k) != v:
                    match = False
                    break
            if match:
                matches.append(dict(doc))
        return MockCursor(matches)

    async def count_documents(self, filter: dict[str, Any]) -> int:
        count = 0
        for doc in self._store.values():
            match = True
            for k, v in filter.items():
                if doc.get(k) != v:
                    match = False
                    break
            if match:
                count += 1
        return count

    async def update_one(self, filter: dict[str, Any], update: dict[str, Any], upsert: bool = False) -> Any:
        doc = await self.find_one(filter)
        if not doc:
            if upsert:
                doc = dict(filter)
                await self.insert_one(doc)
            else:
                class UpdateResult:
                    modified_count = 0
                    matched_count = 0
                return UpdateResult()

        doc_id = doc["_id"]
        target = self._store[doc_id]

        if "$set" in update:
            for k, v in update["$set"].items():
                target[k] = v
        else:
            for k, v in update.items():
                target[k] = v

        class UpdateResult:
            modified_count = 1
            matched_count = 1
        return UpdateResult()

    async def delete_one(self, filter: dict[str, Any]) -> Any:
        doc = await self.find_one(filter)
        if doc:
            del self._store[doc["_id"]]
            class DeleteResult:
                deleted_count = 1
            return DeleteResult()
        class DeleteResult:
            deleted_count = 0
        return DeleteResult()


class MockDatabase:
    def __init__(self) -> None:
        self._collections: dict[str, MockCollection] = {}

    def __getitem__(self, name: str) -> MockCollection:
        if name not in self._collections:
            self._collections[name] = MockCollection(name)
        return self._collections[name]


class MockMotorClient:
    def __init__(self, uri: str) -> None:
        self.uri = uri
        self._database = MockDatabase()

    def __getitem__(self, name: str) -> MockDatabase:
        return self._database

    @property
    def admin(self) -> Any:
        class Admin:
            async def command(self, cmd: str) -> Any:
                if cmd == "ping":
                    return True
                return {}
        return Admin()

    def close(self) -> None:
        pass


_client: Any = None
_database: Any = None
_is_mock: bool = False


async def connect_to_mongodb() -> None:
    """Initialize Motor client and verify connectivity with Mock fallback."""
    global _client, _database, _is_mock

    mongo_uri = getattr(settings, "MONGODB_URL", None) or settings.MONGODB_URI

    try:
        real_client = AsyncIOMotorClient(
            mongo_uri,
            serverSelectionTimeoutMS=5000,
            maxPoolSize=10,
            minPoolSize=1,
        )
        # Verify connection
        await real_client.admin.command("ping")
        _client = real_client
        _database = _client[settings.MONGODB_DB_NAME]
        _is_mock = False
        logger.info("Connected to MongoDB at %s", mongo_uri)
    except Exception as exc:
        logger.warning(
            "Could not connect to MongoDB (%s). Falling back to in-memory Mock client.",
            exc,
        )
        _client = MockMotorClient(mongo_uri)
        _database = _client[settings.MONGODB_DB_NAME]
        _is_mock = True


async def close_mongodb_connection() -> None:
    """Close Motor client on shutdown."""
    global _client, _database

    if _client is not None:
        _client.close()
        logger.info("MongoDB connection closed")

    _client = None
    _database = None


def get_database() -> Any:
    """Return active database instance — raises if not connected."""
    if _database is None:
        raise RuntimeError("MongoDB is not connected. Call connect_to_mongodb() first.")
    return _database


async def ping_database() -> bool:
    """Health check helper — returns True if DB responds to ping."""
    if _client is None:
        return False
    try:
        if _is_mock:
            return True
        await _client.admin.command("ping")
        return True
    except Exception:
        return False


def get_collection(name: str) -> Any:
    return get_database()[name]

