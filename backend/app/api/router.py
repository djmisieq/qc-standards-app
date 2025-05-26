from fastapi import APIRouter
from app.api.endpoints import auth, users, templates, checklists, photos, steps, sync

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(templates.router, prefix="/templates", tags=["templates"])
api_router.include_router(checklists.router, prefix="/checklists", tags=["checklists"])
api_router.include_router(photos.router, prefix="/photos", tags=["photos"])
api_router.include_router(steps.router, prefix="/steps", tags=["steps"])
api_router.include_router(sync.router, prefix="/sync", tags=["sync"])
