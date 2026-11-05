import requisitar from "./client";

// O navegador decide o formato: webm (Chrome/Firefox) ou mp4 (Safari).
function extensaoDoBlob(blob) {
  const tipo = blob.type || "";
  if (tipo.includes("mp4")) return "m4a";
  if (tipo.includes("ogg")) return "ogg";
  return "webm";
}

/**
 * Upload da resposta gravada (áudio) de uma pergunta. O corpo é um FormData
 * (multipart/form-data): o `requisitar` detecta isso e deixa o browser
 * montar o Content-Type com o boundary.
 */
export function enviarResposta(perguntaId, blob) {
  const formData = new FormData();
  formData.append("arquivo", blob, `resposta.${extensaoDoBlob(blob)}`);

  return requisitar(`/perguntas/${perguntaId}/resposta`, { method: "POST", body: formData });
}