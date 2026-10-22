"""Voces de la Historia: servidor FastAPI que también sirve el frontend.

Arranque local:  uvicorn main:app --reload --port 8000
"""
import json
import logging
import re
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse, JSONResponse, PlainTextResponse, Response
from fastapi.staticfiles import StaticFiles
from openai import AsyncOpenAI
from pydantic import BaseModel, Field

import config
import limites
import prompts
import respaldo
import voz

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("voces")

app = FastAPI(title="Voces de la Historia", docs_url=None, redoc_url=None)

cliente_ia = (
    None
    if config.MODO_DEMO
    else AsyncOpenAI(
        api_key=config.DEEPSEEK_API_KEY,
        base_url=config.DEEPSEEK_BASE_URL,
        timeout=config.TIMEOUT_IA,
    )
)


# ---------- Personajes ----------

def _cargar_personajes() -> dict[str, dict]:
    personajes = {}
    for carpeta in sorted(config.DIR_PERSONAJES.iterdir()):
        archivo = carpeta / "config.json"
        if not archivo.exists():
            continue
        datos = json.loads(archivo.read_text(encoding="utf-8"))
        datos["id"] = carpeta.name
        ficha = carpeta / "ficha.md"
        datos["_sistema"] = prompts.armar_sistema(
            datos["nombre"], ficha.read_text(encoding="utf-8") if ficha.exists() else ""
        )
        datos["_lecturas"] = _cargar_lecturas(carpeta / "lecturas")
        personajes[carpeta.name] = datos
    return dict(sorted(personajes.items(), key=lambda kv: kv[1].get("orden", 99)))


def _partir(texto: str, largo: int = 380) -> list[str]:
    """Divide un texto en partes cortas, cortando en fin de oración."""
    partes, actual = [], ""
    for parrafo in texto.split("\n\n"):
        for oracion in re.split(r"(?<=[.;:?!])\s+", parrafo.strip()):
            if actual and len(actual) + len(oracion) > largo:
                partes.append(actual.strip())
                actual = ""
            actual += oracion + " "
        if len(actual) > largo * 0.6:
            partes.append(actual.strip())
            actual = ""
    if actual.strip():
        partes.append(actual.strip())
    return partes


def _cargar_lecturas(carpeta: Path) -> dict[str, dict]:
    lecturas = {}
    if not carpeta.is_dir():
        return lecturas
    for archivo in sorted(carpeta.glob("*.txt")):
        lineas = archivo.read_text(encoding="utf-8").splitlines()
        encabezado = [l[1:].strip() for l in lineas if l.startswith("#")]
        cuerpo = "\n".join(l for l in lineas if not l.startswith("#")).strip()
        cuerpo = re.sub(r"\n\s*\n+", "\n\n", cuerpo)
        lecturas[archivo.stem] = {
            "id": archivo.stem,
            "titulo": encabezado[0] if encabezado else archivo.stem,
            "obra": encabezado[1] if len(encabezado) > 1 else "",
            "minutos": max(1, round(len(cuerpo.split()) / 140)),
            "partes": _partir(cuerpo),
        }
    return lecturas


PERSONAJES = _cargar_personajes()


def _personaje(pid: str) -> dict:
    if pid not in PERSONAJES:
        raise HTTPException(404, "Ese personaje no existe.")
    return PERSONAJES[pid]


