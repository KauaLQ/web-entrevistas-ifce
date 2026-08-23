from datetime import datetime, timedelta, timezone
import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlmodel import Session
from config import settings
from database import obter_sessao
from models import Usuario

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def hash_senha(senha: str) -> str:
    # Converte a string para bytes, gera o salt e faz o hash
    pwd_bytes = senha.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    return hashed.decode('utf-8')

def verificar_senha(senha: str, senha_hash: str) -> bool:
    # Verifica se a senha informada bate com o hash salvo
    return bcrypt.checkpw(senha.encode('utf-8'), senha_hash.encode('utf-8'))

def criar_token(usuario_id: int) -> str:
    expira = datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_EXPIRE_MINUTES)
    payload = {"sub": str(usuario_id), "exp": expira}
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)

def obter_usuario_atual(
    token: str = Depends(oauth2_scheme),
    sessao: Session = Depends(obter_sessao),
) -> Usuario:
    """Dependency usada em toda rota protegida: valida o Bearer token e devolve o Usuario."""
    excecao = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciais inválidas",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        usuario_id = int(payload.get("sub"))
    except (JWTError, TypeError, ValueError):
        raise excecao

    usuario = sessao.get(Usuario, usuario_id)
    if not usuario:
        raise excecao
    return usuario