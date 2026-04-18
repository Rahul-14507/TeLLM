import os
import tempfile
import logging
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks
from jose import JWTError, jwt

from routers.auth import oauth2_scheme, ALGORITHM
from config import settings
import services.rag_service as rag_service

router = APIRouter()
logger = logging.getLogger(__name__)


def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    """Decode JWT and return the payload dict."""
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[ALGORITHM])
        email = payload.get("sub")
        role = payload.get("role", "student")
        institution_id = payload.get("institution_id")
        if not email:
            raise HTTPException(status_code=401, detail="Invalid token")
        return {"email": email, "role": role, "institution_id": institution_id}
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


def require_teacher_or_admin(user: dict = Depends(get_current_user)) -> dict:
    """Guard: only teacher or admin roles may upload curriculum."""
    if user["role"] not in ("teacher", "admin"):
        raise HTTPException(
            status_code=403,
            detail="Only teachers and admins can upload curriculum materials."
        )
    return user


@router.post("/upload")
async def upload_curriculum(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(..., description="PDF curriculum file"),
    subject_id: str = Form(...),
    chapter: str = Form(...),
    user: dict = Depends(require_teacher_or_admin),
):
    """
    Upload a PDF and trigger background RAG ingestion.
    Returns immediately while processing continues in the background.
    """
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    # 1. Save uploaded PDF to a temp file
    content = await file.read()
    file_size = len(content)

    # Use a named temp file so the background task can access it after the request completes
    tmp_fd, tmp_path = tempfile.mkstemp(suffix=".pdf", prefix="tellm_curriculum_")
    try:
        os.write(tmp_fd, content)
    finally:
        os.close(tmp_fd)

    logger.info(
        f"Curriculum upload queued: subject={subject_id}, chapter={chapter}, "
        f"size={file_size}B, tmp={tmp_path}, user={user['email']}"
    )

    # 2. Schedule ingestion as a background task (non-blocking)
    background_tasks.add_task(
        rag_service.ingest_curriculum,
        pdf_path=tmp_path,
        subject_id=subject_id,
        chapter=chapter,
    )

    # 3. Return immediately with estimated chunk count
    return {
        "status": "ingesting",
        "subject_id": subject_id,
        "chapter": chapter,
        "file_name": file.filename,
        "chunks_estimated": max(1, file_size // 600),
    }


@router.get("/subjects")
async def list_subjects(user: dict = Depends(get_current_user)):
    """
    Return all subjects for the user's institution with curriculum_loaded status.
    NOTE: Requires a running DB; returns placeholder when DB is unavailable.
    """
    institution_id = user.get("institution_id")
    if not institution_id:
        return {"subjects": [], "message": "No institution linked to this user."}

    try:
        import psycopg2
        conn = psycopg2.connect(settings.database_url)
        cur = conn.cursor()
        cur.execute(
            """SELECT id, name, curriculum_loaded
               FROM subjects
               WHERE institution_id = %s
               ORDER BY name""",
            (institution_id,)
        )
        rows = cur.fetchall()
        cur.close()
        conn.close()
        return {
            "subjects": [
                {"id": str(r[0]), "name": r[1], "curriculum_loaded": r[2]}
                for r in rows
            ]
        }
    except Exception as e:
        logger.warning(f"DB unavailable for /curriculum/subjects: {e}")
        raise HTTPException(status_code=503, detail="Database unavailable.")
