import requisitar from "./client";

export function listarEntrevistas(token) {
  return requisitar("/entrevistas", { token });
}

export function criarEntrevista(token, { cargo_alvo, descricao_cargo }) {
  return requisitar("/entrevistas", {
    method: "POST",
    token,
    body: { cargo_alvo, descricao_cargo: descricao_cargo || null },
  });
}
