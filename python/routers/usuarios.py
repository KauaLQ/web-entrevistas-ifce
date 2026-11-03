from fastapi import APIRouter, Depends
from sqlmodel import Session
from database import obter_sessao
from models import Usuario
from schemas import PerfilAtualizar, PerfilResposta
from auth import obter_usuario_atual

router = APIRouter(prefix="/usuarios", tags=["Usuários"])

def _montar_perfil(usuario: Usuario) -> PerfilResposta:
    return PerfilResposta(
        id=usuario.id,
        nome=usuario.nome,
        email=usuario.email,
        curso=usuario.curso,
        matricula=usuario.matricula,
        perfil_completo=bool(usuario.curso and usuario.matricula),
    )

# ---------- Consultar perfil (o front chama a cada novo login/carregamento) ----------
@router.get("/eu", response_model=PerfilResposta)
def obter_perfil(usuario: Usuario = Depends(obter_usuario_atual)):
    return _montar_perfil(usuario)

# ---------- Completar/atualizar perfil ----------
@router.put("/eu", response_model=PerfilResposta)
def atualizar_perfil(
    dados: PerfilAtualizar,
    sessao: Session = Depends(obter_sessao),
    usuario: Usuario = Depends(obter_usuario_atual),
):
    usuario.curso = dados.curso
    usuario.matricula = dados.matricula
    sessao.add(usuario)
    sessao.commit()
    sessao.refresh(usuario)
    return _montar_perfil(usuario)