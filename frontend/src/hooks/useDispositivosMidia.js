import { useCallback, useEffect, useRef, useState } from "react";

const CONSTRAINTS_AUDIO = { audio: true };
const CONSTRAINTS_VIDEO = { video: true };

function mensagemDeErro(err, rotulo) {
  if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
    return `Permissão de ${rotulo} negada. Habilite o acesso nas configurações do navegador e tente novamente.`;
  }
  if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
    return `Nenhum dispositivo de ${rotulo} foi encontrado neste dispositivo.`;
  }
  if (err.name === "NotReadableError") {
    return `O dispositivo de ${rotulo} já está sendo usado por outro programa.`;
  }
  return `Não foi possível acessar o ${rotulo}.`;
}

/**
 * Ciclo de vida de um stream local (mic ou câmera): expõe o stream por ref
 * e garante que as tracks sejam paradas ao desligar e ao desmontar, senão
 * o navegador mantém o indicador de mic/câmera "ativo" mesmo após sair da sala.
 */
function useStreamLocal({ constraints, iniciarAoMontar, rotulo }) {
  const streamRef = useRef(null);
  const [ligada, setLigada] = useState(false);
  const [solicitando, setSolicitando] = useState(iniciarAoMontar);
  const [erro, setErro] = useState("");

  const parar = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setLigada(false);
  }, []);

  const iniciar = useCallback(async () => {
    setSolicitando(true);
    setErro("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      // Se já havia um stream (ex.: effect rodando 2x no StrictMode), para o antigo
      // antes de substituir, senão ele ficaria órfão com o mic/câmera ligado.
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = stream;
      setLigada(true);
      return stream;
    } catch (err) {
      setErro(mensagemDeErro(err, rotulo));
      setLigada(false);
      throw err;
    } finally {
      setSolicitando(false);
    }
  }, [constraints, rotulo]);

  useEffect(() => {
    if (iniciarAoMontar) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- pedir o dispositivo ao montar é o propósito do hook
      iniciar().catch(() => {
        // erro já fica guardado em `erro`
      });
    }
    return () => parar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { streamRef, ligada, solicitando, erro, iniciar, parar };
}

/** Microfone: obrigatório, é o que vai ser gravado. Pedido ao montar. */
export function useMicrofone() {
  return useStreamLocal({ constraints: CONSTRAINTS_AUDIO, iniciarAoMontar: true, rotulo: "microfone" });
}

/** Câmera: opcional, só alimenta o <video> de espelho. Nunca é gravada. */
export function useCameraPreview() {
  return useStreamLocal({ constraints: CONSTRAINTS_VIDEO, iniciarAoMontar: false, rotulo: "câmera" });
}