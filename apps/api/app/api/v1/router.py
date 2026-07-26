"""API v1 route aggregator."""

from fastapi import APIRouter

from app.api.v1.endpoints import documents, health, materials

api_v1_router = APIRouter()
api_v1_router.include_router(health.router)
api_v1_router.include_router(documents.router)
api_v1_router.include_router(materials.router)

