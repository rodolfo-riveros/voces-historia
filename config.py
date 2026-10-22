"""Lee la configuración desde el archivo .env (nunca se ponen claves en el código)."""
import os
from pathlib import Path

from dotenv import load_dotenv

BASE = Path(__file__).resolve().parent
load_dotenv(BASE / ".env")


def _entero(nombre: str, defecto: int) -> int:
    try:
        return int(os.getenv(nombre, defecto))
    except ValueError:
        return defecto


DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY", "").strip()
DEEPSEEK_BASE_URL = os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com").strip()
DEEPSEEK_MODEL = os.getenv("DEEPSEEK_MODEL", "deepseek-flash").strip()
MAX_TOKENS = _entero("MAX_TOKENS", 1200)
HISTORIAL_MAX = _entero("HISTORIAL_MAX", 6)
LIMITE_POR_MIN = _entero("LIMITE_POR_MIN", 20)
TOPE_DIARIO = _entero("TOPE_DIARIO", 1500)
TIMEOUT_IA = _entero("TIMEOUT_IA", 20)

# Sin clave, la app funciona igual con las respuestas pregeneradas (plan B).
MODO_DEMO = os.getenv("MODO_DEMO", "0") == "1" or not DEEPSEEK_API_KEY

DIR_PERSONAJES = BASE / "personajes"
DIR_STATIC = BASE / "static"
DIR_RESPALDO = BASE / "respaldo"
