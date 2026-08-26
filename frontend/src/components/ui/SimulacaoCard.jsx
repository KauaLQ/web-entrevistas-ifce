import { ChevronRight, Calendar } from "lucide-react";
import StatusPill from "./StatusPill";
import SeloProtocolo from "./SeloProtocolo";

function formatarData(iso) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

export default function SimulacaoCard({ entrevista, onClick }) {
  const finalizada = entrevista.status === "finalizada";

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 bg-white border border-ink/10 rounded-card p-4 text-left hover:border-primary/40 hover:shadow-md hover:shadow-ink/5 active:scale-[0.99] transition"
    >
      <SeloProtocolo id={entrevista.id} aprovado={finalizada} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-display font-semibold text-ink truncate">{entrevista.cargo_alvo}</h3>
        </div>
        <div className="flex items-center gap-3 text-xs text-ink/50">
          <span className="flex items-center gap-1">
            <Calendar size={12} /> {formatarData(entrevista.data_inicio)}
          </span>
          <StatusPill status={entrevista.status} />
        </div>
      </div>

      <div className="flex flex-col items-end gap-1 shrink-0">
        {finalizada && entrevista.score_final != null ? (
          <span className="font-display font-semibold text-lg text-selo">
            {entrevista.score_final.toFixed(1)}
            <span className="text-xs text-ink/40 font-sans font-normal">/10</span>
          </span>
        ) : (
          <span className="text-xs text-ink/40">
            {entrevista.total_respondidas}/{entrevista.total_perguntas} respondidas
          </span>
        )}
        <ChevronRight size={16} className="text-ink/30" />
      </div>
    </button>
  );
}
