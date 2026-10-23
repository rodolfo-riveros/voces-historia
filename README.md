# Voces de la Historia

App web (PWA) donde niños y jóvenes **conversan por voz** con 20 personajes históricos del Perú, en cuatro categorías:
escritores y poetas, héroes y heroínas, incas y Perú antiguo, y sabios y científicos (lista en [docs/PROMPTS_GEMINI.md](docs/PROMPTS_GEMINI.md)).

> *"Los niños que no quieren leer, conversan con el autor."*

## Probar en tu computadora (Windows)

```bash
py -3 -m venv .venv
.venv\Scripts\python -m pip install -r requirements.txt
copy .env.example .env
.venv\Scripts\python -m uvicorn main:app --reload --port 8000
```

Abre <http://localhost:8000> en **cualquier navegador** (Chrome, Edge, Brave, Firefox, Safari). En `localhost` el micrófono funciona sin HTTPS.
La primera vez que arranca descarga el modelo de voz Whisper (~150 MB).

- **Sin clave de DeepSeek** la app arranca en **modo demo**: responde con las preguntas frecuentes de `respaldo/`.
- **Con clave**: pon `DEEPSEEK_API_KEY=...` en `.env` y reinicia. Si la IA falla o se acaba el saldo, responde con el respaldo automáticamente.

### Probar desde el celular en la misma red
Los navegadores solo permiten el micrófono con HTTPS (o `localhost`). Para la feria usa el despliegue en tu VPS (abajo).

### Reconocimiento de voz en cualquier navegador
- **Google Chrome** usa su propio reconocimiento (rápido, con el texto apareciendo mientras hablas).
- **Edge, Brave, Opera, Firefox, Safari…** graban la pregunta y la transcribe el servidor con **Whisper** (`stt.py`), en 1–3 segundos. Si el reconocimiento de Chrome falla por red, la app pasa sola al del servidor.
- El audio se transcribe en memoria y se descarta: **nunca se guarda**.
- Se configura en `.env`: `WHISPER_MODELO=base` (1–2 GB de RAM) o `small` (4 GB o más, entiende mejor a los niños).

## Cómo se usa

| Pantalla | Qué hace |
|---|---|
| Inicio | "¡Toca para empezar!" (también desbloquea el audio en iPhone) |
| Elegir | Toca una tarjeta o di el nombre: *"Quiero hablar con Grau"* |
| Conversación | Toca el micrófono, habla, y vuelve a tocar al terminar. El personaje piensa y responde con voz y subtítulos. Ideas de preguntas abajo; botón **Escribir** para usar teclado (útil con ruido) |
| Lecturas | Solo Garcilaso: lee fragmentos reales de los *Comentarios Reales* por partes |
| Retratos | Cada personaje usa sus imágenes de `static/img/<id>/`; mientras no las tenga, muestra una silueta con su color |
| Sin micrófono | Pasos para dar permiso + preguntas para tocar |

La interfaz se adapta sola: una columna en celular vertical y dos columnas (avatar grande + conversación) en celular horizontal, tablet, computadora, proyector y TV. En pantallas muy grandes todo crece.

### Modo holograma

Se entra con el botón **Holograma** (ícono de pirámide) en la pantalla de elegir personaje, o con el mismo ícono arriba a la derecha durante la conversación. También se puede abrir directo: `/?holograma=1&p=grau`.

Primero aparece un **panel para quien atiende el stand**: elegir personaje, ajustar el tamaño a tu pirámide, mostrar una cruz para centrarla, activar la **conversación continua** (después de cada respuesta vuelve a escuchar sola, sin tocar nada) y los pitidos que avisan cuándo escucha. Al tocar **Empezar** se pone en pantalla completa y el personaje saluda.

| Acción | Táctil | Teclado |
|---|---|---|
| Hablar / detener | Toque en cualquier parte | Espacio o Enter |
| Cambiar personaje | Deslizar a los lados | ← → |
| Volver al panel | Mantener presionado 2 s | Esc |

