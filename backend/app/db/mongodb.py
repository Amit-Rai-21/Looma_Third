import certifi
from beanie import init_beanie
from pymongo import AsyncMongoClient
from pymongo.asynchronous.database import AsyncDatabase
from app.core.config import settings
from app.models.school import School
from app.models.session import SessionDoc
from app.models.user import UserDoc

class MongoDB:
    client: AsyncMongoClient | None = None

db = MongoDB()

async def connect_to_mongo():
    db.client = AsyncMongoClient(
        settings.MONGODB_URI,
        tlsCAFile=certifi.where()
    )

    await init_beanie(
        database=db.client[settings.MONGODB_DB_NAME],
        document_models=[
            School,
            UserDoc,
            SessionDoc
        ]
    )

async def close_mongo_connection():
    if db.client:
        await db.client.close()

def get_db() -> AsyncDatabase:
    if db.client is None:
        raise RuntimeError("Database not connected. Call connect_to_mongo() first.")
    return db.client[settings.MONGODB_DB_NAME]

def get_client() -> AsyncMongoClient:
    if db.client is None:
        raise RuntimeError("Database not connected.")
    return db.client
