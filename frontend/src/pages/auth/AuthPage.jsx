import { useState } from "react";
import { Navigate } from "react-router-dom";
import AuthLayout from "./AuthLayout";
import Button from "../../components/ui/Button";
import { useAuth } from "../../context/useAuth";

function IconeGoogle() {
  return (
    <svg viewBox="0 0 48 48" width="18" height="18" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

export default function AuthPage() {
  const { autenticado, carregando: carregandoSessao, entrarComGoogle } = useAuth();
  const [erro, setErro] = useState("");
  const [redirecionando, setRedirecionando] = useState(false);

  if (carregandoSessao) return null;
  if (autenticado) return <Navigate to="/dashboard" replace />;

  async function aoClicar() {
    setErro("");
    setRedirecionando(true);
    try {
      await entrarComGoogle(); // em caso de sucesso o navegador sai daqui para o Google
    } catch (err) {
      setErro(err.message || "Não foi possível iniciar o login com Google.");
      setRedirecionando(false);
    }
  }

  return (
    <AuthLayout>
      <div className="mb-7">
        <h2 className="font-display text-2xl text-ink">Bem-vindo</h2>
        <p className="mt-1 text-ink/60 text-sm">
          Entre com sua conta Google para começar a treinar suas entrevistas.
        </p>
      </div>

      {erro && (
        <div role="alert" className="mb-4 rounded-lg bg-danger/10 px-3.5 py-2.5 text-sm text-danger">
          {erro}
        </div>
      )}

      <Button variante="contorno" onClick={aoClicar} carregando={redirecionando}>
        <IconeGoogle />
        Entrar com Google
      </Button>
    </AuthLayout>
  );
}