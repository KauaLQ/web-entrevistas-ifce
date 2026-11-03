import { Navigate, Outlet } from "react-router-dom";
import { Loader2, AlertTriangle } from "lucide-react";
import { useAuth } from "../../context/useAuth";
import Button from "../ui/Button";
import ModalCompletarPerfil from "./ModalCompletarPerfil";

function TelaCarregando() {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-paper">
      <Loader2 size={28} className="text-primary animate-spin" />
    </div>
  );
}

export default function ProtectedRoute() {
  const { autenticado, carregando, carregandoPerfil, perfil, erroPerfil, recarregarPerfil, sair } = useAuth();

  if (carregando) return <TelaCarregando />;
  if (!autenticado) return <Navigate to="/entrar" replace />;
  if (carregandoPerfil) return <TelaCarregando />;

  // Falha ao consultar o perfil (queda de rede, backend fora do ar...): não libera o app
  if (erroPerfil || !perfil) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-paper px-4">
        <div className="max-w-md text-center">
          <AlertTriangle size={28} className="mx-auto mb-3 text-danger" />
          <p className="text-sm text-ink/70 mb-4">
            {erroPerfil || "Não foi possível carregar seu perfil."}
          </p>
          <div className="flex gap-3">
            <Button variante="fantasma" onClick={sair}>Sair</Button>
            <Button onClick={recarregarPerfil}>Tentar novamente</Button>
          </div>
        </div>
      </div>
    );
  }

  // Primeiro acesso (ou cadastro interrompido): bloqueia até preencher curso e matrícula
  if (!perfil.perfil_completo) {
    return (
      <div className="min-h-dvh bg-paper">
        <ModalCompletarPerfil />
      </div>
    );
  }

  return <Outlet />;
}