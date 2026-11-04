import { useCallback, useEffect, useLayoutEffect, useRef } from "react";

/**
 * Ajusta o tamanho da fonte de um texto para que ele caiba inteiro na altura
 * do container, sem rolagem. Faz uma busca binária entre `min` e `max` (px).
 *
 * - containerRef: elemento com altura limitada (flex-1 min-h-0 overflow-hidden)
 * - textoRef: o elemento de texto dentro dele (bloco, com altura automática)
 *
 * Reajusta quando `dependencia` (ex.: o texto) muda, quando o container
 * muda de tamanho (barras ocultando/exibindo, rotação, resize) e quando as
 * fontes web terminam de carregar. O fontSize é escrito direto no DOM, sem
 * state, para não re-renderizar a cada passo da animação.
 */
export function useAjusteFonte(dependencia, { min = 14, max = 28 } = {}) {
  const containerRef = useRef(null);
  const textoRef = useRef(null);

  const ajustar = useCallback(() => {
    const container = containerRef.current;
    const texto = textoRef.current;
    if (!container || !texto) return;

    const alturaMaxima = container.clientHeight;
    let menor = min;
    let maior = max;

    while (menor < maior) {
      const meio = Math.ceil((menor + maior) / 2);
      texto.style.fontSize = `${meio}px`;
      if (texto.offsetHeight <= alturaMaxima) menor = meio;
      else maior = meio - 1;
    }
    texto.style.fontSize = `${menor}px`;
  }, [min, max]);

  // Antes da pintura: o texto nunca aparece com o tamanho errado
  useLayoutEffect(() => {
    ajustar();
  }, [ajustar, dependencia]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observador = new ResizeObserver(ajustar);
    observador.observe(container);
    document.fonts?.ready.then(ajustar);

    return () => observador.disconnect();
  }, [ajustar]);

  return { containerRef, textoRef };
}