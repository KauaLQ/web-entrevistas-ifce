import { CircleDot, CircleCheck } from "lucide-react";

const CONFIG = {
  em_andamento: { label: "Em andamento", cor: "bg-selo/15", icone: CircleDot, corTexto: "text-[#8a6a22]" },
  finalizada: { label: "Concluído", cor: "bg-primary/10", icone: CircleCheck, corTexto: "text-primary-dark" },
};

export default function StatusPill({ status }) {
  const cfg = CONFIG[status] || CONFIG.em_andamento;
  const Icone = cfg.icone;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 ${cfg.cor} ${cfg.corTexto}`}>
      <Icone size={12} />
      {cfg.label}
    </span>
  );
}
