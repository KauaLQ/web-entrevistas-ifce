import { Outlet, useLocation } from "react-router-dom";
import Header from "./Header";
import RodapeInstitucional from "./RodapeInstitucional";

export default function AppLayout() {
  const { pathname } = useLocation();

  return (
    // data-layout="app" é o marcador que o index.css usa (via html:has) para aplicar
    // o fundo geral (cor + bolinhas) e a reserva da scrollbar só nas páginas internas.
    // O fundo em si é pintado no <html>, por isso este wrapper não define background.
    <div data-layout="app" className="min-h-dvh sm:px-6">
      {/* Container único: header + conteúdo + rodapé compartilham exatamente a mesma largura
          e encostam nas bordas superior e inferior da página. */}
      <div className="mx-auto w-full max-w-3xl min-h-dvh flex flex-col bg-paper sm:border-x sm:border-ink/10 sm:shadow-sm sm:shadow-ink/5">
        <Header />
        <main className="flex-1 w-full px-4 sm:px-6 py-6">
          {/* key = rota: remonta o bloco a cada navegação e reinicia a animação de entrada */}
          <div key={pathname} className="animate-page-in">
            <Outlet />
          </div>
        </main>
        <RodapeInstitucional />
      </div>
    </div>
  );
}