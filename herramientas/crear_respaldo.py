"""Crea las respuestas de respaldo (plan B sin internet) de un personaje a partir de su ficha verificada.

Uso:
    python herramientas/crear_respaldo.py micaela          # un personaje
    python herramientas/crear_respaldo.py --faltantes      # todos los que no tienen respaldo/<id>.json

La IA redacta usando SOLO los datos de personajes/<id>/ficha.md. Después se revisa
automáticamente que cada año o cifra de las respuestas aparezca en la ficha; si alguna
no aparece, se vuelve a pedir. Al final, revisa tú el archivo respaldo/<id>.json.
Luego ejecuta generar_respaldo.py para crear los audios.
"""
import argparse
import json
import re
import sys
import unicodedata
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RAIZ))
sys.stdout.reconfigure(encoding="utf-8")

from openai import OpenAI  # noqa: E402

import config  # noqa: E402

INSTRUCCIONES = """Eres redactor de material educativo para niños de 8 a 14 años en el Perú.
Vas a escribir respuestas en primera persona, como si hablara {nombre}, para una app que
las lee en voz alta cuando no hay internet.

REGLAS ESTRICTAS:
- Usa EXCLUSIVAMENTE los datos de la ficha. No agregues fechas, cifras, nombres, lugares,
  anécdotas ni frases célebres que no estén en la ficha. Si la ficha no tiene un dato para
  una pregunta, responde con algo general y verdadero de su vida o su época, sin inventar.
- Lo que la ficha presenta como leyenda, tradición o interpretación, cuéntalo como tal
  ("según la tradición…", "se cuenta que…", "los arqueólogos creen que…").
- Si la ficha dice que hay versiones distintas de un dato, dilo así.
- Cada respuesta: 35 a 70 palabras, 3 o 4 oraciones, lenguaje claro, cálido, sin listas,
  sin markdown, sin emojis. Puede terminar con una pregunta corta para el niño.
- Nunca digas que eres una inteligencia artificial. Para "¿Eres real?": viviste de verdad
  (o, si es un personaje de leyenda, eres la voz de la leyenda que cuentan los abuelos) y
  hoy tu voz vuelve gracias a la tecnología.
- Lo difícil (guerras, muertes) con delicadeza y sin detalles crueles.
- Respeta las indicaciones de la sección "Lo que NO sabe o no debe decir".

Devuelve SOLO un JSON válido con esta forma:
{{"no_entiendo": "...", "tope": "...", "preguntas": [{{"pregunta": "...", "claves": ["...", "..."], "respuesta": "..."}}]}}
- "no_entiendo": frase amable para cuando no se reconoce la pregunta, que invite a preguntar
  por dos temas de su vida.
- "tope": frase amable para cuando se acabaron las preguntas del día.
- "claves": 3 a 6 palabras o frases cortas, en minúsculas y sin tildes, con las que un niño
  podría hacer esa pregunta.
- Responde exactamente estas preguntas, en este orden:
{preguntas}

# FICHA DE {nombre_mayus}
{ficha}
"""

FIJAS = ["¿Quién eres?", "Cuéntame algo curioso", "¿Cómo era tu época?", "¿Qué opinas del celular?",
         "¿Qué les dirías a los niños?", "¿Eres real?"]


def sin_tildes(t: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFD", t.lower()) if unicodedata.category(c) != "Mn")


def cifras_inventadas(datos: dict, ficha: str) -> list[str]:
    """Años y cifras de las respuestas que NO aparecen en la ficha."""
    textos = [datos.get("no_entiendo", ""), datos.get("tope", "")] + [p["respuesta"] for p in datos.get("preguntas", [])]
    # Se quita el punto final ("1857." al terminar una oración) para comparar bien.
    numeros_ficha = {n.rstrip(".") for n in re.findall(r"\d[\d.]*", ficha.replace(" ", ""))}
    malas = []
    for t in textos:
        for n in re.findall(r"\d[\d.]*", t.replace(" ", "")):
            n = n.rstrip(".")
            if n and n not in numeros_ficha and n.replace(".", "") not in numeros_ficha:
                malas.append(n)
    return malas


def crear(pid: str, cliente: OpenAI) -> bool:
    carpeta = RAIZ / "personajes" / pid
    cfg = json.loads((carpeta / "config.json").read_text(encoding="utf-8"))
    ficha = re.sub(r"<!--.*?-->", "", (carpeta / "ficha.md").read_text(encoding="utf-8"), flags=re.S).strip()
    preguntas = FIJAS[:2] + [cfg["pregunta_obras"]] + cfg.get("sugerencias", [])[:5] + FIJAS[2:]
    vistas = []
    preguntas = [p for p in preguntas if not (sin_tildes(p) in vistas or vistas.append(sin_tildes(p)))]
    prompt = INSTRUCCIONES.format(nombre=cfg["nombre"], nombre_mayus=cfg["nombre"].upper(), ficha=ficha,
                                  preguntas="\n".join(f"  {i + 1}. {p}" for i, p in enumerate(preguntas)))
    for intento in range(1, 4):
        r = cliente.chat.completions.create(
            model=config.DEEPSEEK_MODEL, temperature=0.3, max_tokens=6000,
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
        )
        try:
            datos = json.loads(r.choices[0].message.content)
            assert len(datos["preguntas"]) >= len(preguntas) - 1
        except Exception:
            print(f"  {pid}: intento {intento}, JSON inválido; reintento")
            continue
        malas = cifras_inventadas(datos, ficha)
        if malas:
            print(f"  {pid}: intento {intento}, cifras que no están en la ficha: {sorted(set(malas))}; reintento")
            prompt += f"\n\nATENCIÓN: en el intento anterior usaste {sorted(set(malas))}, que NO están en la ficha. No los uses."
            continue
        for p in datos["preguntas"]:
            p["claves"] = [sin_tildes(c).strip() for c in p.get("claves", []) if c.strip()]
        (RAIZ / "respaldo" / f"{pid}.json").write_text(json.dumps(datos, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"  {pid}: {len(datos['preguntas'])} respuestas creadas")
        return True
    print(f"  {pid}: NO se pudo crear sin cifras dudosas; hazlo a mano")
    return False


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("personaje", nargs="?")
    ap.add_argument("--faltantes", action="store_true")
    args = ap.parse_args()
    if config.MODO_DEMO:
        sys.exit("Falta la clave de IA en .env")
    cliente = OpenAI(api_key=config.DEEPSEEK_API_KEY, base_url=config.DEEPSEEK_BASE_URL, timeout=180)
    if args.faltantes:
        ids = [d.name for d in sorted((RAIZ / "personajes").iterdir())
               if (d / "config.json").exists() and not (RAIZ / "respaldo" / f"{d.name}.json").exists()]
    elif args.personaje:
        ids = [args.personaje]
    else:
        sys.exit("Indica un personaje o --faltantes")
    print(f"Creando respaldo de: {', '.join(ids)}")
    for pid in ids:
        crear(pid, cliente)


if __name__ == "__main__":
    main()
