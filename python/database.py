from sqlmodel import SQLModel, Session, create_engine
from config import settings

# import necessário para o SQLModel "enxergar" todas as tabelas antes de criar
import models  # noqa: F401

# pool_pre_ping evita erros de "conexão caiu" em bancos gerenciados
# (Postgres em serviços cloud costuma derrubar conexões ociosas).
engine = create_engine(
    settings.DB_URL,
    echo=(settings.ENVIRONMENT == "development"),
    pool_pre_ping=True,
)

def criar_tabelas():
    """Cria todas as tabelas que ainda não existem no banco."""
    SQLModel.metadata.create_all(engine)

def obter_sessao():
    """
    Dependency do FastAPI (Depends(obter_sessao)): entrega uma Session e
    garante o fechamento no final da requisição, mesmo se der exceção.
    """
    with Session(engine) as sessao:
        yield sessao

if __name__ == "__main__":
    # python3 database.py -> cria as tabelas manualmente
    print(f"[DB] Conectando em: {settings.DB_URL}")
    criar_tabelas()
    print("[DB] Tabelas criadas/verificadas com sucesso.")