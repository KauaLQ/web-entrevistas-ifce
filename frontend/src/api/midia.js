import { API_URL } from "./client";

/**
 * Upload da resposta gravada (vídeo+áudio) de uma pergunta. Não usa o
 * `requisitar` de client.js porque esse envio é multipart/form-data --
 * o browser precisa montar o boundary sozinho, então não podemos fixar
 * "Content-Type: application/json" como o wrapper padrão faz.
 */
export async function enviarResposta(token, perguntaId, blob, nomeArquivo = "resposta.webm") {
  const formData = new FormData();
  formData.append("arquivo", blob, nomeArquivo);

  const resposta = await fetch(`${API_URL}/perguntas/${perguntaId}/resposta`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  const dados = await resposta.json().catch(() => null);

  if (!resposta.ok) {
    const mensagem = dados?.detail || "Não foi possível enviar a resposta.";
    throw new Error(typeof mensagem === "string" ? mensagem : "Não foi possível enviar a resposta.");
  }

  return dados;
}
