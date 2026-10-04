import { useRef } from "react";
import { Mic } from "lucide-react";
import { useNivelMicrofone } from "../../hooks/useNivelMicrofone";

const QTD_BARRAS = 28;
const FRAMES_POR_AMOSTRA = 3; // ~20 amostras/s: rola num ritmo agradável

export default function MedidorVolume({ stream, gravando = false }) {
  const barrasRef = useRef([]);
  const historicoRef = useRef(new Array(QTD_BARRAS).fill(0));
  const contadorRef = useRef(0);

  useNivelMicrofone(stream, (nivel) => {
    contadorRef.current += 1;
    if (contadorRef.current % FRAMES_POR_AMOSTRA !== 0) return;

    const historico = historicoRef.current;
    historico.shift();
    historico.push(nivel);

    historico.forEach((valor, i) => {
      const barra = barrasRef.current[i];
      // altura mínima de 8% pra barra nunca sumir; escrita direta no DOM, sem re-render
      if (barra) barra.style.height = `${8 + valor * 92}%`;
    });
  });

  return (
    <div className="flex flex-col items-center gap-3 w-full px-6">
      <span className="flex items-center gap-1.5 text-paper/70 text-sm">
        <Mic size={16} className={gravando ? "text-danger" : ""} />
        {gravando ? "Gravando... pode falar" : "Fale algo para testar o microfone"}
      </span>

      <div className="flex items-center justify-center gap-[3px] h-14 w-full max-w-[280px]" aria-hidden="true">
        {Array.from({ length: QTD_BARRAS }, (_, i) => (
          <span
            key={i}
            ref={(el) => (barrasRef.current[i] = el)}
            className={`w-1.5 rounded-full transition-[height] duration-75 ${
              gravando ? "bg-danger" : "bg-paper/70"
            }`}
            style={{ height: "8%" }}
          />
        ))}
      </div>
    </div>
  );
}