import os
import tempfile
from typing import Tuple
import speech_recognition as sr
from pydub import AudioSegment, silence

recognizer = sr.Recognizer()

def transcrever_resposta(caminho_entrada: str, caminho_saida_mp3: str) -> Tuple[str, float]:
    """
    Decodifica o áudio enviado pelo navegador (webm/mp4/ogg...), grava uma
    cópia normalizada em mp3 mono em `caminho_saida_mp3` (é a que fica guardada)
    e transcreve a fala em português.
    Retorna (texto_transcrito, duracao_segundos).
    """
    audio_original = AudioSegment.from_file(caminho_entrada)
    duracao = audio_original.duration_seconds

    audio = audio_original.set_frame_rate(16000).set_channels(1)

    # Cópia que fica no disco: leve, com duração/seek corretos e tocável em qualquer navegador
    audio.export(caminho_saida_mp3, format="mp3", bitrate="64k")

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