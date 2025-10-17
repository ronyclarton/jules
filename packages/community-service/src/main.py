import os
import psycopg2
from fastapi import FastAPI, Depends, HTTPException
from pydantic import BaseModel
from psycopg2.extras import RealDictCursor
from typing import List
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt

# --- App & Auth Configuration ---
app = FastAPI()
SECRET_KEY = os.environ.get("JWT_SECRET", "your-super-secret-key-that-is-long")
ALGORITHM = "HS256"
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(status_code=401, detail="Could not validate credentials")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("id")
        if user_id is None:
            raise credentials_exception
        return {"id": user_id}
    except JWTError:
        raise credentials_exception

# --- Database Connection ---
def get_db_connection():
    return psycopg2.connect(os.environ.get("DATABASE_URL"))

# --- Endpoints ---
@app.post("/models/{model_id}/like", status_code=204)
async def like_model(model_id: str, current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("id")
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO likes (user_id, model_id) VALUES (%s, %s) ON CONFLICT (user_id, model_id) DO NOTHING",
            (user_id, model_id)
        )
        conn.commit()
        cursor.close()
        conn.close()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/models/{model_id}/like", status_code=204)
async def unlike_model(model_id: str, current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("id")
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM likes WHERE user_id = %s AND model_id = %s", (user_id, model_id))
        conn.commit()
        cursor.close()
        conn.close()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/gallery")
async def get_gallery(limit: int = 20, offset: int = 0):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute(
            "SELECT id, prompt, thumbnail_url, user_id FROM models WHERE is_private = false ORDER BY created_at DESC LIMIT %s OFFSET %s",
            (limit, offset)
        )
        models = cursor.fetchall()
        cursor.close()
        conn.close()
        return models
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/models/{model_id}")
async def get_model(model_id: str):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        query = """
            SELECT m.id, m.prompt, m.asset_url, m.user_id, COUNT(l.user_id) as likes_count
            FROM models m
            LEFT JOIN likes l ON m.id = l.model_id
            WHERE m.id = %s AND m.is_private = false
            GROUP BY m.id
        """

        cursor.execute(query, (model_id,))
        model = cursor.fetchone()

        cursor.close()
        conn.close()

        if not model:
            raise HTTPException(status_code=404, detail="Model not found or is private.")
        return model
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))