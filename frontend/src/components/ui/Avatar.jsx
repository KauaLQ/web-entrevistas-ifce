import { useState } from "react";

const TAMANHOS = {
  sm: "w-9 h-9 text-sm",
  md: "w-12 h-12 text-base",
  lg: "w-16 h-16 text-xl",
};

/**
 * Avatar do usuário: mostra a foto da conta Google (`src`) quando existir
 * e carregar com sucesso; caso contrário, cai na inicial do nome.
 */
export default function Avatar({ nome, src, tamanho = "md", className = "" }) {
  // Guarda a URL que falhou (e não um boolean): se `src` mudar, tenta a nova foto.
  const [srcComErro, setSrcComErro] = useState(null);
  const mostrarFoto = Boolean(src) && src !== srcComErro;
  const inicial = nome?.trim()?.[0]?.toUpperCase() || "?";

  return (
    <span
      className={`inline-flex items-center justify-center ${TAMANHOS[tamanho]} bg-primary text-paper font-display font-semibold rounded-full select-none shrink-0 overflow-hidden ${className}`}
    >
      {mostrarFoto ? (
        <img
          src={src}
          alt=""
          draggable={false}
          referrerPolicy="no-referrer"
          onError={() => setSrcComErro(src)}
          className="w-full h-full object-cover"
        />
      ) : (
        inicial
      )}
    </span>
  );
}