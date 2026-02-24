from datetime import datetime, timedelta, timezone
from app.core.exceptions import InvalidCredentials, UserNotFound
from app.core.security import get_password_hash, new_token, verify_password
from app.models.user import UserDoc
from app.models.session import SessionDoc
from app.core.config import settings


async def login(identifier: str, password: str):
    user = await UserDoc.find_one(
        {"$or": [{"username": identifier}, {"email": identifier}]}
    )

    if not user:
        print("LOGIN FAIL: user not found")
        return None

    if not verify_password(password, user.passwordHash):
        print("LOGIN FAIL: invalid password")
        return None

    token = new_token()
    created = datetime.now(timezone.utc)
    expires = created + timedelta(days=settings.SESSION_EXPIRES_DAYS)

    if user.id is None:
        raise ValueError("User must be persisted before creating a session")

    user_session = SessionDoc(
        userId=user.id,
        token=token,
        expiresAt=expires,
        createdAt=datetime.now(timezone.utc),
    )

    await user.set({"lastLogin": datetime.now(timezone.utc)})

    await SessionDoc.insert_one(user_session)

    return user, token, expires

async def logout(token: str):
    sessoin_to_delete = await SessionDoc.find_one(SessionDoc.token == token)
    if sessoin_to_delete is not None:
        await sessoin_to_delete.delete()

async def get_user_from_session(token: str) -> UserDoc | None:
    user_session = await SessionDoc.find_one(SessionDoc.token == token)

    if not user_session:
        return None

    expires_at = user_session.expiresAt
    if expires_at and expires_at.replace(tzinfo=timezone.utc) <= datetime.now(timezone.utc):
        await user_session.delete()
        return None

    user_id = user_session.userId

    user = await UserDoc.find_one(UserDoc.id == user_id)
    return user

async def update_user_password(user_id, old_password, new_password):
    user_to_update = await UserDoc.find_one(UserDoc.id == user_id)

    if not user_to_update:
        raise UserNotFound

    if not verify_password(old_password, user_to_update.passwordHash):
        raise InvalidCredentials

    user_to_update.passwordHash = get_password_hash(new_password)
    await user_to_update.save()
