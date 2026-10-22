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


async def sintetizar(voz: dict, texto: str, timeout: float = 15) -> bytes:
    """Devuelve el mp3. Lanza excepción si edge-tts falla (el frontend usa la voz del navegador)."""
    comunicar = edge_tts.Communicate(
        texto,
        voz.get("voz", "es-PE-AlexNeural"),
        rate=voz.get("velocidad", "+0%"),
        pitch=voz.get("tono", "+0Hz"),
    )

    async def _juntar() -> bytes:
        partes = []
        async for trozo in comunicar.stream():
            if trozo["type"] == "audio":
                partes.append(trozo["data"])
        return b"".join(partes)

    audio = await asyncio.wait_for(_juntar(), timeout=timeout)
    if not audio:
        raise RuntimeError("edge-tts no devolvió audio")
    return audio
