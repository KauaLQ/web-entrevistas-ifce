from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field
from models import StatusEntrevista

# ---------- Autenticação ----------
class UsuarioCriar(BaseModel):
    nome: str
    email: EmailStr
    senha: str = Field(min_length=6)
    curso: Optional[str] = None
    matricula: Optional[str] = None

class UsuarioLogin(BaseModel):
    email: EmailStr
    senha: str

class UsuarioResposta(BaseModel):
    id: int
    nome: str
    email: EmailStr
    curso: Optional[str] = None
    matricula: Optional[str] = None

class TokenResposta(BaseModel):
    access_token: str
    token_type: str = "bearer"
    usuario: UsuarioResposta


# ---------- Entrevistas ----------
# Schemas de entrada/saída completos (perguntas, respostas, relatório da IA)
# entram na próxima etapa, junto com as rotas que os usam. Por ora, só o
# necessário pra criar e listar entrevistas.

class EntrevistaCriar(BaseModel):
    cargo_alvo: str
    descricao_cargo: Optional[str] = None

class EntrevistaResumo(BaseModel):
    id: int
    cargo_alvo: str
    status: StatusEntrevista
    data_inicio: datetime
    data_fim: Optional[datetime] = None
    score_final: Optional[float] = None
