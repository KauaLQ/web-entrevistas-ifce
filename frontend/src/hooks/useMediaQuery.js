import { useCallback, useSyncExternalStore } from "react";

/**
 * Acompanha uma media query CSS (ex.: "(max-width: 1023px)") e re-renderiza
 * quando ela muda. Usa useSyncExternalStore para não precisar de effect + state.
 */
export function useMediaQuery(query) {
  const assinar = useCallback(
    (aoMudar) => {
      const lista = window.matchMedia(query);
      lista.addEventListener("change", aoMudar);
      return () => lista.removeEventListener("change", aoMudar);
    },
    [query]
  );

  return useSyncExternalStore(
    assinar,
    () => window.matchMedia(query).matches,
    () => false
  );
}