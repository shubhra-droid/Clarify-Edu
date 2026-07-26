"""Health check endpoints."""

from fastapi import APIRouter

from app.core.config import settings
from app.core.database import ping_database
from app.schemas.health import HealthResponse, HealthStatus

router = APIRouter(tags=["Health"])


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Liveness probe",
    description="Returns API health status for load balancers and monitoring.",
)
async def health_check() -> HealthResponse:
    return HealthResponse(
        status=HealthStatus.HEALTHY,
        version=settings.APP_VERSION,
    )


@router.get(
    "/health/ready",
    response_model=HealthResponse,
    summary="Readiness probe",
    description="Returns readiness status including downstream service checks.",
)
async def readiness_check() -> HealthResponse:
    db_up = await ping_database()

    services = {
        "api": "up",
        "database": "up" if db_up else "down",
        "redis": "unknown",
    }

    status = HealthStatus.HEALTHY if db_up else HealthStatus.DEGRADED

    return HealthResponse(
        status=status,
        version=settings.APP_VERSION,
        services=services,
    )
