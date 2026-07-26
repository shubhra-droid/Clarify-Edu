"""Health check response schemas."""

from datetime import datetime, timezone
from enum import Enum
from typing import Literal

from pydantic import BaseModel, Field


class ServiceStatus(str, Enum):
    UP = "up"
    DOWN = "down"
    UNKNOWN = "unknown"


class HealthStatus(str, Enum):
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    UNHEALTHY = "unhealthy"


class ServiceHealthMap(BaseModel):
    api: Literal["up", "down"] = "up"
    database: Literal["up", "down", "unknown"] = "unknown"
    redis: Literal["up", "down", "unknown"] = "unknown"


class HealthResponse(BaseModel):
    status: HealthStatus = HealthStatus.HEALTHY
    version: str
    timestamp: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )
    services: ServiceHealthMap = Field(default_factory=ServiceHealthMap)

    model_config = {"json_schema_extra": {"example": {
        "status": "healthy",
        "version": "0.1.0",
        "timestamp": "2026-07-26T10:00:00Z",
        "services": {"api": "up", "database": "unknown", "redis": "unknown"},
    }}}
