"""Límite de peticiones por IP (por minuto) y tope diario total.

Todo vive en memoria: no se guarda nada en disco. Las IP se guardan como
hash para no tener datos identificables ni siquiera en memoria.
"""
import hashlib
import time
from collections import defaultdict, deque
from datetime import date
from threading import Lock

import config

_lock = Lock()
_por_ip: dict[str, deque] = defaultdict(deque)
_dia = date.today()
_conteo_dia = 0


def _clave(ip: str) -> str:
    return hashlib.sha256(ip.encode()).hexdigest()[:16]


def permitir_ip(ip: str, grupo: str = "chat") -> bool:
    """True si la IP no pasó su límite por minuto (cada grupo, chat o voz, cuenta aparte)."""
    ahora = time.monotonic()
    with _lock:
        cola = _por_ip[grupo + _clave(ip)]
        while cola and ahora - cola[0] > 60:
            cola.popleft()
        if len(cola) >= config.LIMITE_POR_MIN:
            return False
        cola.append(ahora)
        if len(_por_ip) > 5000:  # limpieza simple para que no crezca sin fin
            for k in [k for k, v in _por_ip.items() if not v]:
                del _por_ip[k]
        return True


def consumir_diario() -> bool:
    """Cuenta una llamada a la IA. False si ya se llegó al tope del día."""
    global _dia, _conteo_dia
    with _lock:
        hoy = date.today()
        if hoy != _dia:
            _dia, _conteo_dia = hoy, 0
        if _conteo_dia >= config.TOPE_DIARIO:
            return False
        _conteo_dia += 1
        return True


def estado() -> dict:
    return {"usadas_hoy": _conteo_dia, "tope_diario": config.TOPE_DIARIO}
