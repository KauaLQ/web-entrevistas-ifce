import logging
from datetime import datetime, timedelta, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select, func
from sqlalchemy import update as sa_update
from sqlalchemy.exc import IntegrityError
from database import obter_sessao
from models import Usuario, Entrevista, Pergunta, Resposta, StatusEntrevista
from schemas import (
    EntrevistaCriar, EntrevistaResumo, EntrevistaDetalhe,
    RelatorioEntrevista, RelatorioEntrevistaResposta,
)
from auth import obter_usuario_atual
from ia_entrevista import gerar_perguntas, gerar_relatorio_final

router = APIRouter(prefix="/entrevistas", tags=["Entrevistas"])

logger = logging.getLogger("entrevistas")

def _agora_utc():
    return datetime.now(timezone.utc)

def _obter_entrevista_do_usuario(entrevista_id: int, sessao: Session, usuario: Usuario) -> Entrevista:
    entrevista = sessao.get(Entrevista, entrevista_id)
    if not entrevista or entrevista.usuario_id != usuario.id:
        raise HTTPException(status_code=404, detail="Entrevista não encontrada")
    return entrevista

def _contar_progresso(sessao: Session, entrevista_id: int) -> tuple[int, int]:
    total_perguntas = sessao.exec(
        select(func.count(Pergunta.id)).where(Pergunta.entrevista_id == entrevista_id)
    ).one()
    total_respondidas = sessao.exec(
        select(func.count(Resposta.id))
        .join(Pergunta, Pergunta.id == Resposta.pergunta_id)
        .where(Pergunta.entrevista_id == entrevista_id)
    ).one()
    return total_perguntas, total_respondidas

def _relatorio_do_cache(json_bruto: str) -> Optional[RelatorioEntrevista]:
    """Se o cache foi salvo com um schema antigo, a validação falha --
    tratamos como cache inexistente pra forçar uma nova geração."""
    try:
        return RelatorioEntrevista.model_validate_json(json_bruto)
    except Exception:
        return None

# ---------- Listar / criar ----------
@router.get("", response_model=List[EntrevistaResumo])
def listar_entrevistas(
    sessao: Session = Depends(obter_sessao),
    usuario: Usuario = Depends(obter_usuario_atual),
):
    entrevistas = sessao.exec(
        select(Entrevista).where(Entrevista.usuario_id == usuario.id).order_by(Entrevista.data_inicio.desc())
    ).all()

    resultado = []
    for entrevista in entrevistas:
        total_perguntas, total_respondidas = _contar_progresso(sessao, entrevista.id)
        resultado.append(EntrevistaResumo(
            id=entrevista.id,
            cargo_alvo=entrevista.cargo_alvo,
            status=entrevista.status,
            data_inicio=entrevista.data_inicio,
            data_fim=entrevista.data_fim,
            score_final=entrevista.score_final,
            total_perguntas=total_perguntas,
            total_respondidas=total_respondidas,
        ))
    return resultado

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
    return EntrevistaResumo(
        id=entrevista.id, cargo_alvo=entrevista.cargo_alvo, status=entrevista.status,
        data_inicio=entrevista.data_inicio, data_fim=None, score_final=None,
        total_perguntas=0, total_respondidas=0,
    )

# ---------- Detalhar ----------
@router.get("/{entrevista_id}", response_model=EntrevistaDetalhe)
def obter_entrevista(
    entrevista_id: int,
    sessao: Session = Depends(obter_sessao),
    usuario: Usuario = Depends(obter_usuario_atual),
):
    entrevista = _obter_entrevista_do_usuario(entrevista_id, sessao, usuario)
    return entrevista  # SQLModel serializa perguntas/respostas via os Relationship

