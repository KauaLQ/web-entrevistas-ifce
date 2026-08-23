from datetime import datetime, timezone
from enum import Enum
from typing import List, Optional
from sqlalchemy import Column, DateTime, Text
from sqlmodel import SQLModel, Field, Relationship

def agora_utc() -> datetime:
    return datetime.now(timezone.utc)

class StatusEntrevista(str, Enum):
    em_andamento = "em_andamento"
    finalizada = "finalizada"

# ---------- Usuários (alunos que praticam a entrevista) ----------
class Usuario(SQLModel, table=True):
    __tablename__ = "usuarios"

    id: Optional[int] = Field(default=None, primary_key=True)
    nome: str
    email: str = Field(unique=True, index=True)
    senha_hash: str
    curso: Optional[str] = Field(default=None)
    matricula: Optional[str] = Field(default=None, index=True)
    criado_em: datetime = Field(default_factory=agora_utc, sa_column=Column(DateTime(timezone=True)))

    entrevistas: List["Entrevista"] = Relationship(back_populates="usuario")

# ---------- Entrevistas (uma sessão de simulação) ----------
class Entrevista(SQLModel, table=True):
    __tablename__ = "entrevistas"

    id: Optional[int] = Field(default=None, primary_key=True)
    usuario_id: int = Field(foreign_key="usuarios.id")

    cargo_alvo: str
    descricao_cargo: Optional[str] = Field(default=None, sa_column=Column(Text))
    status: StatusEntrevista = Field(default=StatusEntrevista.em_andamento)

    data_inicio: datetime = Field(default_factory=agora_utc, sa_column=Column(DateTime(timezone=True)))
    data_fim: Optional[datetime] = Field(default=None, sa_column=Column(DateTime(timezone=True)))

    # Preenchidos pela IA ao final da entrevista (próxima etapa)
    score_final: Optional[float] = Field(default=None)  # 0 a 10
    feedback_geral: Optional[str] = Field(default=None, sa_column=Column(Text))
    pontos_fortes: Optional[str] = Field(default=None, sa_column=Column(Text))
    pontos_a_melhorar: Optional[str] = Field(default=None, sa_column=Column(Text))

    usuario: Optional[Usuario] = Relationship(back_populates="entrevistas")
    perguntas: List["Pergunta"] = Relationship(
        back_populates="entrevista",
        sa_relationship_kwargs={"order_by": "Pergunta.ordem"},
    )

# ---------- Perguntas (geradas pela IA dentro de uma entrevista) ----------
class Pergunta(SQLModel, table=True):
    __tablename__ = "perguntas"

    id: Optional[int] = Field(default=None, primary_key=True)
    entrevista_id: int = Field(foreign_key="entrevistas.id")
    ordem: int
    texto: str = Field(sa_column=Column(Text))
    criado_em: datetime = Field(default_factory=agora_utc, sa_column=Column(DateTime(timezone=True)))

    entrevista: Optional[Entrevista] = Relationship(back_populates="perguntas")
    resposta: Optional["Resposta"] = Relationship(back_populates="pergunta")

# ---------- Respostas (gravação + transcrição + avaliação individual) ----------
class Resposta(SQLModel, table=True):
    __tablename__ = "respostas"

    id: Optional[int] = Field(default=None, primary_key=True)
    pergunta_id: int = Field(foreign_key="perguntas.id", unique=True)

    transcricao_texto: Optional[str] = Field(default=None, sa_column=Column(Text))
    # Caminhos relativos dentro de settings.MEDIA_DIR (ex.: "entrevista5/resposta2.webm")
    video_path: Optional[str] = Field(default=None)
    audio_path: Optional[str] = Field(default=None)
    duracao_segundos: Optional[float] = Field(default=None)

    criado_em: datetime = Field(default_factory=agora_utc, sa_column=Column(DateTime(timezone=True)))

    pergunta: Optional[Pergunta] = Relationship(back_populates="resposta")