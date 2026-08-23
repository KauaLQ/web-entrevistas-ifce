from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from database import obter_sessao
from models import Usuario
from schemas import UsuarioCriar, UsuarioLogin, TokenResposta, UsuarioResposta
from auth import hash_senha, verificar_senha, criar_token

router = APIRouter(prefix="/auth", tags=["Autenticação"])


@router.post("/registrar", response_model=TokenResposta)
def registrar(dados: UsuarioCriar, sessao: Session = Depends(obter_sessao)):
    existente = sessao.exec(select(Usuario).where(Usuario.email == dados.email)).first()
    if existente:
        raise HTTPException(status_code=400, detail="Já existe um usuário com esse email")

    usuario = Usuario(
        nome=dados.nome,
        email=dados.email,
        senha_hash=hash_senha(dados.senha),
        curso=dados.curso,
        matricula=dados.matricula,
    )
    sessao.add(usuario)
    sessao.commit()
    sessao.refresh(usuario)

    return TokenResposta(
        access_token=criar_token(usuario.id),
        usuario=UsuarioResposta(
            id=usuario.id, nome=usuario.nome, email=usuario.email,
            curso=usuario.curso, matricula=usuario.matricula,
        ),
    )


@router.post("/login", response_model=TokenResposta)
def login(dados: UsuarioLogin, sessao: Session = Depends(obter_sessao)):
    usuario = sessao.exec(select(Usuario).where(Usuario.email == dados.email)).first()
    if not usuario or not verificar_senha(dados.senha, usuario.senha_hash):
        raise HTTPException(status_code=401, detail="Email ou senha inválidos")

    return TokenResposta(
        access_token=criar_token(usuario.id),
        usuario=UsuarioResposta(
            id=usuario.id, nome=usuario.nome, email=usuario.email,
            curso=usuario.curso, matricula=usuario.matricula,
        ),
    )
