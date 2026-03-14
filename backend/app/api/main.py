from fastapi import APIRouter, Depends
from app.api.routes import auth, schools, user, ws
from app.api.routes import scans
from app.core.deps import get_current_session


api_router = APIRouter()

# Schools router has NO global auth dependency.
# Individual write routes (POST, PUT, DELETE) are protected via
# Depends(admin_and_staff) directly in schools.py.
# GET /schools and GET /schools/{id} are intentionally public
# so that viewer-mode users can browse schools without a session.
api_router.include_router(schools.router, prefix="/schools", tags=["schools"])

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(user.router, prefix="/users", tags=["user"])
api_router.include_router(scans.router, prefix="/scans", tags=["scans"])
api_router.include_router(ws.router, prefix="/ws", tags=["websocket"])
