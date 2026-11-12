"""Texto a voz con edge-tts. Si existe un audio pregenerado (plan B), se usa ese."""
import asyncio
import hashlib
import re
from pathlib import Path

import edge_tts

import config


def clave_audio(voz: dict, texto: str) -> str:
    # Se usa el texto tal como se pronuncia: si cambia preparar_texto, el audio se vuelve a generar.
    base = f"{voz.get('voz')}|{voz.get('velocidad')}|{voz.get('tono')}|{preparar_texto(texto.strip())}"
    return hashlib.sha1(base.encode("utf-8")).hexdigest()[:20]


def ruta_respaldo(personaje: str, voz: dict, texto: str) -> Path:
    return config.DIR_RESPALDO / "audio" / personaje / f"{clave_audio(voz, texto)}.mp3"


ROMANOS = {"I": 1, "II": 2, "III": 3, "IV": 4, "V": 5, "VI": 6, "VII": 7, "VIII": 8, "IX": 9, "X": 10,
           "XI": 11, "XII": 12, "XIII": 13, "XIV": 14, "XV": 15, "XVI": 16, "XVII": 17, "XVIII": 18,
           "XIX": 19, "XX": 20, "XXI": 21}
CARDINALES = ["", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve", "diez", "once",
              "doce", "trece", "catorce", "quince", "dieciséis", "diecisiete", "dieciocho", "diecinueve",
              "veinte", "veintiuno"]
ORDINALES = ["", "primero", "segundo", "tercero", "cuarto", "quinto", "sexto", "séptimo", "octavo",
             "noveno", "décimo"]
_ROMANO = r"(XXI|XX|XIX|XVIII|XVII|XVI|XV|XIV|XIII|XII|XI|X|IX|VIII|VII|VI|V|IV|III|II|I)"


def preparar_texto(texto: str) -> str:
    """Ajusta lo que la voz suele leer mal: números romanos y rangos de años."""
    # "siglo XVIII" → "siglo dieciocho"
    texto = re.sub(rf"\b(siglos?) {_ROMANO}\b", lambda m: f"{m.group(1)} {CARDINALES[ROMANOS[m.group(2)]]}",
                   texto, flags=re.I)
    # "siglos dieciséis y XVII" → "... y diecisiete"
    texto = re.sub(rf"\b(siglos [a-záéíóú]+ y) {_ROMANO}\b", lambda m: f"{m.group(1)} {CARDINALES[ROMANOS[m.group(2)]]}",
                   texto, flags=re.I)
    # "S/100" → "100 soles"
    texto = re.sub(r"\bS/ ?(\d+)", r"\1 soles", texto)
    # "Túpac Amaru II", "Felipe II", "Pío XII" → "segundo", "doce" (no se toca la "I" sola: es ambigua)
    def nombre(m):
        n = ROMANOS[m.group(2)]
        return f"{m.group(1)} {ORDINALES[n] if n <= 10 else CARDINALES[n]}"
    texto = re.sub(rf"\b([A-ZÁÉÍÓÚ][a-záéíóúñ]+) {_ROMANO[:-3]})(?![\wÁÉÍÓÚ])", nombre, texto)
    texto = re.sub(r"\bAmaru I\b", "Amaru primero", texto)
    # "1438–1471" o "1438-1471" → "1438 a 1471"
    texto = re.sub(r"\b(\d{3,4}) ?[–—-] ?(\d{3,4})\b", r"\1 a \2", texto)
    return texto



def _comunicar(voz: dict, texto: str) -> edge_tts.Communicate:
    return edge_tts.Communicate(
        preparar_texto(texto),
        voz.get("voz", "es-PE-AlexNeural"),
        rate=voz.get("velocidad", "+0%"),
        pitch=voz.get("tono", "+0Hz"),
    )


async def sintetizar(voz: dict, texto: str, timeout: float = 15) -> bytes:
    """Devuelve el mp3 completo. Lanza excepción si edge-tts falla (el frontend usa la voz del navegador)."""
    audio = await asyncio.wait_for(_juntar(_comunicar(voz, texto)), timeout=timeout)
    if not audio:
        raise RuntimeError("edge-tts no devolvió audio")
    return audio


async def _juntar(comunicar) -> bytes:
    return b"".join([t["data"] async for t in comunicar.stream() if t["type"] == "audio"])


async def flujo(voz: dict, texto: str, espera_inicial: float = 10):
    """Devuelve el audio por partes, a medida que edge-tts lo genera: el navegador empieza a
    reproducir al llegar el primer trozo (~1 s) en vez de esperar el mp3 entero (~3 s).
    Lanza excepción ANTES de devolver nada si edge-tts no responde, para usar el respaldo."""
    trozos = _comunicar(voz, texto).stream()

    async def siguiente_audio():
        async for t in trozos:
            if t["type"] == "audio":
                return t["data"]
        return None

    primero = await asyncio.wait_for(siguiente_audio(), timeout=espera_inicial)
    if not primero:
        raise RuntimeError("edge-tts no devolvió audio")

    async def resto():
        yield primero
        async for t in trozos:
            if t["type"] == "audio":
                yield t["data"]

    return resto()
