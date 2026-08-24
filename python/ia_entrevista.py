from typing import List, Optional
from google import genai
from google.genai import types
from config import settings
from schemas import PerguntasGeradas, RelatorioEntrevista

if not settings.GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY não encontrada. Verifique o .env")

cliente = genai.Client(api_key=settings.GEMINI_API_KEY)

# Configurável via .env pra não depender de alterar código quando o Google
# aposentar o modelo de novo. Modelos disponíveis e prazos de desativação em:
# https://ai.google.dev/gemini-api/docs/deprecations
MODELO = settings.GEMINI_MODEL

QUANTIDADE_PERGUNTAS_PADRAO = 5

# ---------- Geração das perguntas ----------
def _montar_prompt_perguntas(cargo_alvo: str, descricao_cargo: Optional[str], quantidade: int) -> str:
    contexto_extra = f"\nDescrição adicional da vaga/cargo: {descricao_cargo}" if descricao_cargo else ""
    return f"""
Você é um entrevistador de RH experiente, conduzindo uma simulação de
entrevista de emprego para um(a) estudante do IFCE que está se preparando
para o mercado de trabalho.

Cargo/área alvo da entrevista: {cargo_alvo}{contexto_extra}

Gere exatamente {quantidade} perguntas de entrevista de emprego para esse
cargo, seguindo estas diretrizes:
1. Comece com uma pergunta de abertura simples (ex: "fale sobre você" ou
   equivalente adaptado ao cargo).
2. Inclua pelo menos uma pergunta comportamental (situação real vivida,
   estilo "conte sobre uma vez em que...").
3. Inclua pelo menos uma pergunta técnica ou específica da área do cargo.
4. Inclua uma pergunta sobre motivação/interesse pela vaga ou carreira.
5. As perguntas devem ser claras, diretas, em português, e adequadas ao
   nível de um estudante/recém-formado (nem básicas demais, nem
   excessivamente avançadas).
6. Não numere as perguntas no texto -- cada uma deve vir como um item
   separado da lista.
""".strip()

def gerar_perguntas(
    cargo_alvo: str,
    descricao_cargo: Optional[str] = None,
    quantidade: int = QUANTIDADE_PERGUNTAS_PADRAO,
) -> List[str]:
    """Chama o Gemini e devolve a lista de perguntas já validada
    (o SDK faz o parse pra Pydantic quando passamos a classe como
    response_schema)."""
    prompt = _montar_prompt_perguntas(cargo_alvo, descricao_cargo, quantidade)

    resposta = cliente.models.generate_content(
        model=MODELO,
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=PerguntasGeradas,
        ),
    )
    perguntas: PerguntasGeradas = resposta.parsed
    return perguntas.perguntas

# ---------- Geração do relatório final ----------
def _montar_prompt_relatorio(
    cargo_alvo: str,
    descricao_cargo: Optional[str],
    perguntas_respostas: List[dict],
) -> str:
    contexto_extra = f"\nDescrição adicional da vaga/cargo: {descricao_cargo}" if descricao_cargo else ""

    transcricao_formatada = "\n\n".join(
        f"Pergunta {i + 1}: {item['pergunta']}\n"
        f"Resposta do candidato (transcrita por reconhecimento de voz): "
        f"{item['transcricao'] or '[o candidato não respondeu de forma compreensível]'}"
        for i, item in enumerate(perguntas_respostas)
    )

    return f"""
Você é um entrevistador de RH experiente, avaliando o desempenho de um(a)
estudante do IFCE numa simulação de entrevista de emprego, para dar um
feedback construtivo e pedagógico.

Cargo/área alvo da entrevista: {cargo_alvo}{contexto_extra}

Transcrição completa da entrevista (perguntas feitas e respostas dadas
pelo candidato, capturadas por reconhecimento de voz -- pode conter
pequenos erros de transcrição, use o bom senso para interpretar):

{transcricao_formatada}

Tarefas:
1. Dê uma nota geral (score_geral) de 0 a 10 para o desempenho do
   candidato na entrevista como um todo, considerando clareza de
   comunicação, estrutura das respostas, adequação ao cargo e
   profissionalismo. Seja justo, mas rigoroso -- notas altas (8+) devem
   ser reservadas para respostas realmente completas e bem estruturadas.
2. Escreva um resumo geral (resumo_geral) em um parágrafo, com tom
   construtivo e encorajador, como um profissional de RH conversando
   diretamente com o candidato.
3. Liste de 2 a 5 pontos fortes concretos observados nas respostas.
4. Liste de 2 a 5 pontos a melhorar, específicos e acionáveis (evite
   generalidades como "melhorar a comunicação" sem dizer como).
5. Para cada pergunta da entrevista, escreva uma avaliação curta
   (1-2 frases) da resposta correspondente.
6. Sugira de 2 a 4 recomendações práticas para o candidato treinar antes
   de uma entrevista real (ex: técnicas de resposta como STAR, pesquisar
   sobre a empresa, praticar respostas mais concisas, etc), coerentes com
   os pontos a melhorar identificados.
7. Se o candidato não respondeu a alguma pergunta de forma compreensível,
   trate isso como um ponto a melhorar (comunicação/postura na gravação),
   não como falha técnica do sistema.
""".strip()

def gerar_relatorio_final(
    cargo_alvo: str,
    descricao_cargo: Optional[str],
    perguntas_respostas: List[dict],
) -> RelatorioEntrevista:
    """
    `perguntas_respostas` é uma lista de dicts no formato
    {"pergunta": str, "transcricao": str}, na ordem em que foram feitas.
    """
    prompt = _montar_prompt_relatorio(cargo_alvo, descricao_cargo, perguntas_respostas)

    resposta = cliente.models.generate_content(
        model=MODELO,
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=RelatorioEntrevista,
        ),
    )
    return resposta.parsed