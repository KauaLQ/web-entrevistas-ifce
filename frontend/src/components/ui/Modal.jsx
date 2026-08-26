import { X } from "lucide-react";

/**
 * Modal em bottom-sheet no mobile e diálogo centralizado a partir do
 * breakpoint `sm`. `fixed inset-0` cobre a viewport inteira (não há
 * MobileFrame nesse projeto — é um portal institucional de uso comum
 * em desktop e mobile).
 */
export default function Modal({ aberto, aoFechar, titulo, subtitulo, children }) {
  if (!aberto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-ink/50 animate-fade-in" onClick={aoFechar} />
      <div className="relative w-full sm:max-w-lg bg-paper rounded-t-3xl sm:rounded-2xl px-6 pt-5 pb-8 sm:py-7 max-h-[90%] overflow-y-auto animate-slide-up shadow-2xl">
        <div className="flex items-start justify-between mb-1">
          <div>
            <h2 className="font-display font-semibold text-xl text-ink">{titulo}</h2>
            {subtitulo && <p className="text-sm text-ink/50 mt-0.5">{subtitulo}</p>}
          </div>
          <button
            onClick={aoFechar}
            aria-label="Fechar"
            className="p-1.5 -mr-1.5 -mt-1 rounded-full text-ink/40 hover:bg-ink/5 shrink-0"
          >
            <X size={20} />
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
