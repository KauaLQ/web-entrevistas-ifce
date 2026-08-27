import { useCallback, useEffect, useRef, useState } from "react";

function mensagemDeErro(err) {
  if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
    return "Permissão de câmera/microfone negada. Habilite o acesso nas configurações do navegador e tente novamente.";
  }
  if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
    return "Nenhuma câmera ou microfone foi encontrado neste dispositivo.";
  }
  if (err.name === "NotReadableError") {
    return "A câmera ou o microfone já estão sendo usados por outro programa.";
  }
  return "Não foi possível acessar a câmera e o microfone.";
}

/**
 * Encapsula o ciclo de vida do stream de câmera/microfone: pede acesso ao
 * montar, expõe o stream por ref (pra não re-renderizar a cada frame) e
 * garante que as tracks sejam paradas -- tanto ao desligar manualmente
 * quanto ao desmontar o componente, senão o navegador mantém o indicador
 * de câmera "ativa" mesmo com a sala de simulação já fechada.
 */
export function useCameraStream() {
  const streamRef = useRef(null);
  const [ligada, setLigada] = useState(false);
  const [solicitando, setSolicitando] = useState(true);
  const [erro, setErro] = useState("");

  const pararStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setLigada(false);
  }, []);

  const iniciarStream = useCallback(async () => {
    setSolicitando(true);
    setErro("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      setLigada(true);
      return stream;
    } catch (err) {
      setErro(mensagemDeErro(err));
      setLigada(false);
      throw err;
    } finally {
      setSolicitando(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- pedir a câmera ao montar é o próprio propósito do hook, não uma derivação de estado
    iniciarStream().catch(() => {
      // erro já fica guardado em `erro`, exibido pela página
    });
    return () => pararStream();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { streamRef, ligada, solicitando, erro, iniciarStream, pararStream };
}
