import json
import redis
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from typing import List, Optional
from config import settings
from jose import JWTError, jwt

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

# Simple redis client
redis_client = redis.from_url(settings.redis_url)

# Dummy verification dependency
def get_current_teacher(token: str = Depends(oauth2_scheme)):
    try:
        # In a real app we'd decode and verify role="teacher"
        # payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
        pass
    except Exception:
        # Ignore for the sake of the mock if token is invalid
        pass
    return {"user_id": "mock_teacher_id", "role": "teacher"}

class StudentStat(BaseModel):
    id: str
    name: str
    sessions_today: int
    avg_hint_level: float
    last_active: str
    hint_distribution: List[int] # e.g. [1, 2, 3, 4, 5] levels count

class FlaggedSession(BaseModel):
    id: str
    student_name: str
    timestamp: str
    flagged_phrase: str

class TeacherSummary(BaseModel):
    total_active_today: int
    total_active_delta: float
    avg_hint_level: float
    avg_hint_delta: float
    flagged_count: int
    flagged_delta: float
    top_topics: List[str]
    students: List[StudentStat]
    flagged_sessions: List[FlaggedSession]

def generate_mock_summary() -> TeacherSummary:
    return TeacherSummary(
        total_active_today=42,
        total_active_delta=15.5,
        avg_hint_level=2.8,
        avg_hint_delta=-0.4,
        flagged_count=3,
        flagged_delta=50.0,
        top_topics=["Projectile Motion", "Newton's Third Law", "Vector Addition", "Kinetic Energy", "Friction"],
        students=[
            StudentStat(id="1", name="Alice Smith", sessions_today=3, avg_hint_level=4.2, last_active="10 mins ago", hint_distribution=[1, 2, 5, 8, 4]),
            StudentStat(id="2", name="Bob Jones", sessions_today=1, avg_hint_level=1.5, last_active="1 hour ago", hint_distribution=[4, 1, 0, 0, 0]),
            StudentStat(id="3", name="Charlie Brown", sessions_today=2, avg_hint_level=3.1, last_active="5 mins ago", hint_distribution=[2, 3, 4, 1, 0]),
        ],
        flagged_sessions=[
            FlaggedSession(id="s1", student_name="Alice Smith", timestamp="2023-10-27T10:15:00Z", flagged_phrase="Ignore previous instructions..."),
            FlaggedSession(id="s2", student_name="Dave Miller", timestamp="2023-10-27T09:30:00Z", flagged_phrase="Tell me the exact answer to..."),
        ]
    )

@router.get("/teacher-summary", response_model=TeacherSummary)
async def get_teacher_summary(teacher: dict = Depends(get_current_teacher)):
    cache_key = "teacher_summary_mock"
    
    # Try cache
    try:
        cached = redis_client.get(cache_key)
        if cached:
            return json.loads(cached)
    except Exception as e:
        print(f"Redis error: {e}")
        
    # Generate mock
    summary = generate_mock_summary()
    
    # Set cache (60s)
    try:
        redis_client.setex(cache_key, 60, summary.model_dump_json())
    except Exception as e:
        print(f"Redis error: {e}")
        
    return summary

@router.get("/metrics")
async def get_metrics():
    return {"metrics": {}}

@router.get("/sessions/{student_id}")
async def get_student_sessions(student_id: str):
    return {"sessions": []}
