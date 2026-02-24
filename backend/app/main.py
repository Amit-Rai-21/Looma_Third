import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.api.main import api_router
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.mongodb import close_mongo_connection, connect_to_mongo

@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_to_mongo()

    yield

    await close_mongo_connection()

app = FastAPI(lifespan=lifespan)

origins = [
    "http://localhost:5000",
    "http://127.0.0.1:5000",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

replit_dev_domain = os.environ.get("REPLIT_DEV_DOMAIN", "")
if replit_dev_domain:
    origins.append(f"https://{replit_dev_domain}")

replit_domains = os.environ.get("REPLIT_DOMAINS", "")
if replit_domains:
    for domain in replit_domains.split(","):
        domain = domain.strip()
        if domain:
            origins.append(f"https://{domain}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)
