from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    database_url: str
    redis_url: str
    anthropic_api_key: str
    jwt_secret: str
    llm_model: str = "claude-sonnet-4-6"

    class Config:
        env_file = "../../.env"
        extra = "ignore"

@lru_cache()
def get_settings():
    return Settings()

settings = get_settings()
