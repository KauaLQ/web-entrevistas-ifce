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
  // O token é obtido pelo próprio `requisitar` (api/client.js).
  useEffect(() => {
    if (!userId) return;
    let cancelado = false;

    async function carregar() {
      try {
        const dados = await obterPerfil();
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
    const atualizado = await atualizarPerfil({ curso, matricula });
    setPerfilSalvo({ userId, dados: atualizado, erro: "" });
  }

  // ---------- Valores derivados ----------
  const perfilDoUsuario = perfilSalvo.userId === userId ? perfilSalvo : null;
  const carregandoPerfil = Boolean(userId) && !perfilDoUsuario;
  const perfil = perfilDoUsuario?.dados ?? null;
  const erroPerfil = perfilDoUsuario?.erro ?? "";

  // Nome: o do nosso banco manda (permite personalização futura); o do Google é só o
  // valor inicial/alternativo. Foto: vem sempre do Google (metadata do Supabase).
  const user = sessao?.user;
  const meta = user?.user_metadata ?? {};
  const usuario = user
    ? {
        nome: perfil?.nome || meta.full_name || meta.name || user.email,
        email: user.email,
        avatar: meta.avatar_url || meta.picture || null,
        curso: perfil?.curso,
        matricula: perfil?.matricula,
      }
    : null;

  const valor = {
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