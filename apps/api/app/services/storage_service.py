"""Local file storage service — S3/Cloudinary-ready abstraction."""

import logging
from pathlib import Path
from uuid import uuid4

import aiofiles

from app.core.config import settings

logger = logging.getLogger(__name__)

ALLOWED_EXTENSIONS = {".pdf", ".txt", ".docx"}

ALLOWED_MIME_TYPES = {
    ".pdf": "application/pdf",
    ".txt": "text/plain",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}


class StorageService:
    def __init__(self, upload_dir: str | None = None) -> None:
        self.upload_dir = Path(upload_dir or settings.UPLOAD_DIR)
        self.upload_dir.mkdir(parents=True, exist_ok=True)

    def validate_extension(self, filename: str) -> str:
        extension = Path(filename).suffix.lower()
        if extension not in ALLOWED_EXTENSIONS:
            raise ValueError(
                f"Unsupported file type '{extension}'. "
                f"Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
            )
        return extension

    def resolve_mime_type(self, extension: str) -> str:
        return ALLOWED_MIME_TYPES[extension]

    async def save_file(self, filename: str, content: bytes) -> tuple[str, str]:
        """Persist file to local storage. Returns (storage_path, mime_type)."""
        extension = self.validate_extension(filename)
        mime_type = self.resolve_mime_type(extension)

        unique_name = f"{uuid4()}{extension}"
        destination = self.upload_dir / unique_name

        async with aiofiles.open(destination, "wb") as f:
            await f.write(content)

        logger.info("Saved file to %s", destination)
        return str(destination), mime_type


storage_service = StorageService()
