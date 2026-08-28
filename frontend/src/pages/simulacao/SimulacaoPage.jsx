import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Bot, Video, VideoOff, Circle, Square, ArrowRight,
  Loader2, AlertTriangle, CheckCircle2,
} from "lucide-react";
import Button from "../../components/ui/Button";
import ModalConfirmarRegravacao from "./ModalConfirmarRegravacao";
import { useAuth } from "../../context/useAuth";
import { useCameraStream } from "../../hooks/useCameraStream";
import { obterEntrevista, iniciarEntrevista, finalizarEntrevista } from "../../api/entrevistas";
import { enviarResposta } from "../../api/midia";

// Preferimos vp9+opus quando disponível (melhor compressão); a maioria
// dos navegadores modernos suporta, mas caímos pro webm genérico se não.
function escolherMimeType() {
  const candidatos = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"];
  return candidatos.find((tipo) => window.MediaRecorder?.isTypeSupported(tipo)) || "video/webm";
}

export default function SimulacaoPage() {
  const { entrevistaId } = useParams();
  const navegar = useNavigate();
  const { token } = useAuth();

  // ---------- Perguntas da entrevista ----------
  const [perguntas, setPerguntas] = useState([]);
  const [indiceAtual, setIndiceAtual] = useState(0);
  const [respondidasIds, setRespondidasIds] = useState(() => new Set());
  const [carregando, setCarregando] = useState(true);
  const [erroCarregar, setErroCarregar] = useState("");

  // ---------- Câmera/microfone ----------
  const videoRef = useRef(null);
  const { streamRef, ligada, solicitando, erro: erroCamera, iniciarStream, pararStream } = useCameraStream();

  // ---------- Gravação da resposta atual ----------
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const [gravando, setGravando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [finalizando, setFinalizando] = useState(false);
  const [erroAcao, setErroAcao] = useState("");

  // Confirmação de regravação
  const [confirmarRegravacaoAberto, setConfirmarRegravacaoAberto] = useState(false);

  // Só o guard de gravação continua com ref, ele não conflita com o
  // padrão "cancelado" porque não usa cancelado em nenhum ponto.
  const processandoGravacaoRef = useRef(false);

  const perguntaAtual = perguntas[indiceAtual] || null;
  const totalPerguntas = perguntas.length;
  const ehUltimaPergunta = indiceAtual === totalPerguntas - 1;
  const perguntaAtualRespondida = perguntaAtual ? respondidasIds.has(perguntaAtual.id) : false;

  // ---------- Carrega (ou gera) as perguntas da entrevista ----------
  useEffect(() => {
    let cancelado = false;

    async function carregar() {
      setCarregando(true);
      setErroCarregar("");
      try {
        let detalhe = await obterEntrevista(token, entrevistaId);

        if (detalhe.status === "finalizada") {
          navegar(`/feedback/${entrevistaId}`, { replace: true });
          return;
        }

        if (!detalhe.perguntas || detalhe.perguntas.length === 0) {
          try {
            detalhe = await iniciarEntrevista(token, entrevistaId);
          } catch (err) {
            // 409 = outra requisição já está gerando as perguntas dessa
            // entrevista agora (a própria corrida que esse fix resolve no
            // backend). Não é um erro pro usuário: só recarrega o estado.
            if (err.status === 409 || /já está sendo iniciada/i.test(err.message || "")) {
              detalhe = await obterEntrevista(token, entrevistaId);
            } else {
              throw err;
            }
          }
        }
        if (cancelado) return;

        setPerguntas(detalhe.perguntas);
        const jaRespondidas = new Set(detalhe.perguntas.filter((p) => p.resposta).map((p) => p.id));
        setRespondidasIds(jaRespondidas);

        // Retomando uma sessão interrompida: pula pra primeira pergunta
        // ainda sem resposta em vez de reiniciar do zero.
        const indiceInicial = detalhe.perguntas.findIndex((p) => !p.resposta);
        setIndiceAtual(indiceInicial === -1 ? detalhe.perguntas.length - 1 : indiceInicial);
      } catch (err) {
        if (!cancelado) setErroCarregar(err.message);
      } finally {
        if (!cancelado) setCarregando(false);
      }
    }

    carregar();
    return () => { cancelado = true; };
  }, [token, entrevistaId, navegar]);

  // ---------- Espelha o stream de câmera no <video> ----------
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = ligada ? streamRef.current : null;
    }
  }, [ligada, streamRef]);

  // ---------- Segurança extra: se desmontar no meio de uma gravação, para o recorder ----------
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  async function aoAlternarCamera() {
    if (gravando) return; // não deixa desligar a câmera no meio de uma gravação
    setErroAcao("");
    if (ligada) {
      pararStream();
    } else {
      try {
        await iniciarStream();
      } catch {
        // mensagem já fica em erroCamera, exibida na própria prévia
      }
    }
  }

  function iniciarGravacao() {
    if (!streamRef.current) return;
    setErroAcao("");
    chunksRef.current = [];
    try {
      const recorder = new MediaRecorder(streamRef.current, { mimeType: escolherMimeType() });
      recorder.ondataavailable = (evento) => {
        if (evento.data.size > 0) chunksRef.current.push(evento.data);
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setGravando(true);
    } catch {
      setErroAcao("Não foi possível iniciar a gravação neste navegador.");
    }
  }

  function pararGravacao() {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state !== "recording") {
        resolve(null);
        return;
      }
      recorder.onstop = () => {
        resolve(new Blob(chunksRef.current, { type: recorder.mimeType || "video/webm" }));
      };
      recorder.stop();
    });
  }

  async function aoClicarGravar() {
    // Trava síncrona: bloqueia um segundo clique antes mesmo do próximo
    // render acontecer (é exatamente essa janela que gerava o POST duplo
    // de "/resposta" no log).
    if (processandoGravacaoRef.current) return;

    // Se já está gravando, o botão atua como "Parar e enviar"
    if (gravando) {
      await pararEEnviar();
      return;
    }

    // Se a pergunta já foi respondida e o usuário clicou para REGRAVAR,
    // exibe o modal de confirmação ANTES de iniciar a gravação.
    if (perguntaAtualRespondida) {
      setConfirmarRegravacaoAberto(true);
      return;
    }

    // Caso normal (primeira gravação)
    processandoGravacaoRef.current = true;
    iniciarGravacao();
    processandoGravacaoRef.current = false;
  }

  async function pararEEnviar() {
    if (processandoGravacaoRef.current) return;
    processandoGravacaoRef.current = true;

    setGravando(false);
    setEnviando(true);
    setErroAcao("");
    try {
      const blob = await pararGravacao();
      if (!blob || blob.size === 0) {
        throw new Error("Nenhum áudio ou vídeo foi capturado. Tente gravar novamente.");
      }
      await enviarResposta(token, perguntaAtual.id, blob);
      setRespondidasIds((atual) => new Set(atual).add(perguntaAtual.id));
    } catch (err) {
      setErroAcao(err.message || "Não foi possível enviar sua resposta. Tente gravar novamente.");
    } finally {
      setEnviando(false);
      processandoGravacaoRef.current = false;
    }
  }

  function aoConfirmarRegravacao() {
    setConfirmarRegravacaoAberto(false);
    // Confirmou: inicia a gravação normalmente
    processandoGravacaoRef.current = true;
    iniciarGravacao();
    processandoGravacaoRef.current = false;
  }

  function aoCancelarRegravacao() {
    // Cancelou: apenas fecha o modal sem fazer nada
    setConfirmarRegravacaoAberto(false);
  }

  async function aoAvancar() {
    if (!ehUltimaPergunta) {
      setIndiceAtual((i) => i + 1);
      setErroAcao("");
      return;
    }

    setFinalizando(true);
    setErroAcao("");
    try {
      pararStream();
      await finalizarEntrevista(token, entrevistaId);
      navegar(`/feedback/${entrevistaId}`, { replace: true });
    } catch (err) {
      setErroAcao(err.message || "Não foi possível gerar o relatório final. Tente novamente.");
      setFinalizando(false);
    }
  }

  // ---------- Estados de carregamento / erro geral ----------
  if (carregando) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 size={28} className="text-primary animate-spin" />
        <p className="text-sm text-ink/50">Preparando sua sala de simulação...</p>
      </div>
    );
  }

  if (erroCarregar) {
    return (
      <div className="max-w-md mx-auto text-center py-20 px-4">
        <AlertTriangle size={28} className="mx-auto mb-3 text-danger" />
        <p className="text-sm text-ink/70 mb-4">{erroCarregar}</p>
        <Button variante="contorno" className="w-auto px-5" onClick={() => navegar("/dashboard")}>
          Voltar ao dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="pb-10">
      <div className="mb-5">
        <p className="text-xs font-semibold tracking-wide text-primary uppercase">
          Pergunta {indiceAtual + 1} de {totalPerguntas}
        </p>
        <div className="mt-1.5 h-1.5 rounded-full bg-ink/10 overflow-hidden max-w-xs">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${((indiceAtual + 1) / totalPerguntas) * 100}%` }}
          />
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* ---------- Lado esquerdo: entrevistadora + pergunta em destaque ---------- */}
        <div className="bg-white border border-ink/10 rounded-card p-6 flex flex-col">
          <div className="flex items-center gap-3 mb-5">
            <span className="w-12 h-12 rounded-full bg-ink text-paper flex items-center justify-center shrink-0">
              <Bot size={22} />
            </span>
            <div>
              <p className="font-display font-semibold text-ink">Entrevistadora IA</p>
              <p className="text-xs text-ink/50">Simulação de entrevista de emprego</p>
            </div>
          </div>

          <div className="flex-1 flex items-center">
            <p className="font-display text-xl sm:text-2xl text-ink leading-snug">
              {perguntaAtual?.texto}
            </p>
          </div>

          {perguntaAtualRespondida && (
            <div className="mt-5 flex items-center gap-2 text-sm text-primary-dark bg-primary/10 rounded-lg px-3.5 py-2.5">
              <CheckCircle2 size={16} />
              Resposta gravada para esta pergunta.
            </div>
          )}
        </div>

        {/* ---------- Lado direito: prévia da webcam ---------- */}
        <div className="relative bg-ink rounded-card overflow-hidden aspect-video flex items-center justify-center">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            style={{ transform: "scaleX(-1)" }}
          />

          {gravando && (
            <span className="absolute top-3 left-3 flex items-center gap-1.5 bg-danger text-paper text-xs font-semibold px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-paper animate-pulse" />
              Gravando
            </span>
          )}

          {(!ligada || erroCamera) && (
            <div className="absolute inset-0 bg-ink/95 flex flex-col items-center justify-center text-center px-6">
              {solicitando ? (
                <>
                  <Loader2 size={24} className="text-paper/70 animate-spin mb-2" />
                  <p className="text-paper/70 text-sm">Solicitando acesso à câmera...</p>
                </>
              ) : erroCamera ? (
                <>
                  <AlertTriangle size={24} className="text-danger mb-2" />
                  <p className="text-paper/80 text-sm mb-3">{erroCamera}</p>
                  <Button variante="contorno" className="w-auto px-4" onClick={iniciarStream}>
                    Tentar novamente
                  </Button>
                </>
              ) : (
                <>
                  <VideoOff size={24} className="text-paper/50 mb-2" />
                  <p className="text-paper/60 text-sm">Câmera desligada</p>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {erroAcao && (
        <div role="alert" className="mt-5 rounded-lg bg-danger/10 px-3.5 py-2.5 text-sm text-danger">
          {erroAcao}
        </div>
      )}

      {/* ---------- Barra de controles ---------- */}
      <div className="mt-6 bg-white border border-ink/10 rounded-card p-4 flex flex-wrap items-center justify-center gap-3">
        <Button
          variante="contorno"
          className="w-auto px-4"
          onClick={aoAlternarCamera}
          disabled={gravando || solicitando}
        >
          {ligada ? <VideoOff size={18} /> : <Video size={18} />}
          {ligada ? "Desligar câmera" : "Ligar câmera"}
        </Button>

        <Button
          variante={gravando ? "primario" : "contorno"}
          className={`w-auto px-4 ${gravando ? "bg-danger hover:bg-danger shadow-danger/25" : ""}`}
          onClick={aoClicarGravar}
          disabled={!ligada || enviando || finalizando}
          carregando={enviando}
        >
          {!enviando && (gravando ? <Square size={18} /> : <Circle size={18} />)}
          {gravando
            ? "Parar e enviar resposta"
            : perguntaAtualRespondida
              ? "Regravar resposta"
              : "Gravar resposta"}
        </Button>

        <Button
          className="w-auto px-5"
          onClick={aoAvancar}
          disabled={!perguntaAtualRespondida || gravando || enviando}
          carregando={finalizando}
        >
          {!finalizando && <ArrowRight size={18} />}
          {ehUltimaPergunta ? "Finalizar entrevista" : "Próxima pergunta"}
        </Button>

        <ModalConfirmarRegravacao
          aberto={confirmarRegravacaoAberto}
          aoFechar={aoCancelarRegravacao}
          aoConfirmar={aoConfirmarRegravacao}
        />
      </div>
    </div>
  );
}
