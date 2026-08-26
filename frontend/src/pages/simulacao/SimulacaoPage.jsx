import { useParams, useNavigate } from "react-router-dom";
import { Video, ArrowLeft } from "lucide-react";
import Button from "../../components/ui/Button";

/**
 * Sala de simulação (câmera + áudio + perguntas da IA). Fora do escopo
 * desta etapa — a rota já existe e recebe o id da entrevista criada no
 * dashboard, pronta para a próxima implementação.
 */
export default function SimulacaoPage() {
  const { entrevistaId } = useParams();
  const navegar = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center text-center py-20 px-4">
      <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
        <Video size={24} />
      </div>
      <h1 className="font-display font-semibold text-xl text-ink mb-1">Sala de simulação</h1>
      <p className="text-sm text-ink/50 max-w-sm mb-6">
        A sala da entrevista Nº {String(entrevistaId).padStart(4, "0")} será implementada aqui:
        câmera, áudio e as perguntas geradas pela IA.
      </p>
      <Button variante="fantasma" onClick={() => navegar("/dashboard")} className="w-auto px-5">
        <ArrowLeft size={16} />
        Voltar ao dashboard
      </Button>
    </div>
  );
}
