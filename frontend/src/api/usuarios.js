import requisitar from "./client";

export function obterPerfil(token) {
  return requisitar("/usuarios/eu", { token });
}

export function atualizarPerfil(token, { curso, matricula }) {
  return requisitar("/usuarios/eu", { method: "PUT", token, body: { curso, matricula } });
}