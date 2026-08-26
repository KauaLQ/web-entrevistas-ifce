import { createContext, useState } from "react";

const CHAVE_TOKEN = "entrevistas_ifce_token";
const CHAVE_USUARIO = "entrevistas_ifce_usuario";

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(CHAVE_TOKEN));
  const [usuario, setUsuario] = useState(() => {
    const salvo = localStorage.getItem(CHAVE_USUARIO);
    return salvo ? JSON.parse(salvo) : null;
  });

  function entrar(tokenNovo, usuarioNovo) {
    localStorage.setItem(CHAVE_TOKEN, tokenNovo);
    localStorage.setItem(CHAVE_USUARIO, JSON.stringify(usuarioNovo));
    setToken(tokenNovo);
    setUsuario(usuarioNovo);
  }

  function sair() {
    localStorage.removeItem(CHAVE_TOKEN);
    localStorage.removeItem(CHAVE_USUARIO);
    setToken(null);
    setUsuario(null);
  }

  const valor = { token, usuario, autenticado: Boolean(token), entrar, sair };
  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}
