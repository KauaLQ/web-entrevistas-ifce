import { Outlet, useLocation } from "react-router-dom";
import Header from "./Header";
import RodapeInstitucional from "./RodapeInstitucional";

export default function AppLayout() {
  const { pathname } = useLocation();

  return (
    <div className="min-h-dvh flex flex-col bg-paper-dim">
      <Header />
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 py-6">
        {/* key = rota: remonta o bloco a cada navegação e reinicia a animação de entrada */}
        <div key={pathname} className="animate-page-in">
          <Outlet />
        </div>
      </main>
      <RodapeInstitucional />
    </div>
  );
}