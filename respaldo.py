"""Plan B: respuestas pregeneradas para cuando no hay IA (sin clave, sin internet o tope diario)."""
import json
import re
import unicodedata

import config

_cache: dict[str, dict] = {}

# Palabras que no ayudan a reconocer la pregunta.
_VACIAS = set(
    "el la los las un una unos unas de del al a y o que qué en con por para tu tus "
    "te me mi mis yo tú es eras era fue fuiste se su sus lo le les como cómo cual "
    "cuál cuando cuándo donde dónde quien quién muy mas más hay sobre algo hola "
    "dime cuentame cuéntame puedes podrias podrías favor oye señor usted".split()
)


def normalizar(texto: str) -> str:
    t = unicodedata.normalize("NFD", texto.lower())
    t = "".join(c for c in t if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9ñ ]", " ", t)


def _palabras(texto: str) -> set[str]:
    return {p for p in normalizar(texto).split() if p not in _VACIAS and len(p) > 2}


def cargar(personaje: str) -> dict:
    if personaje not in _cache:
        ruta = config.DIR_RESPALDO / f"{personaje}.json"
        _cache[personaje] = json.loads(ruta.read_text(encoding="utf-8")) if ruta.exists() else {}
    return _cache[personaje]


def buscar(personaje: str, pregunta: str) -> tuple[str | None, float]:
    """Devuelve (respuesta, puntaje 0-1) de la pregunta frecuente más parecida."""
    datos = cargar(personaje)
    consulta = _palabras(pregunta)
    texto_norm = " " + normalizar(pregunta) + " "
    mejor, puntaje = None, 0.0
    for item in datos.get("preguntas", []):
        claves = [normalizar(c).strip() for c in item.get("claves", [])]
        # Coincidencia de frases clave completas (pesa más).
        p_claves = sum(1 for c in claves if c and f" {c} " in texto_norm)
        objetivo = _palabras(item["pregunta"]) | {w for c in claves for w in c.split()}
        comunes = consulta & objetivo
        p = (len(comunes) / max(len(consulta), 1)) * 0.6 + min(p_claves, 2) * 0.35
        if p > puntaje:
            mejor, puntaje = item["respuesta"], p
    return mejor, min(puntaje, 1.0)


def responder(personaje: str, pregunta: str) -> str:
    respuesta, puntaje = buscar(personaje, pregunta)
    if respuesta and puntaje >= 0.3:
        return respuesta
    return cargar(personaje).get(
        "no_entiendo",
        "Esa pregunta me la guardo para otro día. ¿Quieres que te cuente de mi vida?",
    )


def todos_los_textos(personaje: str) -> list[str]:
    datos = cargar(personaje)
    textos = [i["respuesta"] for i in datos.get("preguntas", [])]
    for k in ("no_entiendo", "tope", "sin_conexion"):
        if datos.get(k):
            textos.append(datos[k])
    return textos
