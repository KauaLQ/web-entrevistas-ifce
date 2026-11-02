import { Navigate, Outlet } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "../../context/useAuth";

export default function ProtectedRoute() {
  const { autenticado, carregando } = useAuth();

  if (carregando) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-paper">
        <Loader2 size={28} className="text-primary animate-spin" />
      </div>
    );
  }
  if (!autenticado) return <Navigate to="/entrar" replace />;
  return <Outlet />;
}