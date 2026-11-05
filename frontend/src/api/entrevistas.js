import requisitar from "./client";

export function listarEntrevistas() {
  return requisitar("/entrevistas");
}

export function criarEntrevista({ cargo_alvo, descricao_cargo }) {
  return requisitar("/entrevistas", {
    method: "POST",
    body: { cargo_alvo, descricao_cargo: descricao_cargo || null },
  });
}

export function obterEntrevista(entrevistaId) {
  return requisitar(`/entrevistas/${entrevistaId}`);
}

// Gera as perguntas da entrevista via IA (chamado uma única vez, ao entrar
// na sala de simulação pela primeira vez).
export function iniciarEntrevista(entrevistaId) {
  return requisitar(`/entrevistas/${entrevistaId}/iniciar`, { method: "POST" });
}

// Gera o relatório final a partir das respostas já enviadas e marca a
// entrevista como finalizada.
export function finalizarEntrevista(entrevistaId) {
  return requisitar(`/entrevistas/${entrevistaId}/finalizar`, { method: "POST" });
}

// Consulta o relatório já gerado, sem disparar nova geração pela IA.
// Retorna null se a entrevista ainda não tem relatório válido.
export function obterRelatorio(entrevistaId) {
  return requisitar(`/entrevistas/${entrevistaId}/relatorio`);
}