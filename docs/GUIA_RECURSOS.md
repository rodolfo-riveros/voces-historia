# Guía de recursos para "Voces de la Historia"

Todo lo que necesitas fuera del código: dónde conseguir imágenes, videos, voces y materiales, y en qué fase usarlo.

**Aviso importante sobre lo "gratis":** las cuotas gratuitas de las herramientas de IA cambian seguido. Antes de usar cualquiera, entra a su página y mira cuánto dan hoy. Lo que sigue son opciones; no hace falta usarlas todas.

## 1. El cerebro (DeepSeek)

- La API de DeepSeek **no es gratis, pero es baratísima**. Con unos pocos dólares de recarga alcanza para cientos de conversaciones cortas, o sea, para toda la feria.
- Para no pasarte de gasto, el servidor tiene un límite por minuto y un tope diario (ya está en el plan).
- Si quieres costo cero, el código usa el formato compatible con OpenAI, así que podrías cambiar a un proveedor con cuota gratis (por ejemplo, la API gratuita de Gemini en Google AI Studio) cambiando solo tres variables del `.env`. La calidad y los límites hay que probarlos.

## 2. Imágenes de los personajes (Fase 3 y 4)

**Qué necesitas por personaje:** 3 imágenes del mismo retrato, mismo encuadre, sobre fondo negro liso:
- `cerrada.png` (boca cerrada)
- `media.png` (boca entreabierta)
- `abierta.png` (boca abierta, como diciendo "a")

**Paso 1. Busca referencias** (para guiar el parecido, no para copiarlas):
- Wikimedia Commons: retratos de dominio público de Garcilaso y fotos antiguas de Grau.
- Arguedas: sus fotos tienen derechos. Úsalas solo para ver sus rasgos; la imagen final debe ser una ilustración original generada.

**Paso 2. Genera el retrato.** Opciones gratuitas (con cuotas):
- **Gemini** (la app o Google AI Studio): genera y también edita imágenes. Es la mejor para mantener la misma cara entre cuadros.
- **Bing Image Creator / Microsoft Designer**
- **Leonardo.ai** (créditos diarios gratis)
- **Ideogram**
- **Hugging Face Spaces** con modelos como FLUX.1 schnell (gratis, a veces con cola de espera)

**Prompt para el retrato** (cambia lo que está entre corchetes):
> Retrato ilustrado semirrealista de [Inca Garcilaso de la Vega, hombre de unos 60 años, vestimenta española del siglo XVII con cuello de lechuguilla], de busto, mirando de frente a la cámara, expresión amable y serena, boca cerrada, iluminación suave, fondo negro liso, estilo pintura digital, alta calidad.

**Paso 3. Saca las variaciones de la boca.** Sube el retrato aprobado a una herramienta que edite imágenes (Gemini) y pide:
> Usa exactamente esta misma imagen sin cambiar nada (rostro, ropa, fondo, encuadre). Solo abre ligeramente la boca como si estuviera hablando.

Luego repite con: *"Igual, pero con la boca bien abierta, como diciendo la letra a."* Si la cara cambia, descarta el resultado e intenta de nuevo.

**Paso 4. Limpia si hace falta.**
- Fondo negro perfecto: `rembg` (programa gratis de código abierto en Python) quita el fondo y luego lo pones en negro con cualquier editor.
- Retoques: Canva (plan gratis) o GIMP (gratis).
- Tamaño recomendado: 1024 × 1024 px, formato PNG.

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
- Para diferenciar a los tres personajes aunque comparten voz: cambia el **tono y la velocidad** (`edge-tts` lo permite), o usa voces de otros países (`es-MX-JorgeNeural`, `es-CO-GonzaloNeural`, `es-ES-AlvaroNeural`).
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
| Pruebas | Tu propio celular Android con Chrome |

## 7. El holograma de pirámide

**Materiales:** una caja de CD (el plástico transparente), una lámina de acetato o acrílico transparente, tijeras o cúter, cinta.

**Medidas para un celular** (ajusta probando): 4 trapecios iguales con **base de 6 cm, parte superior de 1 cm y altura de 3,5 cm**. Los pegas en forma de pirámide trunca, con la punta hacia abajo, apoyada en el centro de la pantalla. Para una tableta, escala las medidas en proporción (más o menos el doble).

**Para que se vea bien:**
- Brillo de la pantalla al máximo, **fondo negro puro** (por eso el modo holograma).
- Lugar con poca luz: una caja o un rincón oscuro ayuda mucho.
- Limpia el plástico: las huellas arruinan el efecto.
- El avatar debe tener fondo negro (ya lo previste en las imágenes) para que "flote".

## 8. Lista para el día de la feria

- Datos móviles propios (no confíes en el wifi del lugar) o un celular como hotspot.
- Batería externa y cable de repuesto.
- Modo demo del plan B probado sin internet.
- Un QR con el enlace para que los visitantes prueben desde su celular (opcional; el límite por IP protege el gasto).
- Un cartel con la frase: *"Los niños que no quieren leer, conversan con el autor."*
- Ensayo con una persona que no conozca el proyecto, en un ambiente con ruido.
