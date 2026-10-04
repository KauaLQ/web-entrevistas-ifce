import { useState } from "react";
import { ChevronDown, Bot, UserRound, Sparkles, MicOff } from "lucide-react";
import { API_URL } from "../../api/client";

/**
 * Uma pergunta da entrevista: cabeçalho recolhido com número e texto;
 * ao abrir, mostra a resposta transcrita do aluno, a mídia gravada
 * (quando existir) e a crítica gerada pela IA para aquela resposta.
 */
export default function PerguntaAccordion({ numero, pergunta, resposta, avaliacao, abertaInicial = false }) {
  const [aberta, setAberta] = useState(abertaInicial);
  const transcricao = resposta?.transcricao_texto?.trim();

  return (
    <div className="bg-white border border-ink/10 rounded-card overflow-hidden">
      <button
        type="button"
        onClick={() => setAberta((v) => !v)}
        aria-expanded={aberta}
        className="w-full flex items-start gap-3 p-4 text-left hover:bg-paper/60 transition-colors"
      >
        <span className="shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary-dark font-display font-semibold text-sm flex items-center justify-center">
          {numero}
        </span>
        <span className="flex-1 min-w-0 text-sm sm:text-base font-medium text-ink leading-snug text-justify">
          {pergunta}
        </span>
        <ChevronDown
          size={18}
          className={`mt-0.5 text-ink/40 shrink-0 transition-transform ${aberta ? "rotate-180" : ""}`}
        />
      </button>

      {aberta && (
        <div className="border-t border-ink/10 p-4 space-y-4 bg-paper/40">
          {/* Resposta do aluno */}
          <section>
            <h4 className="flex items-center gap-1.5 text-sm font-semibold text-ink/70 mb-1.5">
              <UserRound size={15} /> Sua resposta
            </h4>
            
            {/* Caso queira, futuramente, adicionar a transcrição. Por hora, será exibido apenas o áudio e a avaliação */}
            {/* {transcricao ? (
              <p className="text-sm text-ink/80 leading-relaxed bg-white border border-ink/10 rounded-xl px-3.5 py-3 whitespace-pre-line text-justify">
                {transcricao}
              </p>
            ) : (
              <p className="flex items-center gap-2 text-sm text-ink/50 bg-white border border-dashed border-ink/15 rounded-xl px-3.5 py-3">
                <MicOff size={15} className="shrink-0" />
                Nenhuma fala compreensível foi identificada nesta gravação.
              </p>
            )} */}

            {resposta?.audio_path && (
              <audio
                controls
                preload="metadata"
                src={`${API_URL}/${resposta.audio_path}`}
                className="mt-2 w-full h-9"
              />
            )}
          </section>

          {/* Crítica da IA */}
          <section>
            <h4 className="flex items-center gap-1.5 text-sm font-semibold text-ink/70 mb-1.5">
              <Sparkles size={15} className="text-selo" /> Avaliação da entrevistadora
            </h4>
            {avaliacao ? (
              <p className="text-sm text-ink/80 leading-relaxed bg-selo-dim border border-selo/30 rounded-xl px-3.5 py-3 text-justify">
                {avaliacao}
              </p>
            ) : (
              <p className="flex items-center gap-2 text-sm text-ink/50">
                <Bot size={15} className="shrink-0" /> A IA não registrou comentário para esta pergunta.
              </p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
