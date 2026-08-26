import { LogOut, GraduationCap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import Avatar from "../ui/Avatar";

export default function Header() {
  const { usuario, sair } = useAuth();
  const navegar = useNavigate();

  function aoSair() {
    sair();
    navegar("/entrar", { replace: true });
  }

  return (
    <header className="sticky top-0 z-30 bg-paper/95 backdrop-blur border-b border-ink/10">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 font-display font-semibold text-ink">
          <span className="w-8 h-8 rounded-lg bg-primary text-paper flex items-center justify-center">
            <GraduationCap size={18} />
          </span>
          <span className="hidden sm:inline">Entrevistas IFCE</span>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden sm:flex items-center gap-2 min-w-0">
            <Avatar nome={usuario?.nome} tamanho="sm" />
            <span className="text-sm text-ink/80 max-w-[10rem] truncate">{usuario?.nome}</span>
          </div>
          <button
            onClick={aoSair}
            aria-label="Sair da conta"
            className="p-2 rounded-lg text-ink/50 hover:text-danger hover:bg-danger/10 transition-colors shrink-0"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}
