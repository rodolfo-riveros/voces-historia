"""Voz a texto en el propio servidor con faster-whisper (para navegadores sin reconocimiento de voz).

El audio llega en memoria, se transcribe y se descarta: nunca se escribe en disco.
El modelo se descarga solo la primera vez (de Hugging Face) y queda en la caché del usuario.
"""
import io
import logging
import threading
from concurrent.futures import ThreadPoolExecutor

import config

log = logging.getLogger("voces")

_modelo = None
_lock = threading.Lock()
# Un solo hilo: en un VPS pequeño, transcribir dos audios a la vez solo hace que ambos tarden el doble.
_ejecutor = ThreadPoolExecutor(max_workers=1, thread_name_prefix="whisper")


def disponible() -> bool:
    if not config.STT_ACTIVO:
        return False
    try:
        import faster_whisper  # noqa: F401
    except ImportError:
        return False
    return True


def _cargar():
    global _modelo
    with _lock:
        if _modelo is None:
            from faster_whisper import WhisperModel

            log.info("Cargando Whisper '%s' (la primera vez se descarga)...", config.WHISPER_MODELO)
            _modelo = WhisperModel(config.WHISPER_MODELO, device="cpu", compute_type="int8",
                                   cpu_threads=config.WHISPER_HILOS)
            log.info("Whisper listo.")
    return _modelo


def precargar():
    """Carga el modelo en segundo plano al arrancar, para que la primera pregunta no espere."""
    if disponible():
        _ejecutor.submit(_cargar)


def _transcribir(audio: bytes, pista: str) -> str:
    modelo = _cargar()
    segmentos, _ = modelo.transcribe(
        io.BytesIO(audio),
        language="es",
        beam_size=1,                # más rápido; para preguntas cortas casi no pierde precisión
        vad_filter=True,            # ignora silencios y ruido de fondo
        condition_on_previous_text=False,
        initial_prompt=pista,       # ayuda a escribir bien los nombres propios
    )
    return " ".join(s.text.strip() for s in segmentos).strip()


async def transcribir(audio: bytes, pista: str = "") -> str:
    import asyncio

    return await asyncio.get_running_loop().run_in_executor(_ejecutor, _transcribir, audio, pista)
