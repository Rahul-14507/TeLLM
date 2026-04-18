import os
import uuid
import logging
import psycopg2
import hashlib
import redis
from langchain_text_splitters import RecursiveCharacterTextSplitter
from config import settings

logger = logging.getLogger(__name__)
redis_client = redis.from_url(settings.redis_url)

splitter = RecursiveCharacterTextSplitter(chunk_size=600, chunk_overlap=80)


async def ingest_curriculum(pdf_path: str, subject_id: str, chapter: str):
    """
    Full RAG ingestion pipeline:
    1. Load PDF text (pypdf)
    2. Split into chunks with RecursiveCharacterTextSplitter
    3. For each chunk, call OpenAI text-embedding-3-small (1536-dim)
    4. INSERT into curriculum_chunks table with pgvector embedding
    5. Mark subject.curriculum_loaded = True
    """
    from pypdf import PdfReader
    import openai

    logger.info(f"Starting ingestion for subject={subject_id}, chapter={chapter}")

    # 1. Load PDF text
    reader = PdfReader(pdf_path)
    full_text = "\n".join(
        page.extract_text() or "" for page in reader.pages
    )

    # 2. Split into chunks
    chunks = splitter.split_text(full_text)
    logger.info(f"Split into {len(chunks)} chunks")

    # 3. & 4. Embed and insert
    oai = openai.OpenAI(api_key=settings.anthropic_api_key)  # Uses OPENAI_API_KEY env if not set
    conn = psycopg2.connect(settings.database_url)
    cur = conn.cursor()

    try:
        for i, chunk in enumerate(chunks):
            embedding_response = oai.embeddings.create(
                model="text-embedding-3-small",
                input=chunk
            )
            embedding = embedding_response.data[0].embedding

            cur.execute(
                """INSERT INTO curriculum_chunks
                   (id, subject_id, chunk_text, embedding, chapter, page_ref)
                   VALUES (gen_random_uuid(), %s, %s, %s::vector, %s, %s)""",
                (subject_id, chunk, embedding, chapter, i)
            )

        # 5. Mark subject as loaded
        cur.execute(
            "UPDATE subjects SET curriculum_loaded = true WHERE id = %s",
            (subject_id,)
        )
        conn.commit()
        logger.info(f"Ingestion complete for subject={subject_id}: {len(chunks)} chunks inserted")
    except Exception as e:
        conn.rollback()
        logger.error(f"Ingestion failed for subject={subject_id}: {e}")
        raise
    finally:
        cur.close()
        conn.close()
        # Clean up temp file
        if os.path.exists(pdf_path):
            os.remove(pdf_path)


async def get_context(query: str, subject_id: str, top_k: int = 3) -> str:
    """
    Embed the query with text-embedding-3-small, then cosine-similarity search
    curriculum_chunks for top_k matches for the given subject.
    Returns joined chunk texts as a context string.
    """
    query_hash = hashlib.md5(query.encode('utf-8')).hexdigest()
    cache_key = f"rag:{subject_id}:{query_hash}"
    
    try:
        cached = redis_client.get(cache_key)
        if cached:
            return cached.decode('utf-8') if isinstance(cached, bytes) else str(cached)
    except redis.RedisError:
        pass # Degrade gracefully
        
    import openai

    oai = openai.OpenAI()
    try:
        embedding_response = oai.embeddings.create(
            model="text-embedding-3-small",
            input=query
        )
        query_embedding = embedding_response.data[0].embedding
    except Exception as e:
        logger.error(f"Embedding failed: {e}")
        return ""

    try:
        conn = psycopg2.connect(settings.database_url)
        cur = conn.cursor()
    except Exception as e:
        logger.error(f"DB connection failed: {e}")
        return ""
        
    try:
        cur.execute(
            """SELECT chunk_text FROM curriculum_chunks
               WHERE subject_id = %s
               ORDER BY embedding <=> %s::vector
               LIMIT %s""",
            (subject_id, query_embedding, top_k)
        )
        rows = cur.fetchall()
    except Exception as e: # Catch any db error and return empty context
        logger.error(f"Vector search failed: {e}")
        rows = []
    finally:
        cur.close()
        conn.close()

    if not rows:
        return ""

    context_str = "\n---\n".join(r[0] for r in rows)
    try:
        redis_client.setex(cache_key, 600, context_str)
    except redis.RedisError:
        pass
        
    return context_str