# ---------- Iniciar (gera as perguntas via IA) ----------
TRAVA_EXPIRA_SEGUNDOS = 30  # se o processo cair no meio, a trava expira sozinha
@router.post("/{entrevista_id}/iniciar", response_model=EntrevistaDetalhe)
def iniciar_entrevista(
    entrevista_id: int,
    sessao: Session = Depends(obter_sessao),
    usuario: Usuario = Depends(obter_usuario_atual),
):
    entrevista = _obter_entrevista_do_usuario(entrevista_id, sessao, usuario)

    # Lock de linha no banco: vale entre processos/workers diferentes.
    # Quem chegar depois fica esperando aqui até o commit/rollback de quem
    # chegou primeiro. (O lock é liberado no commit ou rollback.)
    sessao.exec(
        select(Entrevista.id).where(Entrevista.id == entrevista_id).with_for_update()
    ).one()

    ja_tem_perguntas = sessao.exec(
        select(func.count(Pergunta.id)).where(Pergunta.entrevista_id == entrevista_id)
    ).one()

    # Idempotente: outra requisição (ou worker) já gerou, só devolve o resultado
    if ja_tem_perguntas:
        sessao.commit()  # libera o lock
        sessao.refresh(entrevista)
        return entrevista

    try:
        textos_perguntas = gerar_perguntas(entrevista.cargo_alvo, entrevista.descricao_cargo)
    except Exception as e:
        sessao.rollback()  # libera o lock
        logger.error(f"Falha ao gerar perguntas (entrevista {entrevista_id}, cargo '{entrevista.cargo_alvo}'): {e!r}")
        raise HTTPException(
            status_code=503,
            detail="Não foi possível gerar as perguntas agora (serviço de IA indisponível ou "
                   "limite de uso atingido). Tente novamente em alguns instantes.",
        )

    try:
        for ordem, texto in enumerate(textos_perguntas, start=1):
            sessao.add(Pergunta(entrevista_id=entrevista_id, ordem=ordem, texto=texto))
        sessao.commit()
    except IntegrityError:
        # Última linha de defesa: a constraint (entrevista_id, ordem) barrou
        # uma geração concorrente. Descarta a nossa e devolve a que já existe.
        sessao.rollback()
        logger.warning(f"Geração concorrente de perguntas detectada (entrevista {entrevista_id})")

    sessao.refresh(entrevista)
    return entrevista

# ---------- Finalizar (gera o relatório final via IA) ----------
@router.post("/{entrevista_id}/finalizar", response_model=RelatorioEntrevistaResposta)
def finalizar_entrevista(
    entrevista_id: int,
    sessao: Session = Depends(obter_sessao),
    usuario: Usuario = Depends(obter_usuario_atual),
):
    entrevista = _obter_entrevista_do_usuario(entrevista_id, sessao, usuario)

    # Já finalizada: devolve o relatório cacheado, sem chamar a IA de novo
    # (a entrevista acabou, o relatório não muda mais).
    if entrevista.status == StatusEntrevista.finalizada and entrevista.relatorio_ia:
        relatorio_cached = _relatorio_do_cache(entrevista.relatorio_ia)
        if relatorio_cached:
            return RelatorioEntrevistaResposta(
                relatorio=relatorio_cached, gerado_em=entrevista.relatorio_ia_gerado_em, do_cache=True,
            )

    perguntas = sessao.exec(
        select(Pergunta).where(Pergunta.entrevista_id == entrevista_id).order_by(Pergunta.ordem)
    ).all()
    if not perguntas:
        raise HTTPException(status_code=400, detail="A entrevista ainda não foi iniciada (sem perguntas geradas)")

    nao_respondidas = [p.ordem for p in perguntas if p.resposta is None]
    if nao_respondidas:
        raise HTTPException(
            status_code=400,
            detail=f"Ainda faltam respostas para as perguntas de número {nao_respondidas} antes de finalizar",
        )

    perguntas_respostas = [
        {"pergunta": p.texto, "transcricao": p.resposta.transcricao_texto} for p in perguntas
    ]

    try:
        relatorio = gerar_relatorio_final(entrevista.cargo_alvo, entrevista.descricao_cargo, perguntas_respostas)
    except Exception as e:
        logger.error(f"Falha ao gerar relatório final (entrevista {entrevista_id}): {e!r}")
        raise HTTPException(
            status_code=503,
            detail="Não foi possível gerar o relatório agora (serviço de IA indisponível ou "
                   "limite de uso atingido). Tente novamente em alguns instantes.",
        )

    entrevista.relatorio_ia = relatorio.model_dump_json()
    entrevista.relatorio_ia_gerado_em = _agora_utc()
    entrevista.score_final = relatorio.score_geral
    entrevista.status = StatusEntrevista.finalizada
    entrevista.data_fim = _agora_utc()
    sessao.add(entrevista)
    sessao.commit()

    return RelatorioEntrevistaResposta(
        relatorio=relatorio, gerado_em=entrevista.relatorio_ia_gerado_em, do_cache=False,
    )

# ---------- Consultar relatório já gerado (sem disparar nova geração) ----------
@router.get("/{entrevista_id}/relatorio", response_model=Optional[RelatorioEntrevistaResposta])
def obter_relatorio(
    entrevista_id: int,
    sessao: Session = Depends(obter_sessao),
    usuario: Usuario = Depends(obter_usuario_atual),
):
    entrevista = _obter_entrevista_do_usuario(entrevista_id, sessao, usuario)
    if not entrevista.relatorio_ia:
        return None

    relatorio = _relatorio_do_cache(entrevista.relatorio_ia)
    if not relatorio:
        return None  # cache corrompido/schema antigo -- front pede pra finalizar de novo

    return RelatorioEntrevistaResposta(
        relatorio=relatorio, gerado_em=entrevista.relatorio_ia_gerado_em, do_cache=True,
    )