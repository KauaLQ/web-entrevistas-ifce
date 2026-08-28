import { AlertTriangle } from "lucide-react";
import Modal from "../../components/ui/Modal";
import Button from "../../components/ui/Button";

export default function ModalConfirmarRegravacao({ aberto, aoFechar, aoConfirmar }) {
  return (
    <Modal aberto={aberto} aoFechar={aoFechar} titulo="Regravar resposta?">
      <div className="flex items-start gap-3 mb-5">
        <AlertTriangle size={20} className="text-selo shrink-0 mt-0.5" />
        <p className="text-sm text-ink/70 leading-relaxed">
          Essa pergunta já tem uma resposta gravada. Ao confirmar, a gravação
          anterior será <strong className="text-ink">substituída</strong> pela
          nova, essa ação não pode ser desfeita.
        </p>
      </div>
      <div className="flex gap-3">
        <Button variante="contorno" className="flex-1" onClick={aoFechar}>
          Cancelar
        </Button>
        <Button className="flex-1" onClick={aoConfirmar}>
          Substituir resposta
        </Button>
      </div>
    </Modal>
  );
}