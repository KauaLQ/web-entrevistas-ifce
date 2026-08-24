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
    total_perguntas: int
    total_respondidas: int

class RespostaDetalhe(BaseModel):
    id: int
    transcricao_texto: Optional[str] = None
    video_path: Optional[str] = None
    audio_path: Optional[str] = None
    duracao_segundos: Optional[float] = None
    criado_em: datetime

class PerguntaDetalhe(BaseModel):
    id: int
    ordem: int
    texto: str
    resposta: Optional[RespostaDetalhe] = None

class EntrevistaDetalhe(BaseModel):
    id: int
    cargo_alvo: str
    descricao_cargo: Optional[str] = None
    status: StatusEntrevista
    data_inicio: datetime
    data_fim: Optional[datetime] = None
    score_final: Optional[float] = None
    perguntas: List[PerguntaDetalhe] = []

# ---------- Geração de perguntas pela IA ----------
class PerguntasGeradas(BaseModel):
    """Schema usado só pra validar a resposta estruturada do Gemini (não é
    persistido -- cada pergunta vira uma linha própria em `Pergunta`)."""
    perguntas: List[str] = Field(min_length=1)

# ---------- Relatório final da IA (entrevistador avaliando o candidato) ----------
class AvaliacaoPergunta(BaseModel):
    pergunta: str
    avaliacao: str  # comentário curto sobre a resposta a essa pergunta específica

class RelatorioEntrevista(BaseModel):
    score_geral: float = Field(ge=0, le=10, description="Nota geral do candidato, de 0 a 10")
    resumo_geral: str = Field(description="Parágrafo resumindo o desempenho geral na entrevista")
    pontos_fortes: List[str] = Field(min_length=1)
    pontos_a_melhorar: List[str] = Field(min_length=1)
    avaliacao_por_pergunta: List[AvaliacaoPergunta]
    recomendacoes: List[str] = Field(
        description="Sugestões práticas pro candidato treinar antes da próxima entrevista real"
    )

class RelatorioEntrevistaResposta(BaseModel):
    relatorio: RelatorioEntrevista
    gerado_em: datetime
    do_cache: bool