from fastapi import HTTPException, Request, status, WebSocket

from app.core.config import settings
from app.schemas.user import UserOut
from app.services.auth import get_user_from_session
from app.core.logger import get_logger

logger = get_logger(__name__)

async def get_current_user(
    request: Request,
) -> UserOut:
    """Get the current authenticated user from session cookie."""
    session_token = request.cookies.get(settings.SESSION_COOKIE_NAME)
    if not session_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not authorized."
        )

    user = await get_user_from_session(session_token)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not authorized."
        )

    return UserOut(**user.model_dump())


async def get_current_session(
    request: Request,
) -> str:

    # print("=" * 50)
    # print("REQUEST PATH:", request.url.path)
    # print("ALL COOKIES:", dict(request.cookies))
    # print("LOOKING FOR:", settings.SESSION_COOKIE_NAME)
    # print("=" * 50)
    #
    session_token = request.cookies.get(settings.SESSION_COOKIE_NAME)
    if not session_token:
        print("AUTH: error")
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "User not authorized.")

    return session_token


async def admin_only(request: Request) -> UserOut:
    """Ensure only admin users can access the endpoint."""
    session_token = request.cookies.get(settings.SESSION_COOKIE_NAME)
    if not session_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not authenticated."
        )

    user = await get_user_from_session(session_token)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid session."
        )

    if user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required."
        )

    return UserOut(**user.model_dump())

async def admin_only_ws(ws: WebSocket):
    session_token = ws.cookies.get(settings.SESSION_COOKIE_NAME)
    if not session_token:
        logger.error("Missing session token")
        raise RuntimeError("Unauthenticated WebSocket")

    user = await get_user_from_session(session_token)
    if not user:
        logger.error("Invalid session")
        raise RuntimeError("Invalid session")

    if user.role != "admin":
        logger.error("User is not admin")
        raise RuntimeError("Forbidden")

    return user


async def admin_and_staff(request: Request):
    session_token = request.cookies.get(settings.SESSION_COOKIE_NAME)
    if not session_token:
        print("AUTH: error")
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "User not authenticated.")

    user = await get_user_from_session(session_token)
    if not user:
        print("AUTH: User does not exist")
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid Session.")

    if (user.role != "admin") and (user.role != "staff"):
        print("AUTH: error: user is not admin or staff")
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Admin or staff access required.")
