import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, User, BookOpen, Hash } from "lucide-react";
import AuthLayout from "./AuthLayout";
import TextField from "../../components/ui/TextField";
import Button from "../../components/ui/Button";
import { login, registrar } from "../../api/auth";
import { useAuth } from "../../context/useAuth";

const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validar(modo, campos) {
  const erros = {};
  if (modo === "registro" && campos.nome.trim().length < 3) {
    erros.nome = "Informe seu nome completo.";
  }
  if (!REGEX_EMAIL.test(campos.email)) {
    erros.email = "Informe um email válido.";
  }
  if (campos.senha.length < 6) {
    erros.senha = "A senha deve ter pelo menos 6 caracteres.";
  }
  return erros;
}

export default function AuthPage() {
  // Alternância rápida entre login/registro sem trocar de rota. Mesma
  // tela, mesmo estado de formulário, só muda o que é submetido.
  const [modo, setModo] = useState("login"); // 'login' | 'registro'
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [curso, setCurso] = useState("");
  const [matricula, setMatricula] = useState("");
  const [erros, setErros] = useState({});
  const [erroApi, setErroApi] = useState("");
  const [carregando, setCarregando] = useState(false);

  const { entrar } = useAuth();
  const navegar = useNavigate();
  const ehRegistro = modo === "registro";

  async function aoSubmeter(e) {
    e.preventDefault();
    setErroApi("");

    const errosValidacao = validar(modo, { nome, email, senha });
    setErros(errosValidacao);
    if (Object.keys(errosValidacao).length > 0) return;

    setCarregando(true);
    try {
      const dados = ehRegistro
        ? await registrar({ nome, email, senha, curso, matricula })
        : await login(email, senha);
      entrar(dados.access_token, dados.usuario);
      navegar("/dashboard", { replace: true });
    } catch (err) {
      setErroApi(err.message);
    } finally {
      setCarregando(false);
    }
  }

  function alternarModo() {
    setErros({});
    setErroApi("");
    setModo(ehRegistro ? "login" : "registro");
  }

  return (
    <AuthLayout>
      <div className="mb-7">
        <h2 className="font-display text-2xl text-ink">
          {ehRegistro ? "Criar conta" : "Bem-vindo de volta"}
        </h2>
        <p className="mt-1 text-ink/60 text-sm">
          {ehRegistro
            ? "Cadastre-se para começar a treinar suas entrevistas."
            : "Entre para continuar suas simulações."}
        </p>
      </div>

      <form onSubmit={aoSubmeter} noValidate className="space-y-4">
        {ehRegistro && (
          <TextField
            label="Nome completo"
            icone={User}
            valor={nome}
            aoAlterar={(e) => setNome(e.target.value)}
            placeholder="Seu nome completo"
            autoComplete="name"
            erro={erros.nome}
            required
          />
        )}

        <TextField
          label="Email"
          tipo="email"
          icone={Mail}
          valor={email}
          aoAlterar={(e) => setEmail(e.target.value)}
          placeholder="voce@aluno.ifce.edu.br"
          autoComplete="email"
          erro={erros.email}
          required
        />

        <TextField
          label="Senha"
          tipo="password"
          icone={Lock}
          valor={senha}
          aoAlterar={(e) => setSenha(e.target.value)}
          placeholder="••••••••"
          autoComplete={ehRegistro ? "new-password" : "current-password"}
          erro={erros.senha}
          dica={ehRegistro ? "Mínimo de 6 caracteres." : undefined}
          required
        />

        {ehRegistro && (
          <div className="grid grid-cols-2 gap-3">
            <TextField
              label="Curso"
              icone={BookOpen}
              valor={curso}
              aoAlterar={(e) => setCurso(e.target.value)}
              placeholder="Ex.: Redes"
            />
            <TextField
              label="Matrícula"
              icone={Hash}
              valor={matricula}
              aoAlterar={(e) => setMatricula(e.target.value)}
              placeholder="Opcional"
            />
          </div>
        )}

        {erroApi && (
          <div role="alert" className="rounded-lg bg-danger/10 px-3.5 py-2.5 text-sm text-danger">
            {erroApi}
          </div>
        )}

        <Button type="submit" carregando={carregando}>
          {ehRegistro ? "Criar conta" : "Entrar"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink/60">
        {ehRegistro ? "Já tem uma conta?" : "Ainda não tem conta?"}{" "}
        <button
          type="button"
          onClick={alternarModo}
          className="font-semibold text-primary hover:text-primary-dark"
        >
          {ehRegistro ? "Entrar" : "Criar conta"}
        </button>
      </p>
    </AuthLayout>
  );
}
