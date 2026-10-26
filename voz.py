"""Texto a voz con edge-tts. Si existe un audio pregenerado (plan B), se usa ese."""
import asyncio
import hashlib
from pathlib import Path

import edge_tts

import config


def clave_audio(voz: dict, texto: str) -> str:
    base = f"{voz.get('voz')}|{voz.get('velocidad')}|{voz.get('tono')}|{texto.strip()}"
    return hashlib.sha1(base.encode("utf-8")).hexdigest()[:20]


def ruta_respaldo(personaje: str, voz: dict, texto: str) -> Path:
    return config.DIR_RESPALDO / "audio" / personaje / f"{clave_audio(voz, texto)}.mp3"


def _comunicar(voz: dict, texto: str) -> edge_tts.Communicate:
    return edge_tts.Communicate(
        texto,
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
