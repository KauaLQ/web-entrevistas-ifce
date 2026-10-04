import { useEffect, useRef } from "react";

/**
 * Mede o volume de um MediaStream em tempo real (0 a 1) e entrega cada
 * leitura via callback. Usa callback em vez de state de propósito: são
 * ~60 leituras por segundo, e um setState a cada uma re-renderizaria a
 * página inteira. Quem consome atualiza o DOM direto, por ref.
 *
 * O analisador NÃO é conectado ao destination, então o usuário não se
 * ouve (sem eco/microfonia).
 */
export function useNivelMicrofone(stream, aoMedir) {
  const callbackRef = useRef(aoMedir);
  callbackRef.current = aoMedir;

  useEffect(() => {
    if (!stream) return;

    const AudioContextClass = window.AudioContext || window.webkitAudioContext; // webkit: Safari antigo
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    const source = ctx.createMediaStreamSource(stream);
    source.connect(analyser);

    const amostras = new Uint8Array(analyser.fftSize);
    let frameId;

    function medir() {
      analyser.getByteTimeDomainData(amostras); // onda crua, centrada em 128

      // RMS: raiz da média dos quadrados, boa aproximação do "volume percebido"
      let soma = 0;
      for (let i = 0; i < amostras.length; i++) {
        const v = (amostras[i] - 128) / 128;
        soma += v * v;
      }
      const rms = Math.sqrt(soma / amostras.length);

      // Fala normal dá RMS ~0.05–0.2; multiplicar deixa a barra mais "viva"
      callbackRef.current(Math.min(1, rms * 4));
      frameId = requestAnimationFrame(medir);
    }

    ctx.resume?.(); // alguns navegadores criam o contexto "suspended"
    medir();

    return () => {
      cancelAnimationFrame(frameId);
      source.disconnect();
      ctx.close();
    };
  }, [stream]);
}