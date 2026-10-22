"""Genera los íconos PNG de la PWA (192 y 512 px) sin librerías externas.

Uso:  python herramientas/generar_iconos.py
Dibuja lo mismo que static/icons/icono.svg (globo de diálogo con micrófono).
"""
import math
import struct
import zlib
from pathlib import Path

DESTINO = Path(__file__).resolve().parent.parent / "static" / "icons"

MORADO = (59, 31, 168)
BLANCO = (255, 255, 255)
ROJO = (209, 47, 69)
AMARILLO = (242, 169, 0)


def caja_redondeada(x, y, x0, y0, x1, y1, r):
    cx = min(max(x, x0 + r), x1 - r)
    cy = min(max(y, y0 + r), y1 - r)
    return math.hypot(x - cx, y - cy) <= r


def en_triangulo(x, y, a, b, c):
    def lado(p, q, r):
        return (p[0] - r[0]) * (q[1] - r[1]) - (q[0] - r[0]) * (p[1] - r[1])
    d1, d2, d3 = lado((x, y), a, b), lado((x, y), b, c), lado((x, y), c, a)
    neg = d1 < 0 or d2 < 0 or d3 < 0
    pos = d1 > 0 or d2 > 0 or d3 > 0
    return not (neg and pos)


def color(x, y):
    """Color en coordenadas del diseño (0-512)."""
    if not caja_redondeada(x, y, 0, 0, 512, 512, 112):
        return None
    c = MORADO
    if caja_redondeada(x, y, 68, 132, 444, 368, 44) or en_triangulo(x, y, (152, 360), (236, 360), (152, 432)):
        c = BLANCO
    if caja_redondeada(x, y, 226, 168, 286, 280, 30):
        c = ROJO
    d = math.hypot(x - 256, y - 252)
    if y >= 252 and abs(d - 66) <= 10:
        c = MORADO
    if abs(x - 256) <= 10 and 318 <= y <= 340:
        c = MORADO
    if math.hypot(x - 404, y - 112) <= 38:
        c = AMARILLO
    return c


def png(tam: int) -> bytes:
    escala = 512 / tam
    sub = 3  # suavizado de bordes
    filas = bytearray()
    for py in range(tam):
        filas.append(0)
        for px in range(tam):
            r = g = b = a = 0
            for sy in range(sub):
                for sx in range(sub):
                    c = color((px + (sx + 0.5) / sub) * escala, (py + (sy + 0.5) / sub) * escala)
                    if c:
                        r += c[0]; g += c[1]; b += c[2]; a += 1
            n = sub * sub
            filas += bytes((r // a, g // a, b // a, 255 * a // n) if a else (0, 0, 0, 0))

    def bloque(tipo, datos):
        return struct.pack(">I", len(datos)) + tipo + datos + struct.pack(">I", zlib.crc32(tipo + datos) & 0xFFFFFFFF)

    return (b"\x89PNG\r\n\x1a\n"
            + bloque(b"IHDR", struct.pack(">IIBBBBB", tam, tam, 8, 6, 0, 0, 0))
            + bloque(b"IDAT", zlib.compress(bytes(filas), 9))
            + bloque(b"IEND", b""))


if __name__ == "__main__":
    DESTINO.mkdir(parents=True, exist_ok=True)
    for t in (192, 512):
        (DESTINO / f"icono-{t}.png").write_bytes(png(t))
        print(f"Listo: icono-{t}.png")
