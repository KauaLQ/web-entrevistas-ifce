import requisitar from "./client";

export function obterPerfil() {
  return requisitar("/usuarios/eu");
}

export function atualizarPerfil({ curso, matricula }) {
  return requisitar("/usuarios/eu", { method: "PUT", body: { curso, matricula } });
}