Mientras escucha, el personaje brilla en verde; mientras piensa, en amarillo. Los retratos propios están en [docs/PROMPTS_GEMINI.md](docs/PROMPTS_GEMINI.md).

### Sonido ambiente
Cada personaje tiene su ambiente, generado por el navegador (no necesita archivos ni internet):
- **Grau:** olas, gaviotas y crujido del barco; al entrar, campana de barco.
- **Arguedas:** río, arpa tocando un huayno y pájaros; al entrar, un zumbayllu y un arpegio.
- **Garcilaso:** viento de cordillera, campanas lejanas y una pluma que escribe; al entrar, campanas.

El ambiente baja cuando el personaje habla y se calla mientras escucha, para no confundir al micrófono. Se silencia con el botón de parlante (arriba a la derecha en la conversación) y en el holograma tiene su propio control de volumen. Para usar grabaciones reales, lee `static/sonidos/LEEME.txt`.

**Otros enlaces**
- `/?p=grau` → abre directo la selección (para un QR por personaje).

### La IA
Con clave en `.env`, la IA responde **cualquier** pregunta como el personaje: usa la ficha como fuente principal y, si la ficha no lo cubre, razona con lo que se sabe de su vida y su época, sin inventar datos. Sin clave, solo responde las preguntas frecuentes y la app muestra el aviso "SIN IA · falta la clave en .env". Proveedores: DeepSeek (`deepseek-flash`, de pago muy barato) o Gemini (cuota gratuita) — ver `.env.example`.

**Modo demo oculto:** toca **5 veces seguidas** el título "Voces de la Historia" (o el sello "Recreado con IA"). Aparece una etiqueta DEMO y todas las respuestas salen del respaldo, sin gastar API ni depender de internet para la IA.

## Estructura

```
main.py            rutas FastAPI y arranque (sirve también static/)
config.py          lee .env
prompts.py         prompt base + ficha; limpia la respuesta para voz
limites.py         límite por IP/minuto y tope diario (solo en memoria)
respaldo.py        plan B: busca la pregunta frecuente más parecida
voz.py             edge-tts; usa primero los mp3 pregenerados
stt.py             voz a texto con Whisper (para navegadores sin reconocimiento propio)
generar_respaldo.py  pregenera audios de saludos, respuestas y lecturas
personajes/<id>/   config.json (voz, colores, sugerencias), ficha.md, lecturas/
respaldo/<id>.json preguntas frecuentes por personaje
respaldo/audio/    mp3 pregenerados (se crean con generar_respaldo.py)
static/            index.html, app.js, oido.js (micrófono), avatares.js, ambiente.js, style.css, manifest.json, sw.js
static/img/<id>/   tus retratos: cerrada, media, abierta y parpadeo (.jpg, .png o .webp)
herramientas/      preparar_retratos.py (alinea bocas y ojos) y generar_iconos.py (íconos PNG de la PWA)
deploy/            Caddyfile y voces.service
```

## Antes de la feria (lista de tareas para Rodolfo)

1. **Revisar las fichas** (`personajes/*/ficha.md`). Las de los personajes nuevos ya se contrastaron con fuentes, que figuran al final de cada una; revisa lo marcado `[VERIFICAR]` (los comentarios `<!-- -->` no se envían a la IA).
2. **Revisar las respuestas de respaldo** (`respaldo/*.json`): son las que se oyen si falla internet. Por ahora solo las tienen Garcilaso, Arguedas y Grau; los demás, sin internet, responden con una frase amable genérica.
3. **Verificar los números de ayuda** que se dan si un niño dice que quiere hacerse daño (`main.py`, `_MENSAJE_AYUDA`: Línea 113 opción 5 y Línea 100).
4. Si cambias textos o voces, vuelve a correr `python generar_respaldo.py` (con internet).
5. **Retratos:** genera las imágenes con los prompts de [docs/PROMPTS_GEMINI.md](docs/PROMPTS_GEMINI.md) y cópialas en `static/img/<id>/` (ver `static/img/LEEME.txt`). No hace falta reiniciar: basta recargar la página.

## Cambiar voces

