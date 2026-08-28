from sqlmodel import SQLModel, Session, create_engine
from config import settings
from sqlalchemy import text
# import necessário para o SQLModel "enxergar" todas as tabelas antes de criar
import models  # noqa: F401

# pool_pre_ping evita erros de "conexão caiu" em bancos gerenciados
# (Postgres em serviços cloud costuma derrubar conexões ociosas).
engine = create_engine(
    settings.DB_URL,
    echo=(settings.ENVIRONMENT == "development"),
    pool_pre_ping=True,
)

def aplicar_migracoes_simples():
    """Adiciona colunas novas em tabelas já existentes (sem Alembic)."""
    # Exemplo: adicionar a coluna "travada_em" na tabela "entrevistas".
    # Substitua pelo comando SQL necessário quando houver
    comandos = [
        "ALTER TABLE entrevistas ADD COLUMN travada_em TIMESTAMP",
    ]
    with engine.connect() as conexao:
        for comando in comandos:
            try:
                conexao.execute(text(comando))
                conexao.commit()
            except Exception:
                conexao.rollback()  # coluna já existe

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