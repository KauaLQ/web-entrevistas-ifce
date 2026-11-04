import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "react-toastify";
import {
  ArrowLeft, ArrowRight, AlertTriangle, Bot, Check, Loader2,
  Mic, MicOff, RotateCcw, Square, Video, VideoOff,
} from "lucide-react";
import Avatar from "../../components/ui/Avatar";
import MedidorVolume from "../../components/ui/MedidorVolume";
import { useAjusteFonte } from "../../hooks/useAjusteFonte";

function BotaoIcone({ rotulo, className = "", children, ...props }) {
  return (
    <button
      type="button"
      aria-label={rotulo}
      title={rotulo}
      className={`w-14 h-14 rounded-full flex items-center justify-center transition active:scale-95 disabled:opacity-40 disabled:active:scale-100 disabled:cursor-not-allowed ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

function Spinner() {
  return <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />;
}

/**
 * Sala de entrevista no mobile, no padrão do Google Meet:
 * barra superior (sair + progresso), área central (pergunta da IA),
 * tela flutuante (espelho da câmera) e barra inferior (legenda + ações em ícones).
 * Tocar em qualquer área neutra oculta/exibe as duas barras; a área central
 * e a tela flutuante crescem para ocupar o espaço liberado.
 *
 * Nada rola: a pergunta tem a fonte ajustada automaticamente para caber na
 * área central, e um espaçador reserva o lugar da tela flutuante, que tem
 * fundo sólido e z-index acima de todo o conteúdo.
 *
 * É um componente de apresentação: todo o estado e as ações vêm do SimulacaoPage.
 */
export default function SalaMobile({
  nomeUsuario,
  indiceAtual,
  totalPerguntas,
  perguntaId,
  textoPergunta,
  videoRef,
  mic,
  camera,
  gravando,
  enviando,
  finalizando,
  respondida,
  ehUltima,
  aoSair,
  aoAlternarCamera,
  aoGravar,
  aoAvancar,
}) {
  const [barrasVisiveis, setBarrasVisiveis] = useState(true);

  // Fonte da pergunta ajustada para caber sem rolagem (maior com as barras ocultas)
  const { containerRef, textoRef } = useAjusteFonte(textoPergunta, {
    min: 14,
    max: barrasVisiveis ? 24 : 30,
  });

  // Tela cheia sem rolagem: trava o scroll da página enquanto a sala está aberta
  useEffect(() => {
    const anterior = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = anterior;
    };
  }, []);

  // Toque em área neutra alterna as barras; botões/áudio/links têm ação própria
  function aoToqueNoFundo(e) {
    if (e.target.closest("button, a, audio, [data-sem-toggle]")) return;
    setBarrasVisiveis((v) => !v);
  }

  // Ao LIGAR a câmera, avisa (só no mobile) que apenas o áudio é gravado
  function aoClicarCamera() {
    if (!camera.ligada) {
      toast.info(
        "Apenas o áudio da sua resposta é gravado. A imagem da câmera serve só de espelho e nunca é enviada.",
        { toastId: "aviso-camera", autoClose: 6000 }
      );
    }
    aoAlternarCamera();
  }

  const IconeGravar = gravando ? Square : respondida ? RotateCcw : Mic;
  const rotuloGravar = gravando
    ? "Parar e enviar resposta"
    : respondida
      ? "Regravar resposta"
      : "Gravar resposta";

  // Legenda: a última condição verdadeira vence
  let legenda = "Toque no botão do microfone para gravar sua resposta";
  if (respondida) legenda = "Resposta gravada. Avance ou regrave.";
  if (camera.erro) legenda = camera.erro;
  if (mic.solicitando) legenda = "Solicitando acesso ao microfone...";
  if (enviando) legenda = "Enviando sua resposta...";
  if (gravando) legenda = "Gravando... toque em ■ para enviar";

  const progresso = ((indiceAtual + 1) / totalPerguntas) * 100;

  return createPortal(
    <div
      className="fixed inset-x-0 top-0 z-40 h-dvh flex flex-col bg-ink text-paper select-none overflow-hidden"
      onClick={aoToqueNoFundo}
    >
      {/* ---------- Barra superior: sair + progresso ---------- */}
      <header
        inert={!barrasVisiveis}
        className={`shrink-0 overflow-hidden transition-[height,opacity,transform] duration-300 ease-out ${
          barrasVisiveis ? "h-16 opacity-100 translate-y-0" : "h-0 opacity-0 -translate-y-2"
        }`}
      >
        <div className="h-16 px-3 flex items-center gap-3">
          <button
            type="button"
            onClick={aoSair}
            disabled={enviando || finalizando}
            aria-label="Sair da sala"
            title="Sair da sala"
            className="w-11 h-11 shrink-0 rounded-full bg-white/10 flex items-center justify-center active:scale-95 transition disabled:opacity-40"
          >
            <ArrowLeft size={20} />
          </button>

          <div className="flex-1 min-w-0 rounded-full bg-white/10 px-4 py-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-paper/80 leading-none">
              Pergunta {indiceAtual + 1} de {totalPerguntas}
            </p>
            <div className="mt-1.5 h-1 rounded-full bg-white/15 overflow-hidden">
              <div className="h-full bg-sage transition-all duration-300" style={{ width: `${progresso}%` }} />
            </div>
          </div>

          {/* Indicador de gravação (ocupa o lugar mesmo vazio, para centralizar o progresso) */}
          <div className="w-11 h-11 shrink-0 flex items-center justify-center" aria-live="polite">
            {gravando && (
              <span className="w-3 h-3 rounded-full bg-danger animate-pulse" aria-label="Gravando" />
            )}
          </div>
        </div>
      </header>

      {/* ---------- Área central: pergunta da entrevistadora ---------- */}
      <main className="relative flex-1 min-h-0 flex flex-col overflow-hidden">
        {/* Avatar da IA + pergunta (a pergunta ocupa o espaço que sobra e tem a fonte ajustada) */}
        <div
          className={`flex-1 min-h-0 flex flex-col items-center px-6 text-center transition-[padding] duration-300 ease-out ${
            barrasVisiveis ? "pt-2" : "pt-8"
          }`}
        >
          <div className="shrink-0 flex flex-col items-center">
            <span
              className={`rounded-full bg-paper/10 flex items-center justify-center transition-all duration-300 ease-out ${
                barrasVisiveis ? "w-16 h-16" : "w-24 h-24"
              }`}
            >
              <Bot className={`transition-all duration-300 ${barrasVisiveis ? "w-7 h-7" : "w-10 h-10"}`} />
            </span>
            <p className="mt-3 text-sm font-semibold text-paper">Entrevistadora IA</p>
          </div>

          <div ref={containerRef} className="mt-4 flex-1 min-h-0 w-full flex flex-col overflow-hidden">
            <p
              key={perguntaId}
              ref={textoRef}
              className="my-auto font-display leading-snug text-paper animate-fade-in"
            >
              {textoPergunta}
            </p>
          </div>

          {mic.erro && (
            <div
              role="alert"
              data-sem-toggle
              className="shrink-0 mt-3 w-full max-w-xs flex items-start gap-2 rounded-xl bg-danger/25 px-3.5 py-3 text-left text-sm"
            >
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              <div className="flex-1">
                <p>{mic.erro}</p>
                <button
                  type="button"
                  onClick={() => mic.iniciar().catch(() => {})}
                  className="mt-1 font-semibold underline"
                >
                  Tentar novamente
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Espaçador: mesma altura da tela flutuante, para a pergunta nunca ficar por baixo dela */}
        <div
          aria-hidden="true"
          className={`shrink-0 transition-[height] duration-300 ease-out ${
            barrasVisiveis ? "h-40" : "h-52"
          }`}
        />

        {/* ---------- Tela flutuante (canto inferior direito): fundo sólido e z-index máximo da sala ---------- */}
        <div
          className={`absolute right-3 bottom-3 z-20 overflow-hidden rounded-2xl bg-[#2a4540] shadow-lg shadow-black/30 ring-1 ring-white/10 transition-all duration-300 ease-out ${
            barrasVisiveis ? "w-28 h-36" : "w-36 h-48"
          }`}
        >
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`absolute inset-0 w-full h-full object-cover ${camera.ligada ? "" : "hidden"}`}
            style={{ transform: "scaleX(-1)" }}
          />

          {!camera.ligada && (
            <div className="absolute inset-0 flex items-center justify-center pb-6">
              {camera.solicitando ? (
                <Loader2 size={22} className="text-paper/70 animate-spin" />
              ) : camera.erro ? (
                <AlertTriangle size={22} className="text-red-300" />
              ) : (
                <Avatar nome={nomeUsuario} tamanho="md" />
              )}
            </div>
          )}

          {!mic.ligada && (
            <span className="absolute top-2 right-2 w-7 h-7 rounded-full bg-ink/80 flex items-center justify-center">
              <MicOff size={14} />
            </span>
          )}

          <div className="absolute inset-x-0 bottom-2">
            <MedidorVolume compacto stream={mic.stream} gravando={gravando} />
          </div>
        </div>
      </main>

      {/* ---------- Barra inferior: legenda + ações em ícones (some junto, com a mesma animação) ---------- */}
      <footer
        inert={!barrasVisiveis}
        className={`shrink-0 overflow-hidden transition-[height,opacity,transform] duration-300 ease-out ${
          barrasVisiveis ? "h-36 opacity-100 translate-y-0" : "h-0 opacity-0 translate-y-2"
        }`}
      >
        <div className="h-36 px-4 flex flex-col items-center justify-center gap-2.5">
          {/* Legenda em retângulo sutil, logo acima dos botões */}
          <p
            aria-live="polite"
            className="max-w-md rounded-xl bg-white/10 px-3.5 py-1.5 text-center text-xs leading-snug text-paper/80 flex items-center justify-center gap-1.5"
          >
            {gravando && <span className="w-2 h-2 rounded-full bg-danger animate-pulse shrink-0" />}
            {legenda}
          </p>

          <div className="flex items-center gap-3 rounded-[2rem] bg-white/10 p-2.5">
            <BotaoIcone
              rotulo={camera.ligada ? "Desligar câmera" : "Ligar câmera (opcional)"}
              onClick={aoClicarCamera}
              disabled={camera.solicitando}
              className={camera.ligada ? "bg-paper text-ink" : "bg-white/15 text-paper"}
            >
              {camera.ligada ? <Video size={22} /> : <VideoOff size={22} />}
            </BotaoIcone>

            <BotaoIcone
              rotulo={rotuloGravar}
              onClick={aoGravar}
              disabled={!mic.ligada || enviando || finalizando}
              className={
                gravando
                  ? "bg-danger text-white animate-pulse"
                  : respondida
                    ? "bg-white/15 text-paper"
                    : "bg-paper text-ink"
              }
            >
              {enviando ? <Spinner /> : <IconeGravar size={22} />}
            </BotaoIcone>

            <BotaoIcone
              rotulo={ehUltima ? "Finalizar entrevista" : "Próxima pergunta"}
              onClick={aoAvancar}
              disabled={!respondida || gravando || enviando || finalizando}
              className="bg-primary text-paper"
            >
              {finalizando ? <Spinner /> : ehUltima ? <Check size={22} /> : <ArrowRight size={22} />}
            </BotaoIcone>
          </div>
        </div>
      </footer>
    </div>,
    document.body
  );
}