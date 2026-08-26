import { useParams, useNavigate } from "react-router-dom";
import { FileText, ArrowLeft } from "lucide-react";
import Button from "../../components/ui/Button";

/**
 * Relatório de feedback (score + pontos fortes/a melhorar). Fora do
 * escopo desta etapa — a rota já existe e recebe o id da entrevista
 * concluída, pronta para a próxima implementação.
 */
export default function FeedbackPage() {
  const { entrevistaId } = useParams();
  const navegar = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center text-center py-20 px-4">
      <div className="w-14 h-14 rounded-full bg-selo/15 text-selo flex items-center justify-center mb-4">
        <FileText size={24} />
      </div>
      <h1 className="font-display font-semibold text-xl text-ink mb-1">Relatório de feedback</h1>
      <p className="text-sm text-ink/50 max-w-sm mb-6">
        O feedback da entrevista Nº {String(entrevistaId).padStart(4, "0")} será exibido aqui:
        nota geral, pontos fortes e pontos a melhorar.
      </p>
      <Button variante="fantasma" onClick={() => navegar("/dashboard")} className="w-auto px-5">
        <ArrowLeft size={16} />
        Voltar ao dashboard
      </Button>
    </div>
  );
}
