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
EXTS = (".png", ".jpg", ".jpeg", ".jfif", ".webp")
# Otros nombres que se aceptan para cada imagen.
ALIAS = {"media": ("media", "entreabierta", "semiabierta"), "parpadeo": ("parpadeo", "ojos_cerrados")}


def buscar(carpeta: Path, nombre: str) -> Path | None:
    for alias in ALIAS.get(nombre, (nombre,)):
        for ext in EXTS:
            if (carpeta / f"{alias}{ext}").exists():
                return carpeta / f"{alias}{ext}"
    return None


def _sin_tildes(texto: str) -> str:
    import unicodedata
    t = unicodedata.normalize("NFD", texto.lower())
    return "".join(c for c in t if unicodedata.category(c) != "Mn")


def tipo_de_imagen(nombre_archivo: str) -> str | None:
    """Reconoce el nombre aunque venga distinto: "boca abierta", "medio abierto", "entre abierta ",
    "ojo cerrado", "cerra", "Cerrada (1)"... Devuelve cerrada, media, abierta, parpadeo o None."""
    n = _sin_tildes(Path(nombre_archivo).stem).replace("_", " ").replace("-", " ")
    if "parp" in n or ("ojo" in n and "cerr" in n) or "blink" in n:
        return "parpadeo"
    if any(p in n for p in ("medi", "entre", "entra", "semi")):
        return "media"
    if "abiert" in n or "open" in n:
        return "abierta"
    if "cerr" in n or "closed" in n:
        return "cerrada"
    return None


def estandarizar_nombres(carpeta: Path) -> None:
    """Renombra las imágenes a cerrada/media/abierta/parpadeo.jpg (y convierte PNG/WebP a JPG)."""
    if not carpeta.is_dir():
        return
    for f in sorted(carpeta.iterdir()):
        if not f.is_file() or f.suffix.lower() not in EXTS:
            continue
        tipo = tipo_de_imagen(f.name)
        destino = carpeta / f"{tipo}.jpg"
        if not tipo or f == destino:
            continue
        if destino.exists():
            print(f"  Aviso: hay dos imágenes para '{tipo}' ({f.name} y {destino.name}); dejo {destino.name}")
            continue
        with Image.open(f) as im:
            if im.format == "JPEG":
                im.close()
                f.rename(destino)
            else:
                im.convert("RGB").save(destino, quality=95)
                im.close()
                f.unlink()
        print(f"  Renombrado: '{f.name}' -> {destino.name}")


def detectar_zonas(img: dict) -> dict:
    """Ubica ojos y boca comparando las imágenes: lo que cambia entre ellas es justo esa zona."""
    gris = {n: np.asarray(im.convert("L"), dtype=np.float32) for n, im in img.items()}
    h = gris["cerrada"].shape[0]
    centro = slice(int(h * 0.28), int(h * 0.72))  # columnas centrales (la cara)

    def perfil(nombre, desde, hasta):
        d = np.abs(gris["cerrada"] - gris[nombre])[int(h * desde):int(h * hasta), centro]
        filas = np.convolve(d.mean(1), np.ones(15) / 15, mode="same")
        return filas, int(h * desde)

    ojos_y = 0.36
    if "parpadeo" in gris:
        filas, ini = perfil("parpadeo", 0.18, 0.5)
        ojos_y = (int(np.argmax(filas)) + ini) / h
    filas, ini = perfil("abierta", ojos_y + 0.1, 0.97)
    pico = int(np.argmax(filas))
    fuertes = np.where(filas > filas[pico] * 0.3)[0]
    # Tramo continuo alrededor del pico (desde la nariz/bigote hasta el mentón).
    arriba, abajo = pico, pico
    while arriba - 1 in fuertes:
        arriba -= 1
    while abajo + 1 in fuertes:
        abajo += 1
    y0, y1 = (arriba + ini) / h, (abajo + ini) / h
    # -0.015: el mentón suele moverse más que el labio de arriba y baja un poco el centro.
    boca_y, boca_r = (y0 + y1) / 2 - 0.015, min(max((y1 - y0) / 2 + 0.02, 0.12), 0.15)
    return {
        "boca": [0.5, round(boca_y, 3), 0.15, round(boca_r, 3)],
        "ojos": [0.5, round(ojos_y, 3), 0.17, 0.06],
        "zoom": 1.15,
        "foco_y": round((ojos_y + boca_y) / 2, 3),
    }


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
    ap.add_argument("--detectar", action="store_true", help="vuelve a detectar las zonas aunque ya estén guardadas")
    args = ap.parse_args()
    # Zonas guardadas en el config.json del personaje (bloque "retrato").
    cfg = RAIZ / "personajes" / args.personaje / "config.json"
    datos_cfg = json.loads(cfg.read_text(encoding="utf-8")) if cfg.exists() else {}
    retrato = datos_cfg.get("retrato", {})

    destino = RAIZ / "static" / "img" / args.personaje
    originales = RAIZ / "imagenes_originales" / args.personaje
    originales.mkdir(parents=True, exist_ok=True)

    # 0) Nombres y extensiones al estándar (acepta "boca abierta.jpg", "ojo cerrado.png", ".jfif"...).
    estandarizar_nombres(destino)

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

    # Zonas: las guardadas en config.json o, si no hay, se detectan solas y se guardan.
    if args.detectar or not retrato.get("boca"):
        retrato = {**retrato, **detectar_zonas(img)}
        if cfg.exists():
            datos_cfg["retrato"] = retrato
            cfg.write_text(json.dumps(datos_cfg, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"  Zonas detectadas y guardadas en config.json: boca {retrato['boca']}, ojos {retrato['ojos']}")
    args.boca = args.boca or tuple(retrato["boca"])
    args.ojos = args.ojos or tuple(retrato["ojos"])
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
        for alias in ALIAS.get(n, (n,)):
            for ext in EXTS:
                (destino / f"{alias}{ext}").unlink(missing_ok=True)
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
