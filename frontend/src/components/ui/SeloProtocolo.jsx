/**
 * Elemento de assinatura visual do app: um "selo de protocolo" circular,
 * como o carimbo numerado de um processo na coordenação de estágios.
 * Cada simulação ganha um número de protocolo (baseado no id), reforçando
 * a seriedade do processo sem parecer burocrático; um único detalhe
 * ilustrativo por card, nada mais.
 */
export default function SeloProtocolo({ id, aprovado = false }) {
  const numero = String(id).padStart(4, "0");
  return (
    <div
      className={`shrink-0 w-14 h-14 rounded-full border-2 border-dashed flex flex-col items-center justify-center rotate-[-6deg] ${
        aprovado ? "border-selo text-selo" : "border-sage text-ink/40"
      }`}
      title={`Protocolo Nº ${numero}`}
    >
      <span className="font-mono text-[8px] tracking-widest leading-none uppercase">Nº</span>
      <span className="font-mono text-sm font-semibold leading-tight">{numero}</span>
    </div>
  );
}
