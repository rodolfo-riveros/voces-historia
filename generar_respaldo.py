"""Fase 7 · Plan B: pregenera los audios de saludos, respuestas frecuentes y lecturas.

Uso (con internet, antes de la feria):  python generar_respaldo.py
Solo algunos personajes:                python generar_respaldo.py vallejo palma
Los mp3 quedan en respaldo/audio/<personaje>/ y el servidor los usa primero,
así la voz del personaje funciona aunque edge-tts o internet fallen ese día.
"""
import asyncio
import sys

import main
import respaldo
import voz


async def generar(solo: list[str]):
    total = nuevos = fallidos = borrados = 0
    for pid, p in main.PERSONAJES.items():
        if solo and pid not in solo:
            continue
        ajustes = p.get("voz", {})
        textos = [*p.get("saludos", []), *respaldo.todos_los_textos(pid)]
        for lectura in p["_lecturas"].values():
            textos += lectura["partes"]
        print(f"\n{p['nombre']}: {len(textos)} audios")
        vigentes = set()
        for texto in textos:
            total += 1
            ruta = voz.ruta_respaldo(pid, ajustes, texto)
            vigentes.add(ruta.name)
            if ruta.exists():
                continue
            ruta.parent.mkdir(parents=True, exist_ok=True)
            try:
                ruta.write_bytes(await voz.sintetizar(ajustes, texto, timeout=40))
                nuevos += 1
                print("  ✓", texto[:60])
            except Exception as e:
                fallidos += 1
                print("  ✗", texto[:60], "->", type(e).__name__)
        # Se borran los audios viejos (de una voz o un texto que ya no se usa).
        carpeta = voz.ruta_respaldo(pid, ajustes, "x").parent
        for viejo in carpeta.glob("*.mp3") if carpeta.exists() else []:
            if viejo.name not in vigentes:
                viejo.unlink()
                borrados += 1
    print(f"\nListo: {total} textos, {nuevos} audios nuevos, {fallidos} fallidos, {borrados} viejos borrados.")


if __name__ == "__main__":
    asyncio.run(generar(sys.argv[1:]))
