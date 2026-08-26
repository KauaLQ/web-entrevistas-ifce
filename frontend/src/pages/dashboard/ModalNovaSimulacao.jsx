import { useState } from "react";
import { Briefcase } from "lucide-react";
import Modal from "../../components/ui/Modal";
import TextField from "../../components/ui/TextField";
import Button from "../../components/ui/Button";

const AREAS_SUGERIDAS = [
  "Mecatrônica Industrial",
  "Desenvolvimento de Software",
  "Redes de Computadores",
  "Edificações",
  "Eletrotécnica",
  "Administração",
  "Automação Industrial",
  "Design Gráfico",
];

export default function ModalNovaSimulacao({ aberto, aoFechar, aoCriar }) {
  const [area, setArea] = useState("");
  const [contexto, setContexto] = useState("");
  const [erro, setErro] = useState("");
  const [criando, setCriando] = useState(false);

  function fechar() {
    if (criando) return;
    setArea("");
    setContexto("");
    setErro("");
    aoFechar();
  }

  async function aoSubmeter(e) {
    e.preventDefault();
    setErro("");
    if (area.trim().length < 3) {
      setErro("Descreva a área ou cargo alvo da entrevista.");
      return;
    }
    setCriando(true);
    try {
      await aoCriar({ cargo_alvo: area.trim(), descricao_cargo: contexto.trim() });
      setArea("");
      setContexto("");
    } catch (err) {
      setErro(err.message);
    } finally {
      setCriando(false);
    }
  }

  return (
    <Modal
      aberto={aberto}
      aoFechar={fechar}
      titulo="Nova simulação"
      subtitulo="A IA vai montar as perguntas com base no que você descrever aqui."
    >
      <form onSubmit={aoSubmeter} className="space-y-4">
        <div>
          <TextField
            label="Área ou cargo alvo"
            icone={Briefcase}
            valor={area}
            aoAlterar={(e) => setArea(e.target.value)}
            placeholder="Ex.: Mecatrônica Industrial"
            list="areas-sugeridas"
            required
          />
          <datalist id="areas-sugeridas">
            {AREAS_SUGERIDAS.map((a) => (
              <option key={a} value={a} />
            ))}
          </datalist>
        </div>

        <label className="block">
          <span className="block text-sm font-medium text-ink/70 mb-1.5">
            Contexto adicional <span className="text-ink/40 font-normal">(opcional)</span>
          </span>
          <textarea
            value={contexto}
            onChange={(e) => setContexto(e.target.value)}
            placeholder="Ex.: vaga de estágio, foco em manutenção preventiva de linhas de produção..."
            rows={3}
            className="w-full rounded-xl border border-ink/15 bg-white px-3.5 py-3 text-base text-ink placeholder:text-ink/30 outline-none focus:border-primary resize-none"
          />
        </label>

        {erro && (
          <div role="alert" className="rounded-lg bg-danger/10 px-3.5 py-2.5 text-sm text-danger">
            {erro}
          </div>
        )}

        <Button type="submit" carregando={criando}>
          Iniciar simulação
        </Button>
      </form>
    </Modal>
  );
}
