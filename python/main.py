# python3 -m uvicorn main:app --host 0.0.0.0 --port 8080 --reload
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from config import settings
from database import criar_tabelas
from routers import auth_router, entrevistas

app = FastAPI(title="Simulador de Entrevistas - IFCE")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- Rotas REST ----------
app.include_router(auth_router.router)
app.include_router(entrevistas.router)

# ---------- Mídia gravada nas entrevistas (vídeo/áudio das respostas) ----------
app.mount("/media", StaticFiles(directory=str(settings.MEDIA_DIR)), name="media")


@app.on_event("startup")
def ao_iniciar():
    criar_tabelas()


@app.get("/")
def status_api():
    return {"status": "ok", "servico": "simulador-entrevistas-ifce"}
