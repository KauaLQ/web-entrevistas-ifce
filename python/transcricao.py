import os
import tempfile
from typing import Tuple
import speech_recognition as sr
from pydub import AudioSegment, silence

recognizer = sr.Recognizer()

def transcrever_resposta(caminho_arquivo: str) -> Tuple[str, float]:
    """
    Extrai a faixa de áudio de um arquivo de vídeo ou áudio (qualquer
    contêiner suportado pelo ffmpeg, webm, mp4, wav, etc.) e transcreve
    a fala em português.

    Respostas de entrevista costumam ser bem mais longas que uma palavra
    isolada, e a API gratuita de reconhecimento tem um limite prático de
    ~1 minuto por chamada. Por isso dividimos o áudio em blocos por
    silêncio e concatenamos a transcrição de cada bloco.

    Retorna (texto_transcrito, duracao_segundos). Se nenhum trecho for
    compreendido, texto_transcrito volta como string vazia, não é
    tratado como erro, já que o áudio/vídeo original continua disponível
    pra quem quiser ouvir manualmente.
    """
    audio_original = AudioSegment.from_file(caminho_arquivo)
    duracao = audio_original.duration_seconds

    audio = audio_original.set_frame_rate(16000).set_channels(1)

    blocos = silence.split_on_silence(
        audio,
        min_silence_len=600,
        silence_thresh=audio.dBFS - 14,
        keep_silence=200,
    ) or [audio]

    trechos_transcritos = []
    for bloco in blocos:
        trecho = _transcrever_bloco(bloco)
        if trecho:
            trechos_transcritos.append(trecho)

    texto_completo = " ".join(trechos_transcritos).strip()
    return texto_completo, round(duracao, 2)

def _transcrever_bloco(bloco: AudioSegment) -> str:
    """Transcreve um único bloco de áudio já dividido por silêncio.
    Retorna string vazia se o trecho não tiver fala compreensível."""
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as arquivo_temp:
        caminho_temp = arquivo_temp.name

    try:
        bloco.export(caminho_temp, format="wav")
        with sr.AudioFile(caminho_temp) as fonte:
            dados_audio = recognizer.record(fonte)
        try:
            return recognizer.recognize_google(dados_audio, language="pt-BR")
        except sr.UnknownValueError:
            # Trecho sem fala compreensível (pausa, respiração, ruído) -- ok, ignora.
            return ""
        except sr.RequestError as e:
            raise RuntimeError(f"Serviço de reconhecimento de voz indisponível: {e}")
    finally:
        if os.path.exists(caminho_temp):
            os.remove(caminho_temp)