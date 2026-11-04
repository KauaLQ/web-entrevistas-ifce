import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Compass, LayoutDashboard, LogIn } from "lucide-react";
import { useAuth } from "../../context/useAuth";

/**
 * Página 404 independente (fullscreen), sem header nem rodapé, acessível
 * também por visitantes não autenticados. O botão principal se adapta:
 * logado -> /dashboard; deslogado -> /entrar.
 */
export default function NotFoundPage() {
  const { pathname } = useLocation();
  const navegar = useNavigate();
  const { autenticado, carregando } = useAuth();

  const destino = autenticado ? "/dashboard" : "/entrar";
  const rotuloDestino = autenticado ? "Ir para o dashboard" : "Ir para o login";
  const IconeDestino = autenticado ? LayoutDashboard : LogIn;

  return (
    <div className="relative min-h-dvh overflow-hidden bg-gradient-to-br from-ink via-ink to-primary-dark text-paper flex items-center justify-center px-6 py-12">
      {/* Malha quadriculada com fade, a mesma da tela de login */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.08) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.08) 1px, transparent 1px)
          `,
          backgroundSize: "32px 32px",
          maskImage: "radial-gradient(circle at 100% 100%, black 20%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(circle at 100% 100%, black 20%, transparent 75%)",
        }}
      />

      <main className="relative z-10 flex flex-col items-center text-center">
        {/* Selo tracejado, eco do SeloProtocolo dos cards do dashboard */}
        <span className="w-20 h-20 rounded-full border-2 border-dashed border-sage/60 bg-paper/10 text-sage flex items-center justify-center rotate-[-6deg]">
          <Compass size={34} />
        </span>

        <p className="mt-6 font-display font-bold text-7xl sm:text-8xl leading-none text-paper">
          404
        </p>

        <h1 className="mt-4 font-display font-semibold text-xl sm:text-2xl text-paper">
          Página não encontrada
        </h1>
        <p className="mt-2 max-w-sm text-sm sm:text-base text-paper/70 leading-relaxed">
          O endereço que você tentou acessar não existe ou foi movido.
          Confira o link ou volte para o início.
        </p>

        {/* Caminho acessado: ajuda a identificar erro de digitação */}
        <p className="mt-5 max-w-full break-all rounded-xl bg-white/10 px-3.5 py-1.5 font-mono text-xs text-paper/70">
          {pathname}
        </p>

        <div className="mt-8 flex w-full max-w-sm flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => navegar(destino, { replace: true })}
            disabled={carregando}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-paper px-4 py-3 text-base font-semibold text-ink transition-all hover:bg-white active:scale-[0.98] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
          >
            <IconeDestino size={18} />
            {rotuloDestino}
          </button>
          <button
            type="button"
            onClick={() => navegar(-1)}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 px-4 py-3 text-base font-semibold text-paper transition-all hover:bg-white/15 active:scale-[0.98] cursor-pointer"
          >
            <ArrowLeft size={18} />
            Voltar
          </button>
        </div>
      </main>
    </div>
  );
}