"""FastAPI dependencies."""

from fastapi import HTTPException, status

from app.core.database import ping_database


async def require_database() -> None:
    """Raise 503 if MongoDB is unavailable."""
    if not await ping_database():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database is unavailable. Ensure MongoDB is running.",
        )
