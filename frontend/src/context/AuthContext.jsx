import { createContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [sessao, setSessao] = useState(null);
  // true até o Supabase terminar de restaurar a sessão (localStorage ou retorno do OAuth).
  // Sem isso, o ProtectedRoute redirecionaria pro login antes da sessão chegar.
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    // Dispara no carregamento (INITIAL_SESSION), no login, no logout e a cada
    // renovação automática do token, então a sessão aqui nunca fica velha.
    const { data } = supabase.auth.onAuthStateChange((_evento, novaSessao) => {
      setSessao(novaSessao);
      setCarregando(false);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  async function entrarComGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      // Para onde o Supabase devolve o usuário depois do login (precisa estar na lista de Redirect URLs)
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
    if (error) throw error;
  }

  async function sair() {
    await supabase.auth.signOut();
  }

  // Dados de exibição vêm do Google, via metadata do Supabase
  const user = sessao?.user;
  const meta = user?.user_metadata ?? {};
  const usuario = user
    ? { nome: meta.full_name || meta.name || user.email, email: user.email, avatar: meta.avatar_url }
    : null;

  const valor = {
    token: sessao?.access_token ?? null,
    usuario,
    autenticado: Boolean(sessao),
    carregando,
    entrarComGoogle,
    sair,
  };
  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}