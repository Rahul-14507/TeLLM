from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import json
import asyncio
from typing import Optional
import urllib.parse
import re
import redis
from config import settings

# Initialize redis
redis_client = redis.from_url(settings.redis_url)
from middleware.injection_guard import check as check_injection
from services.intent_classifier import classify
from services.socratic_engine import respond, explain
from services.rag_service import get_context
from services.sim_dispatcher import dispatch
from routers.auth import oauth2_scheme

router = APIRouter()

class MessageRequest(BaseModel):
    session_id: str
    content: str
    subject_id: str
    hint_level: Optional[int] = 1

@router.post("/message")
async def chat_message(req: MessageRequest, token: str = Depends(oauth2_scheme)):
    user_id = "test_user_id" # mocked from token
    
    # Rate Limiting
    try:
        key = f"ratelimit:{user_id}"
        current = redis_client.get(key)
        if current and int(current) >= 30:
            raise HTTPException(status_code=429, detail="You are sending messages very fast! Take a moment to try the problem yourself first.")
        
        pipe = redis_client.pipeline()
        pipe.incr(key)
        if not current:
            pipe.expire(key, 3600)
        pipe.execute()
    except redis.RedisError:
        pass # fail gracefully if redis is down
        
    # Sanitization
    sanitized_content = re.sub(r'<[^>]*>', '', req.content)[:1000]

    # 1. Load session history from Redis (Placeholder)
    # history = await redis_client.get(f"session:{req.session_id}:history")
    history = [] 

    # 2. Injection Guard
    is_injection, refusal_msg = check_injection(sanitized_content)
    if is_injection:
        return StreamingResponse((f"data: {json.dumps({'content': refusal_msg})}\n\n" for _ in range(1)), media_type="text/event-stream")

    # 3. Classify Intent
    intent = classify(sanitized_content, history, req.subject_id)

    # 4. Handle based on intent and stream response
    async def process_intent():
        sources = []
        if intent in ["HOMEWORK", "CONCEPTUAL", "CLARIFY"]:
            context, sources = await get_context(sanitized_content, req.subject_id)
            if intent == "CONCEPTUAL":
                return explain(sanitized_content, context, req.subject_id), sources
            else:
                return respond(sanitized_content, history, req.hint_level, req.subject_id, context), sources
        else:
            async def offtopic_gen():
                yield "I am your TeLLM tutor. Let's stay focused on your subjects!"
            return offtopic_gen(), []


    async def sse_generator():
        try:
            generator, sources = await process_intent()
            
            # Emit sources early
            if sources:
                yield f"data: {json.dumps({'sources': sources})}\n\n"

            # Emit simulator metadata if conceptual
            if intent == "CONCEPTUAL":
                sim_data = await dispatch(sanitized_content)
                if sim_data:
                    query_string = urllib.parse.urlencode(sim_data["params"])
                    sim_url = f"/sims/{sim_data['template']}.html?{query_string}"
                    yield f"data: {json.dumps({'sim_url': sim_url})}\n\n"
                    
            while True:
                chunk = await asyncio.wait_for(anext(generator), timeout=8.0)
                yield f"data: {json.dumps({'content': chunk})}\n\n"
        except StopAsyncIteration:
            pass
        except asyncio.TimeoutError:
            yield f"data: {json.dumps({'content': 'I am thinking... let me try that differently.'})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(sse_generator(), media_type="text/event-stream")