def _publico(p: dict) -> dict:
    datos = {k: v for k, v in p.items() if not k.startswith("_") and k != "voz"}
    datos["tiene_lecturas"] = bool(p["_lecturas"])
    # Si hay retratos PNG (cerrada/media/abierta) se usan en lugar de la ilustración SVG.
    # Retratos propios: se acepta .jpg, .png o .webp (el primero que exista).
    carpeta_img = config.DIR_STATIC / "img" / p["id"]
    ext = next((e for e in ("jpg", "png", "webp", "jpeg") if (carpeta_img / f"cerrada.{e}").exists()), None)
    datos["imagenes"] = bool(ext) and all((carpeta_img / f"{b}.{ext}").exists() for b in ("media", "abierta"))
    datos["img_ext"] = ext
    # Opcional: parpadeo (ojos cerrados, boca cerrada) para que parpadee.
    datos["parpadeo"] = datos["imagenes"] and (carpeta_img / f"parpadeo.{ext}").exists()
    # Sonidos propios (opcionales). Si no hay, el navegador genera el ambiente solo.
    carpeta_son = config.DIR_STATIC / "sonidos" / p["id"]
    sonidos = {}
    for nombre in ("fondo", "entrada"):
        for e in ("mp3", "ogg", "wav", "m4a"):
            if (carpeta_son / f"{nombre}.{e}").exists():
                sonidos[nombre] = f"/sonidos/{p['id']}/{nombre}.{e}"
                break
    datos["sonidos"] = sonidos or None
    return datos


def _ip(request: Request) -> str:
    # Detrás de Caddy la IP real viene en X-Forwarded-For.
    reenviada = request.headers.get("x-forwarded-for", "")
    return reenviada.split(",")[0].strip() or (request.client.host if request.client else "?")


# ---------- Rutas ----------

@app.get("/health", response_class=PlainTextResponse)
async def health():
    return "ok"


@app.get("/api/estado")
async def estado():
    return {"modo_demo": config.MODO_DEMO, "modelo": None if config.MODO_DEMO else config.DEEPSEEK_MODEL,
            **limites.estado()}


@app.get("/api/personajes")
async def lista_personajes():
    return [_publico(p) for p in PERSONAJES.values()]


@app.get("/api/categorias")
async def lista_categorias():
    """Categorías (personajes/categorias.json) que ya tienen al menos un personaje."""
    ruta = config.DIR_PERSONAJES / "categorias.json"
    categorias = json.loads(ruta.read_text(encoding="utf-8")) if ruta.exists() else []
    conteo = {}
    for p in PERSONAJES.values():
        conteo[p.get("categoria")] = conteo.get(p.get("categoria"), 0) + 1
    return [{**c, "cantidad": conteo[c["id"]]} for c in categorias if conteo.get(c["id"])]


class Mensaje(BaseModel):
    rol: str = Field(pattern="^(usuario|personaje)$")
    texto: str = Field(max_length=600)


class PedidoChat(BaseModel):
    personaje: str
    mensajes: list[Mensaje] = Field(min_length=1, max_length=40)
    demo: bool = False


_AYUDA = re.compile(
    r"(quiero morir|me quiero morir|matarme|suicid|hacerme da[ñn]o|lastimarme|"
    r"me pegan|me maltrat|abusan de mi|estoy en peligro)",
    re.I,
)
_MENSAJE_AYUDA = (
    "Oye, lo que me cuentas es muy importante y me preocupa. Por favor, busca ahora a un adulto "
    "de confianza, como tu mamá, tu papá, un profesor o un familiar, y cuéntale cómo te sientes. "
    # Verificar que los números sigan vigentes antes de la feria.
    "En el Perú también puedes llamar gratis a la Línea 113, opción 5, o a la Línea 100. "
    "No tienes que pasar por esto sin ayuda."
)


