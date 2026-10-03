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

export function obterEntrevista(token, entrevistaId) {
  return requisitar(`/entrevistas/${entrevistaId}`, { token });
}

// Gera as perguntas da entrevista via IA (chamado uma única vez, ao entrar
// na sala de simulação pela primeira vez).
export function iniciarEntrevista(token, entrevistaId) {
  return requisitar(`/entrevistas/${entrevistaId}/iniciar`, { method: "POST", token });
}

// Gera o relatório final a partir das respostas já enviadas e marca a
// entrevista como finalizada.
export function finalizarEntrevista(token, entrevistaId) {
  return requisitar(`/entrevistas/${entrevistaId}/finalizar`, { method: "POST", token });
}

// Consulta o relatório já gerado, sem disparar nova geração pela IA.
// Retorna null se a entrevista ainda não tem relatório válido.
export function obterRelatorio(token, entrevistaId) {
  return requisitar(`/entrevistas/${entrevistaId}/relatorio`, { token });
}
