from fastapi import APIRouter
import psycopg2
from config import settings

router = APIRouter()

@router.get("/sources")
async def get_all_sources():
    try:
        conn = psycopg2.connect(settings.database_url)
        cur = conn.cursor()
        cur.execute("SELECT DISTINCT chapter FROM curriculum_chunks")
        rows = cur.fetchall()
        cur.close(); conn.close()
        return {"sources": [r[0] for r in rows]}
    except Exception as e:
        return {"error": str(e), "sources": []}
