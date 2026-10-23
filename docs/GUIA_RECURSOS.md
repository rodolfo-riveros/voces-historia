# Guía de recursos para "Voces de la Historia"

Todo lo que necesitas fuera del código: dónde conseguir imágenes, videos, voces y materiales, y en qué fase usarlo.

**Aviso importante sobre lo "gratis":** las cuotas gratuitas de las herramientas de IA cambian seguido. Antes de usar cualquiera, entra a su página y mira cuánto dan hoy. Lo que sigue son opciones; no hace falta usarlas todas.

## 1. El cerebro (DeepSeek)

- La API de DeepSeek **no es gratis, pero es baratísima**. Con unos pocos dólares de recarga alcanza para cientos de conversaciones cortas, o sea, para toda la feria.
- Para no pasarte de gasto, el servidor tiene un límite por minuto y un tope diario (ya está en el plan).
- Si quieres costo cero, el código usa el formato compatible con OpenAI, así que podrías cambiar a un proveedor con cuota gratis (por ejemplo, la API gratuita de Gemini en Google AI Studio) cambiando solo tres variables del `.env`. La calidad y los límites hay que probarlos.

## 2. Imágenes de los personajes (Fase 3 y 4)

Todo está en [PROMPTS_GEMINI.md](PROMPTS_GEMINI.md): qué imágenes hacen falta, la referencia real de cada personaje (con su licencia) y el prompt para Gemini. Las imágenes van en `static/img/<id>/` (ver `static/img/LEEME.txt`).

**Para limpiar si hace falta:** `rembg` (gratis, en Python) quita el fondo; Canva o GIMP para retoques.

## 3. Video (opcional, no es prioridad)

Primero hazlo funcionar con imágenes. El video es un lujo, y sirve para tres cosas:
1. **Presentación de 10 a 15 segundos por personaje**, para mostrar en la pantalla de espera o como respaldo si todo falla.
2. **Animación de reposo** (el personaje respirando o parpadeando) en vez del cuadro estático.
3. **Fondos** (un Cusco antiguo, un barco, una biblioteca).

**Herramientas gratuitas** (todas con cuotas diarias o de prueba, algunas con marca de agua):
- *De imagen a video:* Kling, Hailuo, Luma Dream Machine, Pika, Runway. Subes el retrato y pides "el personaje parpadea y respira suavemente, sin mover la cámara".
- *Cabeza parlante* (imagen + audio = video hablando): Hedra, D-ID, HeyGen en sus planes gratuitos o de prueba. Para uso sin marca de agua y sin límite: SadTalker, LivePortrait o Wav2Lip en Hugging Face Spaces o en Google Colab (GPU gratis con límites).
- *Edición:* CapCut o DaVinci Resolve (ambos gratis), `ffmpeg` para recortar y repetir en bucle.

**Material de archivo** (revisa la licencia de cada uno):
- Imágenes y videos libres: Pexels, Pixabay, Wikimedia Commons.
- Imágenes históricas: Biblioteca Nacional del Perú y Archivo General de la Nación (sus colecciones digitales).

## 4. Las voces

- `edge-tts` incluye voces peruanas: `es-PE-AlexNeural` (hombre) y `es-PE-CamilaNeural` (mujer). Lista completa con `edge-tts --list-voices`; confirma ahí los nombres vigentes.
- Para diferenciar a los personajes que comparten voz: cambia el **tono y la velocidad** (`edge-tts` lo permite), o usa voces de otros países (`es-MX-JorgeNeural`, `es-CO-GonzaloNeural`, `es-ES-AlvaroNeural`).
- `edge-tts` no es oficial de Microsoft: puede dejar de funcionar. Por eso el plan incluye la voz del navegador como respaldo, y por eso conviene pregenerar los audios del plan B.
- **No clones la voz real** de Arguedas ni de nadie con grabaciones. Es delicado éticamente y legalmente, y no hace falta.

## 5. Las fichas de los personajes

Es la parte que más cuida la calidad: si la ficha es buena, el personaje no inventa.

- **Garcilaso:** *Comentarios Reales* y *La Florida del Inca* están en dominio público. Búscalos en la Biblioteca Virtual Miguel de Cervantes, Wikisource o Project Gutenberg. De ahí sacas los fragmentos cortos (de 1 a 2 minutos de lectura) para la carpeta `lecturas/`.
- **Grau:** Marina de Guerra del Perú, Museo Naval, biografías confiables.
- **Arguedas:** biografías y estudios; escribe tus propios resúmenes de las obras. No pegues páginas de sus libros en la ficha.
- Puedes pedirle a Claude (aquí o en Claude Code) que te redacte el borrador de cada ficha, pero **tú la revisas contra las fuentes**. Eres docente: tu revisión es lo que hace que sea confiable para colegios.

## 6. Dominio, servidor y código

| Recurso | Opción gratuita |
|---|---|
| Dominio | DuckDNS (subdominio gratis) |
| HTTPS | Caddy (certificado automático) |
| Código | GitHub, repositorio privado |
| Pruebas | Tu celular (cualquier navegador) |

## 7. El holograma de pirámide

La guía completa (materiales, medidas para celular, tableta y monitor, armado y montaje del stand) está en [HOLOGRAMA.md](HOLOGRAMA.md).

## 8. Lista para el día de la feria

- Datos móviles propios (no confíes en el wifi del lugar) o un celular como hotspot.
- Batería externa y cable de repuesto.
- Modo demo del plan B probado sin internet.
- Un QR con el enlace para que los visitantes prueben desde su celular (opcional; el límite por IP protege el gasto).
- Un cartel con la frase: *"Los niños que no quieren leer, conversan con el autor."*
- Ensayo con una persona que no conozca el proyecto, en un ambiente con ruido.
