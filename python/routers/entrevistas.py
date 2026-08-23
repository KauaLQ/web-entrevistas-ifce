from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from database import obter_sessao
from models import Usuario, Entrevista
from schemas import EntrevistaCriar, EntrevistaResumo
from auth import obter_usuario_atual

router = APIRouter(prefix="/entrevistas", tags=["Entrevistas"])

# Endpoints de criação/geração de perguntas via IA, envio de respostas
# (áudio/vídeo) e geração do relatório final entram na próxima etapa. Por
# ora, apenas o esqueleto de criação e listagem, pra validar o fluxo de
# autenticação e o modelo de dados.

def _obter_entrevista_do_usuario(entrevista_id: int, sessao: Session, usuario: Usuario) -> Entrevista:
    entrevista = sessao.get(Entrevista, entrevista_id)
    if not entrevista or entrevista.usuario_id != usuario.id:
        raise HTTPException(status_code=404, detail="Entrevista não encontrada")
    return entrevista

@router.get("", response_model=List[EntrevistaResumo])
def listar_entrevistas(
    sessao: Session = Depends(obter_sessao),
    usuario: Usuario = Depends(obter_usuario_atual),
):
    entrevistas = sessao.exec(
        select(Entrevista).where(Entrevista.usuario_id == usuario.id).order_by(Entrevista.data_inicio.desc())
    ).all()
    return entrevistas

@router.post("", response_model=EntrevistaResumo)
def criar_entrevista(
    dados: EntrevistaCriar,
    sessao: Session = Depends(obter_sessao),
    usuario: Usuario = Depends(obter_usuario_atual),
):
    entrevista = Entrevista(
        usuario_id=usuario.id,
        cargo_alvo=dados.cargo_alvo,
        descricao_cargo=dados.descricao_cargo,
    )
    sessao.add(entrevista)
    sessao.commit()
    sessao.refresh(entrevista)
    return entrevista

@router.get("/{entrevista_id}", response_model=EntrevistaResumo)
def obter_entrevista(
    entrevista_id: int,
    sessao: Session = Depends(obter_sessao),
    usuario: Usuario = Depends(obter_usuario_atual),
):
    return _obter_entrevista_do_usuario(entrevista_id, sessao, usuario)