En `personajes/<id>/config.json`, bloque `"voz"`: nombre de voz de edge-tts, `velocidad` (ej. `-8%`) y `tono` (ej. `-4Hz`).
Lista de voces: `.venv\Scripts\edge-tts --list-voices`. Cada personaje tiene una voz distinta (por ejemplo Garcilaso `es-ES-AlvaroNeural`, porque vivió en España).

## Agregar un personaje

1. Crea `personajes/<id>/` con `config.json` (copia uno existente), `ficha.md`, y `respaldo/<id>.json`.
2. En el `config.json` define:
   - `"categoria"`: una de `personajes/categorias.json` → `escritores`, `heroes`, `incas` o `sabios`.
   - `"rol"`: lo que fue, en pocas palabras (ej. `"Poeta"`, `"Heroína de la independencia"`).
   - `"periodo"`: `Perú antiguo`, `Incas`, `Virreinato`, `Independencia`, `República` o `Siglo XX`.
   - `"orden"`: posición en la lista (los 3 primeros salen en las caras del inicio).
3. Retratos: copia sus imágenes a `static/img/<id>/` (opcional: `herramientas/preparar_retratos.py <id>` para que no "tiemble"). Sin retratos se muestra una silueta.
4. Reinicia el servidor y ejecuta `python generar_respaldo.py` para sus audios de respaldo.

La pantalla de selección muestra solo las categorías que ya tienen personajes, con filtros, y la frase y las caras del inicio se actualizan solas. Para crear una categoría nueva (por ejemplo "Artistas y músicos"), agrégala a `personajes/categorias.json`.

**Ideas para crecer:** Clorinda Matto de Turner o Chabuca Granda (una categoría de artistas y músicos), María Parado de Bellido (héroes).

## Despliegue en el VPS (Ubuntu/Debian)

```bash
sudo useradd -r -m -d /opt/voces voces
sudo -u voces git clone <tu-repo> /opt/voces
cd /opt/voces
sudo -u voces python3 -m venv .venv
sudo -u voces .venv/bin/pip install -r requirements.txt
sudo -u voces cp .env.example .env    # y pon la clave
sudo -u voces .venv/bin/python generar_respaldo.py
sudo cp deploy/voces.service /etc/systemd/system/
sudo systemctl enable --now voces
# Caddy: apt install caddy; edita deploy/Caddyfile con tu dominio DuckDNS
sudo cp deploy/Caddyfile /etc/caddy/Caddyfile && sudo systemctl reload caddy
```

Comprueba con `curl https://<tu-dominio>/health` → `ok`.

## Privacidad (menores de edad)

- No se guarda audio. En Chrome el reconocimiento ocurre en el navegador; en los demás, el audio llega al servidor, Whisper lo transcribe en memoria y se descarta sin escribirse en disco.
- No se guardan conversaciones ni datos personales; el historial vive solo en la memoria del navegador.
- Los límites por IP se llevan en memoria y con la IP cifrada (hash).

## API

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/health` | `ok` |
| GET | `/api/estado` | modo demo, si hay voz a texto en el servidor y uso del día |
| GET | `/api/personajes` | lista de personajes |
| POST | `/api/chat` | `{personaje, mensajes:[{rol:"usuario"\|"personaje", texto}], demo?}` → `{texto, origen}` |
| POST | `/api/tts` | `{personaje, texto}` → mp3 |
| POST | `/api/stt?personaje=<id>` | audio grabado (webm/ogg/mp4) en el cuerpo → `{texto}` |
| GET | `/api/lecturas/{id}` y `/api/lecturas/{id}/{lectura}` | fragmentos para leer en voz alta |

`origen` puede ser `ia`, `respaldo`, `tope`, `limite` o `cuidado`.

## Créditos

- Fragmentos de *Comentarios Reales de los Incas* (1609), dominio público, tomados de Wikisource.
- Tipografías Baloo 2 y Nunito (SIL Open Font License).
- Las obras de José María Arguedas tienen derechos de autor: la app solo las resume, nunca las cita.
