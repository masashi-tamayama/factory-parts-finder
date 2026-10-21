import os

from dotenv import load_dotenv
from fastapi import FastAPI

load_dotenv(os.environ.get("ENV_FILE", ".env"))
DATABASE_URL = os.environ["DATABASE_URL"]

app = FastAPI()


@app.get("/api/health")
def health():
    return {"status": "ok"}

