import os

import psycopg
from dotenv import load_dotenv
from fastapi import FastAPI

load_dotenv(os.environ.get("ENV_FILE", ".env"))
DATABASE_URL = os.environ["DATABASE_URL"]

app = FastAPI()


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.post("/api/hello")
def create_hello():
    with psycopg.connect(DATABASE_URL) as conn:
        row = conn.execute(
            "INSERT INTO hello_check (message) VALUES (%s) "
            "RETURNING id, message, created_at",
            ("Hello World",),
        ).fetchone()
    return {"id": row[0], "message": row[1], "created_at": row[2]}


@app.get("/api/hello")
def list_hello():
    with psycopg.connect(DATABASE_URL) as conn:
        rows = conn.execute(
            "SELECT id, message, created_at FROM hello_check "
            "ORDER BY id DESC LIMIT 5"
        ).fetchall()
    return [{"id": r[0], "message": r[1], "created_at": r[2]} for r in rows]
