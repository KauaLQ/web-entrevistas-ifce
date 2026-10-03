/**
 * Nota geral da entrevista (0 a 10) em destaque: anel de progresso com o
 * valor no centro. A cor acompanha a faixa de desempenho e o rótulo
 * traduz a nota em linguagem simples, sem depender só da cor.
 */
function faixa(nota) {
  if (nota >= 9) return { rotulo: "Excelente", cor: "var(--color-primary)" };
  if (nota >= 7) return { rotulo: "Muito bom", cor: "var(--color-primary)" };
  if (nota >= 5) return { rotulo: "Em evolução", cor: "var(--color-selo)" };
  return { rotulo: "Precisa de mais treino", cor: "var(--color-danger)" };
}

const RAIO = 54;
const CIRCUNFERENCIA = 2 * Math.PI * RAIO;

export default function NotaGlobal({ nota }) {
  const valor = Math.min(10, Math.max(0, Number(nota) || 0));
  const { rotulo, cor } = faixa(valor);
  const progresso = (valor / 10) * CIRCUNFERENCIA;

  return (
    <div className="flex flex-col items-center text-center">
      <div
        className="relative w-40 h-40 sm:w-44 sm:h-44"
        role="img"
        aria-label={`Nota geral: ${valor.toFixed(1)} de 10. ${rotulo}.`}
      >
        <svg viewBox="0 0 128 128" className="w-full h-full -rotate-90" aria-hidden="true">
          <circle cx="64" cy="64" r={RAIO} fill="none" stroke="currentColor" strokeWidth="10" className="text-ink/10" />
          <circle
            cx="64"
            cy="64"
            r={RAIO}
            fill="none"
            stroke={cor}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${progresso} ${CIRCUNFERENCIA}`}
            style={{ transition: "stroke-dasharray 0.8s ease-out" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display font-semibold text-5xl sm:text-6xl text-ink leading-none">
            {valor.toFixed(1)}
          </span>
          <span className="mt-1 text-sm text-ink/40">de 10</span>
        </div>
      </div>
      <p className="mt-3 font-display font-semibold text-lg" style={{ color: cor }}>
        {rotulo}
      </p>
    </div>
  );
}
