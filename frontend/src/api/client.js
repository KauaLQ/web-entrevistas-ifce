import { supabase } from "../lib/supabase";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

/**
 * Wrapper único pra todas as chamadas à API. Centraliza:
 * - montagem da URL a partir de VITE_API_URL
 * - token de autenticação: lido do Supabase a cada chamada (o supabase-js já
 *   renova sozinho quando está perto de expirar), então as telas não precisam
 *   carregar o token nem refazer fetch quando ele é renovado
 * - corpo JSON ou FormData (upload multipart: o browser monta o Content-Type sozinho)
 * - leitura do corpo de erro do FastAPI ({ detail: "..." }) numa mensagem amigável
 * - 401: encerra a sessão local; o ProtectedRoute redireciona para /entrar
 */
export default async function requisitar(caminho, { method = "GET", body } = {}) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  const ehFormData = body instanceof FormData;
  const headers = ehFormData ? {} : { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const resposta = await fetch(`${API_URL}${caminho}`, {
    method,
    headers,
    body: ehFormData ? body : body ? JSON.stringify(body) : undefined,
  });

  const dados = await resposta.json().catch(() => null);

  if (!resposta.ok) {
    if (resposta.status === 401) await supabase.auth.signOut();

    const mensagem = dados?.detail || "Não foi possível completar a requisição.";
    const erro = new Error(typeof mensagem === "string" ? mensagem : "Não foi possível completar a requisição.");
    erro.status = resposta.status;
    throw erro;
  }

  return dados;
}

export { API_URL };