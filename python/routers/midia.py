import os
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlmodel import Session
from database import obter_sessao
from models import Usuario, Entrevista, Pergunta, Resposta, StatusEntrevista
from schemas import RespostaDetalhe
from auth import obter_usuario_atual
from config import settings
from transcricao import transcrever_resposta

router = APIRouter(prefix="/perguntas", tags=["Mídia"])

# .webm/.mp4/.mov chegam normalmente com câmera+áudio juntos (é o que o
# frontend grava). Os demais são contêineres só de áudio (fallback pra
# quem enviar sem vídeo, ou re-upload manual).
EXTENSOES_VIDEO = {".webm", ".mp4", ".mov"}
EXTENSOES_AUDIO = {".wav", ".mp3", ".ogg", ".m4a"}
EXTENSOES_PERMITIDAS = EXTENSOES_VIDEO | EXTENSOES_AUDIO

def _obter_pergunta_do_usuario(pergunta_id: int, sessao: Session, usuario: Usuario) -> tuple[Pergunta, Entrevista]:
    pergunta = sessao.get(Pergunta, pergunta_id)
    if not pergunta:
        raise HTTPException(status_code=404, detail="Pergunta não encontrada")
    entrevista = sessao.get(Entrevista, pergunta.entrevista_id)
    if not entrevista or entrevista.usuario_id != usuario.id:
        raise HTTPException(status_code=404, detail="Pergunta não encontrada")
    return pergunta, entrevista

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
    if extensao not in EXTENSOES_PERMITIDAS:
        raise HTTPException(
            status_code=400,
            detail=f"Formato de arquivo não suportado: '{extensao or 'desconhecido'}'. "
                   f"Use um dos formatos: {', '.join(sorted(EXTENSOES_PERMITIDAS))}",
        )

    pasta_entrevista = settings.MEDIA_DIR / f"entrevista_{entrevista.id}"
    pasta_entrevista.mkdir(parents=True, exist_ok=True)

    nome_arquivo = (
        f"pergunta{pergunta_id}_{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}"
        f"_{uuid.uuid4().hex[:8]}{extensao}"
    )
    caminho_absoluto = pasta_entrevista / nome_arquivo

    conteudo = await arquivo.read()
    if not conteudo:
        raise HTTPException(status_code=400, detail="Arquivo vazio")
    with open(caminho_absoluto, "wb") as destino:
        destino.write(conteudo)

    # Caminho relativo já incluindo o prefixo do mount ("/media" em main.py),
    # mesmo padrão do "audios/<arquivo>" salvo em Tentativa no projeto original.
    caminho_relativo = f"media/entrevista_{entrevista.id}/{nome_arquivo}"
    eh_video = extensao in EXTENSOES_VIDEO

    try:
        texto_transcrito, duracao = transcrever_resposta(str(caminho_absoluto))
    except RuntimeError as e:
        # Arquivo já foi salvo em disco, o professor/coordenador ainda
        # consegue ouvir manualmente mesmo se o serviço de voz falhar agora.
        raise HTTPException(status_code=503, detail=str(e))

    resposta = pergunta.resposta
    if resposta:
        # Reenvio da mesma pergunta (aluno regravou): sobrescreve os dados,
        # mas não apaga o arquivo antigo do disco (fica órfão, sem problema
        # pra essa etapa, limpeza de mídia órfã fica pra depois).
        resposta.transcricao_texto = texto_transcrito
        resposta.video_path = caminho_relativo if eh_video else None
        resposta.audio_path = None if eh_video else caminho_relativo
        resposta.duracao_segundos = duracao
    else:
        resposta = Resposta(
            pergunta_id=pergunta_id,
            transcricao_texto=texto_transcrito,
            video_path=caminho_relativo if eh_video else None,
            audio_path=None if eh_video else caminho_relativo,
            duracao_segundos=duracao,
        )

    sessao.add(resposta)
    sessao.commit()
    sessao.refresh(resposta)
    return resposta