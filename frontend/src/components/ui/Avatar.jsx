const TAMANHOS = {
  sm: "w-9 h-9 text-sm",
  md: "w-12 h-12 text-base",
  lg: "w-16 h-16 text-xl",
};

export default function Avatar({ nome, tamanho = "md", className = "" }) {
  const inicial = nome?.trim()?.[0]?.toUpperCase() || "?";
  return (
    <span
      className={`inline-flex items-center justify-center ${TAMANHOS[tamanho]} bg-primary text-paper font-display font-semibold rounded-full select-none shrink-0 ${className}`}
    >
      {inicial}
    </span>
  );
}
