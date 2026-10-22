"""Prepara los retratos de un personaje para que no "tiemblen" al animarse.

Gemini suele redibujar pequeños detalles en cada variación (cabello, cuello, barba).
Este programa toma de cada imagen SOLO la zona que debe cambiar (boca o ojos) y la
pega con bordes suaves sobre la imagen base (cerrada). Además deja el fondo en negro
puro (mejor para el holograma) y guarda en JPG liviano.

Uso:
    python herramientas/preparar_retratos.py garcilaso

Lee los originales de  imagenes_originales/<personaje>/  (cerrada, media, abierta y
opcionalmente parpadeo; en .png, .jpg o .webp). Si no existen ahí, los toma de
static/img/<personaje>/ y los copia primero a imagenes_originales/ como respaldo.
Escribe el resultado en static/img/<personaje>/*.jpg y una hoja de comparación
en imagenes_originales/<personaje>/_revision.jpg

Las zonas de boca y ojos se leen del bloque "retrato" de personajes/<id>/config.json.
Para probar otras sin editar ese archivo (proporciones de 0 a 1 de la imagen):
    --boca  centro_x,centro_y,radio_x,radio_y   (por defecto 0.5,0.565,0.15,0.135)
    --ojos  centro_x,centro_y,radio_x,radio_y   (por defecto 0.5,0.335,0.17,0.07)
"""
import argparse
import json
import shutil
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

RAIZ = Path(__file__).resolve().parent.parent
NOMBRES = ("cerrada", "media", "abierta", "parpadeo")
EXTS = (".png", ".jpg", ".jpeg", ".webp")


def buscar(carpeta: Path, nombre: str) -> Path | None:
    for ext in EXTS:
        if (carpeta / f"{nombre}{ext}").exists():
            return carpeta / f"{nombre}{ext}"
    return None


def mascara(tam, zona, suavizado):
    w, h = tam
    cx, cy, rx, ry = zona
    m = Image.new("L", tam, 0)
    ImageDraw.Draw(m).ellipse([(cx - rx) * w, (cy - ry) * h, (cx + rx) * w, (cy + ry) * h], fill=255)
    return m.filter(ImageFilter.GaussianBlur(suavizado * w))


def nivel_fondo(img: Image.Image) -> float:
    """Brillo del fondo, medido en el borde de la imagen (Gemini a veces lo deja gris oscuro)."""
    # Solo las dos esquinas de arriba: abajo y a los lados suele estar la ropa.
    a = np.asarray(img).astype(np.float32)
    h, w = a.shape[:2]
    esquinas = np.concatenate([a[: h // 8, : w // 8].reshape(-1, 3), a[: h // 8, -w // 8:].reshape(-1, 3)])
    return float(np.percentile(esquinas.max(1), 90))


def negro_puro(img: Image.Image, fondo: float) -> Image.Image:
    """Lleva el fondo a negro absoluto. Solo cambian los tonos muy oscuros:
    de 0 a u se vuelven negro, de u a 2u se estiran, y de 2u hacia arriba nada cambia."""
    u = min(max(fondo + 6, 8), 60)
    a = np.asarray(img).astype(np.float32)
    a = np.where(a < u, 0, np.where(a < 2 * u, (a - u) * 2, a))
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))


def zona(texto):
    return tuple(float(x) for x in texto.split(","))


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("personaje")
    ap.add_argument("--boca", type=zona, help="si no se da, se lee de personajes/<id>/config.json")
    ap.add_argument("--ojos", type=zona)
    ap.add_argument("--tam", type=int, default=1024, help="lado final en píxeles")
    args = ap.parse_args()
    # Zonas guardadas en el config.json del personaje (bloque "retrato").
    cfg = RAIZ / "personajes" / args.personaje / "config.json"
    retrato = json.loads(cfg.read_text(encoding="utf-8")).get("retrato", {}) if cfg.exists() else {}
    args.boca = args.boca or tuple(retrato.get("boca", (0.5, 0.565, 0.15, 0.135)))
    args.ojos = args.ojos or tuple(retrato.get("ojos", (0.5, 0.335, 0.17, 0.07)))

    destino = RAIZ / "static" / "img" / args.personaje
    originales = RAIZ / "imagenes_originales" / args.personaje
    originales.mkdir(parents=True, exist_ok=True)

    # 1) Respaldar los originales (solo la primera vez).
    for n in NOMBRES:
        if not buscar(originales, n) and (f := buscar(destino, n)):
            shutil.copy2(f, originales / f.name)

    rutas = {n: buscar(originales, n) for n in NOMBRES}
    faltan = [n for n in ("cerrada", "media", "abierta") if not rutas[n]]
    if faltan:
        raise SystemExit(f"Faltan imágenes: {', '.join(faltan)} (en {originales} o {destino})")

    tam = (args.tam, args.tam)
    img = {n: Image.open(r).convert("RGB").resize(tam, Image.LANCZOS) for n, r in rutas.items() if r}
    base = img["cerrada"]
    fondo = nivel_fondo(base)
    print(f"  Fondo original: nivel {fondo:.0f} de 255 (se lleva a negro puro)")
    m_boca = mascara(tam, args.boca, 0.018)
    m_ojos = mascara(tam, args.ojos, 0.012)

    resultado = {"cerrada": base}
    for n in ("media", "abierta"):
        resultado[n] = Image.composite(img[n], base, m_boca)
    if "parpadeo" in img:
        resultado["parpadeo"] = Image.composite(img["parpadeo"], base, m_ojos)

    # 2) Borrar versiones viejas en otros formatos y guardar JPG livianos.
    destino.mkdir(parents=True, exist_ok=True)
    for n in NOMBRES:
        for ext in EXTS:
            (destino / f"{n}{ext}").unlink(missing_ok=True)
    for n, im in resultado.items():
        ruta = destino / f"{n}.jpg"
        negro_puro(im, fondo).save(ruta, quality=88, optimize=True, progressive=True)
        print(f"  {ruta.relative_to(RAIZ)}  ({ruta.stat().st_size // 1024} KB)")

    # 3) Hoja de revisión: arriba originales, abajo resultado, con las zonas marcadas.
    miniatura = 300
    hoja = Image.new("RGB", (miniatura * len(resultado), miniatura * 2), "black")
    for i, n in enumerate(resultado):
        hoja.paste(img[n].resize((miniatura, miniatura)), (i * miniatura, 0))
        abajo = negro_puro(resultado[n], fondo).resize((miniatura, miniatura))
        d = ImageDraw.Draw(abajo)
        z = args.ojos if n == "parpadeo" else args.boca
        if n != "cerrada":
            cx, cy, rx, ry = (v * miniatura for v in z)
            d.ellipse([cx - rx, cy - ry, cx + rx, cy + ry], outline=(0, 255, 120))
        hoja.paste(abajo, (i * miniatura, miniatura))
    hoja.save(originales / "_revision.jpg", quality=85)
    print(f"  Revisión: {(originales / '_revision.jpg').relative_to(RAIZ)}")


if __name__ == "__main__":
    main()
