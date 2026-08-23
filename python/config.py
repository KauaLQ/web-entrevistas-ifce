from functools import lru_cache
from pathlib import Path
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict

# Raiz do projeto (um nível acima da pasta python/)
BASE_DIR = Path(__file__).resolve().parent.parent

class Settings(BaseSettings):
    """
    Carrega todas as variáveis de ambiente num único lugar. Em produção,
    defina-as no ambiente do servidor; em desenvolvimento, num arquivo
    `.env` na raiz do projeto (mesmo nível da pasta `python/`).
    """

    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # ---------- Banco de dados ----------
    DB_URL: str

    # ---------- Autenticação (JWT) ----------
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60 * 12  # token válido por 12h

    # ---------- IA (usada nas próximas etapas: gerar perguntas e feedback) ----------
    GEMINI_API_KEY: Optional[str] = None
    GEMINI_MODEL: str

    # ---------- Mídia das respostas (vídeo/áudio gravados na entrevista) ----------
    MEDIA_DIR: Path = BASE_DIR / "media"

    # ---------- CORS ----------
    # Em produção, restrinja ao domínio do frontend (ex.: ["https://entrevistas.ifce.edu.br"])
    CORS_ORIGINS: List[str] = ["*"]

    # ---------- Diversos ----------
    ENVIRONMENT: str = "development"  # development | production

@lru_cache
def obter_configuracoes() -> Settings:
    """Cacheado com lru_cache pra ler o .env só uma vez por processo."""
    configuracoes = Settings()
    configuracoes.MEDIA_DIR.mkdir(parents=True, exist_ok=True)
    return configuracoes

settings = obter_configuracoes()