import os
import tempfile
import uuid
from datetime import datetime, timezone
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlmodel import Session
from database import obter_sessao
from models import Usuario, Entrevista, Pergunta, Resposta, StatusEntrevista
from schemas import RespostaDetalhe
from auth import obter_usuario_atual
from config import settings
from transcricao import transcrever_resposta

router = APIRouter(prefix="/perguntas", tags=["Mídia"])

# MediaRecorder entrega .webm (Chrome/Firefox) ou .mp4/.m4a (Safari).
# O upload é só um insumo: o que fica guardado é sempre o mp3 convertido.
EXTENSOES_AUDIO = {".webm", ".ogg", ".m4a", ".mp4", ".wav", ".mp3"}

def _obter_pergunta_do_usuario(pergunta_id: int, sessao: Session, usuario: Usuario) -> tuple[Pergunta, Entrevista]:
    pergunta = sessao.get(Pergunta, pergunta_id)
    if not pergunta:
        raise HTTPException(status_code=404, detail="Pergunta não encontrada")
    entrevista = sessao.get(Entrevista, pergunta.entrevista_id)
    if not entrevista or entrevista.usuario_id != usuario.id:
        raise HTTPException(status_code=404, detail="Pergunta não encontrada")
    return pergunta, entrevista

def _apagar_audio(caminho_relativo: str | None) -> None:
    """Remove do disco um áudio já substituído (regravação)."""
    if not caminho_relativo:
        return
    try:
        # o caminho salvo começa com "media/" (prefixo do mount); MEDIA_DIR já é essa pasta
        (settings.MEDIA_DIR / Path(caminho_relativo).relative_to("media")).unlink(missing_ok=True)
    except (ValueError, OSError):
        pass

@router.post("/{pergunta_id}/resposta", response_model=RespostaDetalhe)
async def enviar_resposta(
    pergunta_id: int,
    arquivo: UploadFile = File(...),
    sessao: Session = Depends(obter_sessao),
    usuario: Usuario = Depends(obter_usuario_atual),
):
    pergunta, entrevista = _obter_pergunta_do_usuario(pergunta_id, sessao, usuario)

    if entrevista.status != StatusEntrevista.em_andamento:
        raise HTTPException(status_code=400, detail="Esta entrevista já foi finalizada")

    extensao = os.path.splitext(arquivo.filename or "")[1].lower()
    if extensao not in EXTENSOES_AUDIO:
        raise HTTPException(
            status_code=400,
            detail=f"Formato de arquivo não suportado: '{extensao or 'desconhecido'}'. "
                   f"Use um dos formatos: {', '.join(sorted(EXTENSOES_AUDIO))}",
        )

    conteudo = await arquivo.read()
    if not conteudo:
        raise HTTPException(status_code=400, detail="Arquivo vazio")

    pasta_entrevista = settings.MEDIA_DIR / f"entrevista_{entrevista.id}"
    pasta_entrevista.mkdir(parents=True, exist_ok=True)

    nome_audio = (
        f"pergunta{pergunta_id}_{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}"
        f"_{uuid.uuid4().hex[:8]}.mp3"
    )
    caminho_audio = pasta_entrevista / nome_audio
    caminho_relativo = f"media/entrevista_{entrevista.id}/{nome_audio}"

    # O upload bruto vai pra um temporário, só pra o ffmpeg ler; nunca fica no disco
    with tempfile.NamedTemporaryFile(suffix=extensao, delete=False) as temp:
        temp.write(conteudo)
        caminho_temp = temp.name

    try:
        texto_transcrito, duracao = transcrever_resposta(caminho_temp, str(caminho_audio))
    except RuntimeError as e:  # serviço de reconhecimento fora do ar
        caminho_audio.unlink(missing_ok=True)
        raise HTTPException(status_code=503, detail=str(e))
    except Exception:  # áudio corrompido / ffmpeg não conseguiu decodificar
        caminho_audio.unlink(missing_ok=True)
        raise HTTPException(
            status_code=400,
            detail="Não foi possível processar o áudio enviado. Tente gravar novamente.",
        )
    finally:
        if os.path.exists(caminho_temp):
            os.remove(caminho_temp)

    resposta = pergunta.resposta
    audio_antigo = None
    if resposta:
        # Regravação: sobrescreve os dados e remove o áudio anterior do disco
        audio_antigo = resposta.audio_path
        resposta.transcricao_texto = texto_transcrito
        resposta.audio_path = caminho_relativo
        resposta.duracao_segundos = duracao
    else:
        resposta = Resposta(
            pergunta_id=pergunta_id,
            transcricao_texto=texto_transcrito,
            audio_path=caminho_relativo,
            duracao_segundos=duracao,
        )

    sessao.add(resposta)
    sessao.commit()
    sessao.refresh(resposta)

    _apagar_audio(audio_antigo)  # só depois do commit, pra nunca ficar sem arquivo
    return resposta