@app.post("/api/chat")
async def chat(pedido: PedidoChat, request: Request):
    p = _personaje(pedido.personaje)
    ultima = pedido.mensajes[-1].texto.strip()
    if not ultima:
        raise HTTPException(400, "No escuché ninguna pregunta.")

    # Seguridad primero: frases de riesgo reciben siempre la misma respuesta cuidadosa.
    if _AYUDA.search(ultima):
        return {"texto": _MENSAJE_AYUDA, "origen": "cuidado"}

    if not limites.permitir_ip(_ip(request)):
        return JSONResponse(
            {"texto": "¡Uy, cuántas preguntas! Respira un momento y vuelve a preguntarme en un minuto.",
             "origen": "limite"},
            status_code=429,
        )

    if config.MODO_DEMO or pedido.demo or cliente_ia is None:
        return {"texto": respaldo.responder(p["id"], ultima), "origen": "respaldo"}

    if not limites.consumir_diario():
        resp, puntaje = respaldo.buscar(p["id"], ultima)
        if resp and puntaje >= 0.3:
            return {"texto": resp, "origen": "respaldo"}
        aviso = respaldo.cargar(p["id"]).get(
            "tope", "Hoy ya conversé muchísimo y necesito descansar la voz. ¡Vuelve mañana y seguimos!"
        )
        return {"texto": aviso, "origen": "tope"}

    historial = pedido.mensajes[-config.HISTORIAL_MAX:]
    mensajes = [{"role": "system", "content": p["_sistema"]}] + [
        {"role": "user" if m.rol == "usuario" else "assistant", "content": m.texto}
        for m in historial
    ]
    # A veces el modelo "piensa" tanto que no le queda espacio para responder:
    # se reintenta una vez antes de usar el respaldo.
    for intento in (1, 2):
        try:
            r = await cliente_ia.chat.completions.create(
                model=config.DEEPSEEK_MODEL,
                messages=mensajes,
                max_tokens=config.MAX_TOKENS,
                temperature=0.8,
            )
            texto = prompts.limpiar_respuesta(r.choices[0].message.content)
            if texto:
                return {"texto": texto, "origen": "ia"}
            log.warning("La IA respondió vacío (intento %s, motivo: %s)", intento, r.choices[0].finish_reason)
        except Exception as e:  # sin internet, API caída, sin saldo...
            log.warning("Falló la IA (intento %s): %s", intento, type(e).__name__)
            break
    return {"texto": respaldo.responder(p["id"], ultima), "origen": "respaldo"}


class PedidoVoz(BaseModel):
    personaje: str
    texto: str = Field(min_length=1, max_length=1500)


@app.post("/api/tts")
async def tts(pedido: PedidoVoz):
    p = _personaje(pedido.personaje)
    ajustes = p.get("voz", {})
    guardado = voz.ruta_respaldo(p["id"], ajustes, pedido.texto)
    if guardado.exists():
        return FileResponse(guardado, media_type="audio/mpeg")
    try:
        audio = await voz.sintetizar(ajustes, pedido.texto)
    except Exception as e:
        log.warning("Falló edge-tts: %s", type(e).__name__)
        raise HTTPException(503, "La voz del servidor no está disponible.")
    return Response(audio, media_type="audio/mpeg", headers={"Cache-Control": "no-store"})


@app.get("/api/lecturas/{pid}")
async def lista_lecturas(pid: str):
    p = _personaje(pid)
    return [
        {"id": l["id"], "titulo": l["titulo"], "obra": l["obra"],
         "minutos": l["minutos"], "num_partes": len(l["partes"])}
        for l in p["_lecturas"].values()
    ]


@app.get("/api/lecturas/{pid}/{lid}")
async def una_lectura(pid: str, lid: str):
    p = _personaje(pid)
    if lid not in p["_lecturas"]:
        raise HTTPException(404, "Esa lectura no existe.")
    return p["_lecturas"][lid]


@app.get("/api/respaldo/{pid}")
async def preguntas_frecuentes(pid: str):
    """Preguntas del plan B, para mostrarlas como botones cuando falla el micrófono."""
    _personaje(pid)
    return [i["pregunta"] for i in respaldo.cargar(pid).get("preguntas", [])]


# El frontend se sirve al final para no tapar las rutas de la API.
@app.get("/sw.js", include_in_schema=False)
async def service_worker():
    return FileResponse(config.DIR_STATIC / "sw.js", media_type="text/javascript",
                        headers={"Cache-Control": "no-cache"})


app.mount("/", StaticFiles(directory=config.DIR_STATIC, html=True), name="static")

log.info("Personajes: %s | modo demo: %s", ", ".join(PERSONAJES), config.MODO_DEMO)
