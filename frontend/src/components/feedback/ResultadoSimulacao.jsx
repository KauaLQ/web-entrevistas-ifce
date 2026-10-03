import { CircleCheck, TrendingUp, Lightbulb, ListChecks } from "lucide-react";
import NotaGlobal from "./NotaGlobal";
import PerguntaAccordion from "./PerguntaAccordion";

function formatarData(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

/**
 * Tela de resultado da simulação.
 *
 * Props:
 *  - entrevista: EntrevistaDetalhe (GET /entrevistas/{id}) -> cargo, perguntas e respostas
 *  - relatorio:  RelatorioEntrevista (GET /entrevistas/{id}/relatorio -> .relatorio)
 *  - geradoEm:   data de geração do relatório (opcional)
 */
export default function ResultadoSimulacao({ entrevista, relatorio, geradoEm }) {
  const perguntas = entrevista.perguntas || [];
  const avaliacoes = relatorio.avaliacao_por_pergunta || [];

  // A IA devolve a avaliação com o texto da pergunta; casamos pelo texto e,
  // se ele vier reescrito, caímos na posição (as perguntas vão na mesma ordem).
  function avaliacaoDa(pergunta, indice) {
    const porTexto = avaliacoes.find((a) => a.pergunta?.trim() === pergunta.texto.trim());
    return (porTexto || avaliacoes[indice])?.avaliacao;
  }

  return (
    <div className="pb-16 space-y-6">
      {/* ---------- Nota global + resumo ---------- */}
      <section className="bg-white border border-ink/10 rounded-card p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 sm:gap-10">
        <NotaGlobal nota={relatorio.score_geral} />

        <div className="flex-1 min-w-0 text-center sm:text-left">
          <h1 className="font-display font-semibold text-xl sm:text-2xl text-ink">
            Resultado da simulação
          </h1>
          <p className="text-sm text-ink/50 mt-0.5">
            {entrevista.cargo_alvo}
            {geradoEm && ` · ${formatarData(geradoEm)}`}
          </p>
          <p className="mt-4 text-sm sm:text-base text-ink/80 leading-relaxed text-justify">
            {relatorio.resumo_geral}
          </p>
        </div>
      </section>

      {/* ---------- Pontos fortes x pontos a melhorar ---------- */}
      <section className="grid md:grid-cols-2 gap-4 items-stretch">
        <div className="bg-white border border-primary/25 rounded-card p-5">
          <h2 className="flex items-center gap-2 font-display font-semibold text-lg text-primary-dark mb-3">
            <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <CircleCheck size={18} />
            </span>
            Pontos fortes
          </h2>
          <ul className="space-y-2.5">
            {relatorio.pontos_fortes.map((ponto, i) => (
              <li key={i} className="flex gap-2.5 text-sm text-ink/80 leading-relaxed text-justify">
                <CircleCheck size={16} className="text-primary shrink-0 mt-0.5" />
                <span>{ponto}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white border border-selo/40 rounded-card p-5">
          <h2 className="flex items-center gap-2 font-display font-semibold text-lg text-[#8a6a22] mb-3">
            <span className="w-8 h-8 rounded-lg bg-selo-dim flex items-center justify-center">
              <TrendingUp size={18} />
            </span>
            Pontos a melhorar
          </h2>
          <ul className="space-y-2.5">
            {relatorio.pontos_a_melhorar.map((ponto, i) => (
              <li key={i} className="flex gap-2.5 text-sm text-ink/80 leading-relaxed text-justify">
                <TrendingUp size={16} className="text-selo shrink-0 mt-0.5" />
                <span>{ponto}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------- Detalhamento por pergunta (accordion) ---------- */}
      <section>
        <h2 className="flex items-center gap-2 font-display font-semibold text-lg text-ink mb-3">
          <ListChecks size={18} className="text-primary" />
          Detalhes por pergunta
        </h2>
        <div className="space-y-2.5">
          {perguntas.map((pergunta, i) => (
            <PerguntaAccordion
              key={pergunta.id}
              numero={i + 1}
              pergunta={pergunta.texto}
              resposta={pergunta.resposta}
              avaliacao={avaliacaoDa(pergunta, i)}
              abertaInicial={i === 0}
            />
          ))}
        </div>
      </section>

      {/* ---------- Recomendações de treino ---------- */}
      {relatorio.recomendacoes?.length > 0 && (
        <section className="bg-white border border-ink/10 rounded-card p-5">
          <h2 className="flex items-center gap-2 font-display font-semibold text-lg text-ink mb-3">
            <Lightbulb size={18} className="text-selo" />
            Para treinar antes da próxima
          </h2>
          <ul className="space-y-2 list-disc pl-5 marker:text-selo">
            {relatorio.recomendacoes.map((rec, i) => (
              <li key={i} className="text-sm text-ink/80 leading-relaxed text-justify">
                {rec}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
