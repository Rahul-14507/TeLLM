from sentence_transformers import SentenceTransformer
import psycopg2
from config import settings
import os
import uuid
import logging
import hashlib
import redis
import json
from langchain_text_splitters import RecursiveCharacterTextSplitter


logger = logging.getLogger(__name__)
redis_client = redis.from_url(settings.redis_url)
splitter = RecursiveCharacterTextSplitter(chunk_size=600, chunk_overlap=80)

# Downloads once (~90MB), runs locally forever after
embedder = SentenceTransformer("all-MiniLM-L6-v2")  # 384-dim, fast, free

async def ingest_curriculum(pdf_path: str, subject_id: str, chapter: str):
    from pypdf import PdfReader

    logger.info(f"Starting ingestion for subject={subject_id}, chapter={chapter}")

    reader = PdfReader(pdf_path)
    full_text = "\n".join(page.extract_text() or "" for page in reader.pages)
    chunks = splitter.split_text(full_text)
    logger.info(f"Split into {len(chunks)} chunks")

    conn = psycopg2.connect(settings.database_url)
    cur = conn.cursor()

    try:
        # NOTE: switch pgvector column to vector(384) for this model
        for i, chunk in enumerate(chunks):
            embedding = embedder.encode(chunk).tolist()
            cur.execute(
                """INSERT INTO curriculum_chunks
                   (id, subject_id, chunk_text, embedding, chapter, page_ref)
                   VALUES (gen_random_uuid(), %s, %s, %s::vector, %s, %s)""",
                (subject_id, chunk, embedding, chapter, i)
            )

        cur.execute("UPDATE subjects SET curriculum_loaded=true WHERE id=%s", (subject_id,))
        conn.commit()
        logger.info(f"Ingestion complete for subject={subject_id}: {len(chunks)} chunks inserted")
    except Exception as e:
        conn.rollback()
        logger.error(f"Ingestion failed for subject={subject_id}: {e}")
        raise
    finally:
        cur.close(); conn.close()
        if os.path.exists(pdf_path):
            os.remove(pdf_path)

async def get_context(query: str, subject_id: str, top_k: int = 5) -> tuple[str, list[str]]:

    query_hash = hashlib.md5(query.encode('utf-8')).hexdigest()
    cache_key = f"rag:{subject_id}:{query_hash}"
    
    try:
        cached = redis_client.get(cache_key)
        if cached:
            data = json.loads(cached)
            return data["text"], data["sources"]
    except (redis.RedisError, json.JSONDecodeError, TypeError):
        pass

    try:
        query_embedding = embedder.encode(query).tolist()
        conn = psycopg2.connect(settings.database_url)
        cur = conn.cursor()
        cur.execute(
            """SELECT chunk_text, chapter FROM curriculum_chunks
               WHERE subject_id = %s
               ORDER BY embedding <=> %s::vector
               LIMIT %s""",
            (subject_id, query_embedding, top_k)
        )
        rows = cur.fetchall()
        cur.close(); conn.close()
        
        if not rows:
            return "", []

        context_str = "\n---\n".join(r[0] for r in rows)
        sources = list(set(r[1] for r in rows)) # Unique source names
        
        try:
            redis_client.setex(cache_key, 600, json.dumps({"text": context_str, "sources": sources}))
        except redis.RedisError:
            pass
        return context_str, sources
    except Exception as e:
        logger.error(f"RAG search failed: {e}")
        return "", []


async def sync_tutorials_data():
    """
    Syncs textbooks from the linked RAG-Tutorials project.
    """
    TUTORIALS_DATA = r"C:\Projects\RAG-Tutorials\data"
    if not os.path.exists(TUTORIALS_DATA):
        logger.warning(f"Tutorials data path not found: {TUTORIALS_DATA}")
        return

    files = [f for f in os.listdir(TUTORIALS_DATA) if f.endswith('.pdf')]
    
    conn = psycopg2.connect(settings.database_url)
    cur = conn.cursor()
    
    try:
        for filename in files:
            file_path = os.path.join(TUTORIALS_DATA, filename)
            # Find matching subject in DB
            subject_name = "Biology" if "biology" in filename.lower() else "Physics"
            cur.execute("SELECT id FROM subjects WHERE name = %s", (subject_name,))
            row = cur.fetchone()
            if not row:
                logger.warning(f"Subject {subject_name} not found in DB for file {filename}")
                continue
            
            subject_id = row[0]
            chapter = filename.replace(".pdf", "")
            
            logger.info(f"Syncing {filename} to TeLLM (subject_id={subject_id})...")
            from pypdf import PdfReader
            reader = PdfReader(file_path)
            full_text = "\n".join(page.extract_text() or "" for page in reader.pages)
            chunks = splitter.split_text(full_text)
            
            for i, chunk in enumerate(chunks):
                embedding = embedder.encode(chunk).tolist()
                cur.execute(
                    """INSERT INTO curriculum_chunks
                       (id, subject_id, chunk_text, embedding, chapter, page_ref)
                       VALUES (gen_random_uuid(), %s, %s, %s::vector, %s, %s)
                       ON CONFLICT DO NOTHING""",
                    (subject_id, chunk, embedding, chapter, i)
                )
            conn.commit()
            logger.info(f"Successfully synced {filename}")
    except Exception as e:
        conn.rollback()
        logger.error(f"Failed to sync data: {e}")
    finally:
        cur.close(); conn.close()


