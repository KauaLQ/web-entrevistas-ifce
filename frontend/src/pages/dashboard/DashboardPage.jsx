import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, ClipboardList, Plus } from "lucide-react";
import { listarEntrevistas, criarEntrevista } from "../../api/entrevistas";
import { useAuth } from "../../context/useAuth";
import Avatar from "../../components/ui/Avatar";
import Button from "../../components/ui/Button";
import SimulacaoCard from "../../components/ui/SimulacaoCard";
import ModalNovaSimulacao from "./ModalNovaSimulacao";

export default function DashboardPage() {
  const { token, usuario } = useAuth();
  const navegar = useNavigate();

  const [entrevistas, setEntrevistas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [modalAberto, setModalAberto] = useState(false);

  useEffect(() => {
    let cancelado = false;
    async function carregar() {
      setCarregando(true);
      setErro("");
      try {
        const dados = await listarEntrevistas(token);
        if (!cancelado) setEntrevistas(dados);
      } catch (err) {
        if (!cancelado) setErro(err.message);
      } finally {
        if (!cancelado) setCarregando(false);
      }
    }
    carregar();
    return () => { cancelado = true; };
  }, [token]);

  async function aoCriarSimulacao({ cargo_alvo, descricao_cargo }) {
    const nova = await criarEntrevista(token, { cargo_alvo, descricao_cargo });
    setModalAberto(false);
    navegar(`/simulacao/${nova.id}`);
  }

  function abrirEntrevista(entrevista) {
    if (entrevista.status === "finalizada") {
      navegar(`/feedback/${entrevista.id}`);
    } else {
      navegar(`/simulacao/${entrevista.id}`);
    }
  }

  const identificacao = [usuario?.curso, usuario?.matricula].filter(Boolean).join(" · ");

  return (
    <div className="pb-16">
      {/* ---------- Cabeçalho de boas-vindas ---------- */}
      <section className="bg-white border border-ink/10 rounded-card p-5 sm:p-6 mb-6 flex flex-col sm:flex-row sm:items-center gap-5">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Avatar nome={usuario?.nome} tamanho="lg" />
          <div className="min-w-0">
            <p className="text-sm text-ink/50">Bem-vindo(a) de volta,</p>
            <h1 className="font-display font-semibold text-xl sm:text-2xl text-ink truncate">
              {usuario?.nome || "Estudante"}
            </h1>
            {identificacao && <p className="text-sm text-ink/50 mt-0.5">{identificacao}</p>}
          </div>
        </div>

        <Button onClick={() => setModalAberto(true)} className="sm:w-auto sm:px-6">
          <Plus size={18} />
          Nova simulação
        </Button>
      </section>

      {erro && (
        <div className="mb-4 rounded-lg bg-danger/10 px-3.5 py-2.5 text-sm text-danger">{erro}</div>
      )}

      {/* ---------- Histórico de simulações ---------- */}
      <div className="flex items-center gap-2 mb-3">
        <ClipboardList size={18} className="text-primary" />
        <h2 className="font-display font-semibold text-lg text-ink">Histórico de simulações</h2>
      </div>

      {carregando ? (
        <div className="flex justify-center py-14">
          <span className="w-6 h-6 border-2 border-ink/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : entrevistas.length === 0 ? (
        <div className="text-center bg-white border border-dashed border-ink/15 rounded-card py-14 px-6">
          <Sparkles size={22} className="mx-auto mb-2 text-primary" />
          <p className="text-ink/60 text-sm max-w-xs mx-auto">
            Você ainda não realizou nenhuma simulação. Toque em{" "}
            <strong className="text-ink">Nova simulação</strong> para praticar sua primeira entrevista.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {entrevistas.map((entrevista) => (
            <SimulacaoCard
              key={entrevista.id}
              entrevista={entrevista}
              onClick={() => abrirEntrevista(entrevista)}
            />
          ))}
        </div>
      )}

      <ModalNovaSimulacao
        aberto={modalAberto}
        aoFechar={() => setModalAberto(false)}
        aoCriar={aoCriarSimulacao}
      />
    </div>
  );
}
