import { API_URL } from "./client";

// O navegador decide o formato: webm (Chrome/Firefox) ou mp4 (Safari).
function extensaoDoBlob(blob) {
  const tipo = blob.type || "";
  if (tipo.includes("mp4")) return "m4a";
  if (tipo.includes("ogg")) return "ogg";
  return "webm";
}

/**
 * Upload da resposta gravada (vídeo+áudio) de uma pergunta. Não usa o
 * `requisitar` de client.js porque esse envio é multipart/form-data --
 * o browser precisa montar o boundary sozinho, então não podemos fixar
 * "Content-Type: application/json" como o wrapper padrão faz.
 */
export async function enviarResposta(token, perguntaId, blob) {
  const formData = new FormData();
  formData.append("arquivo", blob, `resposta.${extensaoDoBlob(blob)}`);

  const resposta = await fetch(`${API_URL}/perguntas/${perguntaId}/resposta`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  const dados = await resposta.json().catch(() => null);

  if (!resposta.ok) {
    const mensagem = dados?.detail || "Não foi possível enviar a resposta.";
    const erro = new Error(typeof mensagem === "string" ? mensagem : "Não foi possível enviar a resposta.");
    erro.status = resposta.status;
    throw erro;
  }

  return dados;
}
