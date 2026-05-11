from pydantic_settings import BaseSettings
from functools import lru_cache
import os

class Settings(BaseSettings):
    database_url: str
    redis_url: str
    jwt_secret: str
    llm_model: str = "llama3.1:8b"
    groq_api_key: str | None = None
    groq_model: str = "llama-3.3-70b-versatile"
    ollama_base_url: str = "http://localhost:11434"

    class Config:
        # Resolve path relative to this file (apps/api/config.py)
        env_file = os.path.join(os.path.dirname(__file__), "../../.env")
        extra = "ignore"



@lru_cache()
def get_settings():
    return Settings()

settings = get_settings()
