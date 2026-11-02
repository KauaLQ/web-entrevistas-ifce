import jwt
from jwt import PyJWKClient
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, select
from config import settings
from database import obter_sessao
from models import Usuario

esquema_bearer = HTTPBearer()

URL_SUPABASE_AUTH = f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1"

# Baixa (e cacheia) as chaves públicas do Supabase. O token é assinado com a chave
# privada deles; aqui só verificamos com a pública, então não há segredo no backend.
_jwks = PyJWKClient(f"{URL_SUPABASE_AUTH}/.well-known/jwks.json")


def _validar_token(token: str) -> dict:
    """Verifica assinatura, expiração, emissor e audiência. Lança PyJWTError se algo falhar."""
    chave = _jwks.get_signing_key_from_jwt(token).key
    return jwt.decode(
        token,
        chave,
        algorithms=["ES256", "RS256"],
        audience="authenticated",   # valor fixo dos tokens de usuário logado do Supabase
        issuer=URL_SUPABASE_AUTH,
    )


def _obter_ou_criar_usuario(sessao: Session, supabase_id: str, email: str, nome: str) -> Usuario:
    # 1) Já conhecido: caminho normal, na grande maioria das requisições
    usuario = sessao.exec(select(Usuario).where(Usuario.supabase_id == supabase_id)).first()
    if usuario:
        return usuario

    # 2) Primeiro acesso via Supabase: associa ao perfil existente pelo e-mail, se houver
    usuario = sessao.exec(select(Usuario).where(Usuario.email == email)).first()
    if usuario:
        usuario.supabase_id = supabase_id
    else:
        # 3) Usuário novo: cria o registro
        usuario = Usuario(nome=nome, email=email, supabase_id=supabase_id)

    sessao.add(usuario)
    try:
        sessao.commit()
    except IntegrityError:
        # Duas requisições paralelas no primeiro acesso (ex.: StrictMode): a outra
        # criou primeiro. Descarta a nossa e devolve a que já existe.
        sessao.rollback()
        return sessao.exec(select(Usuario).where(Usuario.supabase_id == supabase_id)).one()

    sessao.refresh(usuario)
    return usuario


def obter_usuario_atual(
    credenciais: HTTPAuthorizationCredentials = Depends(esquema_bearer),
    sessao: Session = Depends(obter_sessao),
) -> Usuario:
    """Dependency usada em toda rota protegida: valida o Bearer token do Supabase e devolve o Usuario."""
    excecao = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciais inválidas",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = _validar_token(credenciais.credentials)
    except jwt.PyJWTError:
        raise excecao

    supabase_id = payload.get("sub")
    email = payload.get("email")
    if not supabase_id or not email:
        raise excecao

    metadados = payload.get("user_metadata") or {}
    nome = metadados.get("full_name") or metadados.get("name") or email.split("@")[0]

    return _obter_ou_criar_usuario(sessao, supabase_id, email.lower(), nome)