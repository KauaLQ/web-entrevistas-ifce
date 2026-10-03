import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, AlertTriangle, Plus } from "lucide-react";
import Button from "../../components/ui/Button";
import ResultadoSimulacao from "../../components/feedback/ResultadoSimulacao";
import { useAuth } from "../../context/useAuth";
import { obterEntrevista, obterRelatorio } from "../../api/entrevistas";

export default function FeedbackPage() {
  const { entrevistaId } = useParams();
  const navegar = useNavigate();
  const { token } = useAuth();

  const [entrevista, setEntrevista] = useState(null);
  const [resposta, setResposta] = useState(null); // { relatorio, gerado_em }
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let cancelado = false;
    async function carregar() {
      setCarregando(true);
      setErro("");
      try {
        const [detalhe, relatorio] = await Promise.all([
          obterEntrevista(token, entrevistaId),
          obterRelatorio(token, entrevistaId),
        ]);
        if (cancelado) return;
        setEntrevista(detalhe);
        setResposta(relatorio);
      } catch (err) {
        if (!cancelado) setErro(err.message);
      } finally {
        if (!cancelado) setCarregando(false);
      }
    }
    carregar();
    return () => { cancelado = true; };
  }, [token, entrevistaId]);

  if (carregando) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 size={28} className="text-primary animate-spin" />
        <p className="text-sm text-ink/50">Carregando seu resultado...</p>
      </div>
    );
  }

  if (erro || !entrevista || !resposta) {
    return (
      <div className="max-w-md mx-auto text-center py-20 px-4">
        <AlertTriangle size={28} className="mx-auto mb-3 text-danger" />
        <p className="text-sm text-ink/70 mb-4">
          {erro || "O relatório desta entrevista ainda não está disponível. Conclua a simulação para gerá-lo."}
        </p>
        <Button variante="contorno" className="w-auto px-5" onClick={() => navegar("/dashboard")}>
          Voltar ao dashboard
        </Button>
      </div>
    );
  }

  return (
    <>
      <ResultadoSimulacao entrevista={entrevista} relatorio={resposta.relatorio} geradoEm={resposta.gerado_em} />
      <div className="flex flex-col sm:flex-row gap-3 pb-10">
        <Button variante="contorno" onClick={() => navegar("/dashboard")}>
          <ArrowLeft size={18} />
          Voltar ao dashboard
        </Button>
      </div>
    </>
  );
}
