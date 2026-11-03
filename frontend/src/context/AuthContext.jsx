import { createContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { obterPerfil, atualizarPerfil } from "../api/usuarios";

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [sessao, setSessao] = useState(null);
  // true até o Supabase terminar de restaurar a sessão (localStorage ou retorno do OAuth).
  const [carregando, setCarregando] = useState(true);

  // Perfil do backend (curso/matrícula). Guardado junto com o id de quem ele pertence:
  // se o usuário mudar (logout/login), o perfil antigo é ignorado automaticamente.
  const [perfilSalvo, setPerfilSalvo] = useState({ userId: null, dados: null, erro: "" });
  const [tentativa, setTentativa] = useState(0);

  const userId = sessao?.user?.id ?? null;

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_evento, novaSessao) => {
      setSessao(novaSessao);
      setCarregando(false);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  // Busca o perfil uma vez por usuário (e de novo só se pedirem "tentar novamente").
  // Depende do userId, e não do token, pra não rebuscar a cada renovação de token.
  useEffect(() => {
    if (!userId) return;
    let cancelado = false;

    async function carregar() {
      try {
        const { data } = await supabase.auth.getSession();
        const dados = await obterPerfil(data.session?.access_token);
        if (!cancelado) setPerfilSalvo({ userId, dados, erro: "" });
      } catch (err) {
        if (!cancelado) setPerfilSalvo({ userId, dados: null, erro: err.message });
      }
    }
    carregar();
    return () => { cancelado = true; };
  }, [userId, tentativa]);

  async function entrarComGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
    if (error) throw error;
  }

  async function sair() {
    await supabase.auth.signOut();
  }

  function recarregarPerfil() {
    setPerfilSalvo({ userId: null, dados: null, erro: "" }); // volta pro estado "carregando"
    setTentativa((t) => t + 1);
  }

  async function salvarPerfil({ curso, matricula }) {
    const atualizado = await atualizarPerfil(sessao.access_token, { curso, matricula });
    setPerfilSalvo({ userId, dados: atualizado, erro: "" });
  }

  // ---------- Valores derivados ----------
  const perfilDoUsuario = perfilSalvo.userId === userId ? perfilSalvo : null;
  const carregandoPerfil = Boolean(userId) && !perfilDoUsuario;
  const perfil = perfilDoUsuario?.dados ?? null;
  const erroPerfil = perfilDoUsuario?.erro ?? "";

  // Nome/avatar vêm do Google (metadata do Supabase); curso/matrícula vêm do nosso banco
  const user = sessao?.user;
  const meta = user?.user_metadata ?? {};
  const usuario = user
    ? {
        nome: meta.full_name || meta.name || user.email,
        email: user.email,
        avatar: meta.avatar_url,
        curso: perfil?.curso,
        matricula: perfil?.matricula,
      }
    : null;

  const valor = {
    token: sessao?.access_token ?? null,
    usuario,
    autenticado: Boolean(sessao),
    carregando,
    perfil,
    carregandoPerfil,
    erroPerfil,
    recarregarPerfil,
    salvarPerfil,
    entrarComGoogle,
    sair,
  };
  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}