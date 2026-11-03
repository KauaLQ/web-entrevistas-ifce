import { useState } from "react";
import { BookOpen, Hash } from "lucide-react";
import Modal from "../ui/Modal";
import TextField from "../ui/TextField";
import Button from "../ui/Button";
import { useAuth } from "../../context/useAuth";

/**
 * Cadastro obrigatório do primeiro acesso. Não tem botão de fechar: a única
 * saída além de salvar é sair da conta. Se o usuário abandonar no meio, o
 * backend continua dizendo "perfil incompleto" e o modal volta no próximo acesso.
 */
export default function ModalCompletarPerfil() {
  const { usuario, salvarPerfil, sair } = useAuth();
  const [curso, setCurso] = useState(usuario?.curso ?? "");
  const [matricula, setMatricula] = useState(usuario?.matricula ?? "");
  const [erros, setErros] = useState({});
  const [erroApi, setErroApi] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function aoSubmeter(e) {
    e.preventDefault();
    setErroApi("");

    const novosErros = {};
    if (curso.trim().length < 2) novosErros.curso = "Informe seu curso.";
    if (matricula.trim().length < 3) novosErros.matricula = "Informe sua matrícula.";
    setErros(novosErros);
    if (Object.keys(novosErros).length > 0) return;

    setSalvando(true);
    try {
      // Ao salvar, o contexto atualiza o perfil e o ProtectedRoute libera o app sozinho
      await salvarPerfil({ curso: curso.trim(), matricula: matricula.trim() });
    } catch (err) {
      setErroApi(err.message);
      setSalvando(false);
    }
  }

  return (
    <Modal
      aberto
      fechavel={false}
      titulo="Complete seu perfil"
      subtitulo="Precisamos de mais duas informações para continuar."
    >
      <form onSubmit={aoSubmeter} noValidate className="space-y-4">
        <TextField
          label="Curso"
          icone={BookOpen}
          valor={curso}
          aoAlterar={(e) => setCurso(e.target.value)}
          placeholder="Ex.: Redes de Computadores"
          erro={erros.curso}
          required
        />
        <TextField
          label="Matrícula"
          icone={Hash}
          valor={matricula}
          aoAlterar={(e) => setMatricula(e.target.value)}
          placeholder="Sua matrícula institucional"
          autoComplete="off"
          erro={erros.matricula}
          required
        />

        {erroApi && (
          <div role="alert" className="rounded-lg bg-danger/10 px-3.5 py-2.5 text-sm text-danger">
            {erroApi}
          </div>
        )}

        <div className="space-y-2.5">
          <Button type="submit" carregando={salvando}>
            Salvar e continuar
          </Button>
          <Button type="button" variante="fantasma" onClick={sair} disabled={salvando}>
            Sair da conta
          </Button>
        </div>
      </form>
    </Modal>
  );
}