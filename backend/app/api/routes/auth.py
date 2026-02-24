from fastapi import APIRouter, Depends, HTTPException, Request, Response, status

from app.core.deps import get_current_user
from app.core.exceptions import InvalidCredentials, UserNotFound
from app.schemas.auth import UserLoginUsername
from app.schemas.user import UserOut, UserUpdatePassword
from app.schemas.otp import ForgotPasswordRequest, VerifyOTPRequest, ResetPasswordRequest
from app.services.auth import login as login_svc, logout as logout_svc, update_user_password as update_user_password_svc
from app.services.otp import send_otp, verify_otp, reset_password as reset_password_svc
from app.core.config import settings


router = APIRouter()


@router.post("/login")
async def login(user_data: UserLoginUsername, response: Response):
    result = await login_svc(user_data.username, user_data.password)

    if not result:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid credentials")

    user, token, expires = result
    response.set_cookie(
        key=settings.SESSION_COOKIE_NAME,
        value=token,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite="lax",
        max_age=settings.SESSION_EXPIRES_DAYS * 24 * 60 * 60,
        path="/",
    )

    user_out = UserOut(**user.model_dump())
    return {"user": user_out, "token": token}


@router.post("/logout")
async def logout(request: Request, response: Response):
    token = request.cookies.get(settings.SESSION_COOKIE_NAME)
    if token:
        await logout_svc(token)
    response.delete_cookie(settings.SESSION_COOKIE_NAME, path="/")
    return {"detail": "success"}


@router.get("/me")
async def get_me(current_user: UserOut = Depends(get_current_user)):
    return current_user


@router.patch("/change_password", status_code=204)
async def update_password(password_data: UserUpdatePassword, current_user: UserOut = Depends(get_current_user)):
    try:
        await update_user_password_svc(current_user.id, password_data.old_password, password_data.new_password)
    except InvalidCredentials:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid credentials")


# ─── OTP endpoints ─────────────────────────────────────────────────────────────

@router.post("/forgot-password")
async def forgot_password(data: ForgotPasswordRequest):
    """Send OTP to user's registered email."""
    try:
        await send_otp(data.email)
        return {"message": "OTP sent to your email"}
    except UserNotFound:
        # Return same message to avoid email enumeration
        return {"message": "OTP sent to your email"}
    except Exception as e:
        raise HTTPException(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            f"Failed to send OTP: {str(e)}"
        )


@router.post("/verify-otp")
async def verify_otp_route(data: VerifyOTPRequest):
    """Verify OTP entered by user."""
    try:
        await verify_otp(data.email, data.otp)
        return {"message": "OTP verified successfully"}
    except UserNotFound:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    except ValueError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(e))


@router.post("/reset-password")
async def reset_password_route(data: ResetPasswordRequest):
    """Reset password after OTP verification."""
    try:
        await reset_password_svc(data.email, data.otp, data.new_password)
        return {"message": "Password reset successful. Please login with your new password."}
    except UserNotFound:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    except ValueError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(e))