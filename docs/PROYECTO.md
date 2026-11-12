# Voces de la Historia — Documento del proyecto

> *"Los niños que no quieren leer, conversan con el autor."*

**Autor:** Rodolfo Riveros, docente de Desarrollo de Sistemas (Urubamba, Cusco)
**Sitio:** https://voces-historia.profito.io
**Repositorio:** https://github.com/rodolfo-riveros/voces-historia
**Estado:** listo para producción · prueba completa: 525/525 correctas (con IA real)

---

## 1. Qué es

Una aplicación web instalable en el celular (PWA) donde niños y jóvenes **conversan por voz
con personajes históricos del Perú**. El niño pregunta hablando y el personaje responde con
su propia voz, mientras su retrato mueve la boca y parpadea. Pensada para una feria de
emprendimiento y tecnología, y para el aula.

---

## 2. Los 25 personajes (5 categorías)

| Categoría | Personajes |
|---|---|
| ✍️ Escritores | José María Arguedas, Inca Garcilaso de la Vega, Ricardo Palma, César Vallejo, Abraham Valdelomar |
| 🎖️ Héroes | Miguel Grau, Francisco Bolognesi, Túpac Amaru II, Micaela Bastidas, José Olaya |
| 👑 Incas y culturas antiguas | Manco Cápac, Mama Ocllo, Pachacútec, Atahualpa, Señor de Sipán |
| 🔬 Sabios y científicos | Antonio Raimondi, Daniel Alcides Carrión, Julio C. Tello, María Reiche, Pedro Paulet |
| ⛪ Santos del Perú | Santa Rosa de Lima, San Martín de Porres, Santo Toribio de Mogrovejo, San Juan Macías, San Francisco Solano |

**Cada personaje tiene:**
- **Ficha verificada** (`ficha.md`): datos, vida, obras, cómo habla, anécdotas, lo que NO debe decir y sus fuentes.
- **Configuración** (`config.json`): nombre, época, categoría, género, voz, colores, saludos y preguntas sugeridas.
- **Retrato animado:** 4 cuadros (boca cerrada, media y abierta, y ojos cerrados) con fondo negro para el holograma.
- **Saludos naturales y con intriga.** Se presentan como la persona real, con apodos y su tierra.
  Por ejemplo, Arguedas es "el Tayta", de Andahuaylas, "pradera de los celajes, cuna de los aguerridos chankas".
- **Ambiente sonoro propio:** mar, Andes, campanas, etc.
- **Respuestas sin internet** (respaldo) con sus audios.
- Solo Garcilaso tiene **lecturas reales** (su obra es de dominio público).

Las categorías están en `personajes/categorias.json`: para crecer basta agregar carpetas.

---

## 3. Cómo se usa (pantallas)

1. **Inicio:** las caras de un personaje por categoría (Arguedas al centro) y el botón "¡Toca para empezar!".
2. **Elegir personaje:** filtros por categoría, o "Todos" mezclados para mostrar la variedad.
   También se puede decir el nombre ("Quiero hablar con Grau").
3. **Conversación:**
   - Retrato grande, botón de micrófono y estado visible (Escuchando, Pensando, Hablando).
   - Subtítulos que avanzan con la voz.
   - Preguntas sugeridas, botón "Sus obras / Sus hazañas" y botón "Otra vez".
   - Botón de sonido ambiente y botón **"¿De dónde sale lo que cuento?"** con las fuentes.
   - Si no hay micrófono, aparece una caja para escribir.
   - Si se hace otra pregunta mientras el personaje habla, cancela la anterior.
4. **Lecturas (Garcilaso):** lee fragmentos reales por partes, con barra de avance.

---

## 4. El "cerebro": IA generativa

- **DeepSeek**, conectado con el formato OpenAI. Cambiar de proveedor es solo cambiar el `.env`.
- Responde **cualquier pregunta** dentro del personaje, no solo lo que está en la ficha.
- Mensaje de sistema = reglas (`prompts.py`) + la ficha del personaje + los últimos 6 mensajes.
- Respuestas de 40 a 80 palabras, sin listas ni markdown, en lenguaje para alguien de 10 años.
- **No dice que es una IA.** Solo si un niño pregunta "¿eres real?", responde con ternura
  que vivió de verdad y que su voz vuelve gracias a la tecnología.
- Si la IA falla, tarda o se acaba el tope del día → contesta con el **respaldo sin internet**.

### Rigor: información verdadera
- **Fichas verificadas sin Wikipedia.** Fuentes: Biblioteca Nacional del Perú, Real Academia
  de la Historia, Vaticano, Congreso, Archivo Histórico de Marina, UNESCO, NASA, BCRP, SciELO.
- **La IA separa tres cosas:**
  - **Hechos:** solo si están comprobados.
  - **Leyendas y milagros:** siempre con "según la tradición…".
  - **Ambientación:** sin inventar recuerdos concretos.
- Si los historiadores no coinciden, lo dice. Lo marcado con `[VERIFICAR]` lo trata con cautela.
- Nunca inventa fechas, cifras, anécdotas ni frases textuales.
- **Derechos de autor:** Arguedas y otros autores con obra protegida cuentan de qué tratan sus
  libros, pero no se leen textos de ellos.
- Se corrigieron datos falsos que circulan en internet. Por ejemplo, la Estela Raimondi no la
  encontró Raimondi: la halló un campesino, Timoteo Espinoza, que la usaba como mesa.

---

## 5. La voz

- **Texto a voz:** edge-tts (voces neuronales de Microsoft, gratis), una voz distinta por personaje.
  Raimondi tiene voz italiana y María Reiche voz alemana.
- **Voz en vivo:** el audio empieza a sonar en ~1 s, mientras se genera.
- **Audios pregenerados** de saludos y respuestas frecuentes (~440): salen al instante y sin internet.
- **Lectura correcta** de números romanos ("Túpac Amaru segundo", "siglo dieciocho"),
  rangos de años ("1438 a 1471") y soles ("100 soles").
- **Respaldos de voz, en orden:**
  1. Si edge-tts falla, se reintenta una vez.
  2. Si sigue fallando, se usa la voz del navegador **del género correcto** del personaje.
- Si el celular bloquea el audio, aparece **"Toca la pantalla para escuchar"** y suena la voz
  verdadera del personaje, no la robótica.
- **Voz a texto:**
  - En Chrome se usa el reconocimiento del navegador (`es-PE`).
  - En los demás navegadores se usa **Whisper en el servidor**, que transcribe en memoria y no guarda nada.
- **Se evaluó Gemini** para voces más humanas. Exige activar la facturación de Google
  (unos 2 dólares para regenerar los audios y unos 7 dólares por día de feria).
  Se decidió seguir con la opción gratuita.

---

## 6. Avatar animado

- La boca cambia entre cerrada, media y abierta según el **volumen real del audio**
  (Web Audio, cada 60 ms). Los ojos parpadean solos.
- En reposo, una animación suave de "respiración".
- Sin retrato, se muestra un avatar dibujado.
- **Herramienta** `herramientas/preparar_retratos.py`:
  - Estandariza nombres y formatos (JPG, PNG, WEBP, JFIF).
  - Detecta la boca y los ojos.
  - Pega solo esas zonas para que la cara no "tiemble".
  - Lleva el fondo a negro puro.
  - Genera una hoja de revisión.

---

## 7. Modo holograma

- Para colocar la pantalla bajo una **pirámide de acrílico**. Se activa con `?holograma=1` o con su botón.
- Fondo negro puro y el personaje repetido 4 veces, rotado, una vez por cada cara de la pirámide.
- **Se conversa tocando cualquier parte de la pantalla.** Tiene conversación continua,
  pitidos que avisan cuándo hablar, panel de control, gestos y atajos de teclado.

---

## 8. App instalable (PWA)

- Se abre en el navegador (lo mejor es **Chrome en Android**) y se instala con
  "Agregar a la pantalla principal". No necesita tienda de aplicaciones.
- Se adapta a celulares, tablets, computadoras y pantallas grandes.
- Tiene un service worker mínimo que solo guarda los archivos estáticos.
  La versión actual de caché es `voces-v14`.
- **Requiere HTTPS** para el micrófono.

---

## 9. Plan B: sin internet o con la IA caída

- Respuestas preparadas (12 por personaje) en `respaldo/<id>.json`, generadas desde la ficha
  verificada con revisión automática de cifras, y revisadas a mano.
- Sus audios están en `respaldo/audio/`.
- **Modo demo** para forzar el respaldo.
- Aviso amable al llegar al tope diario de preguntas.

---

## 10. Cuidado de los niños y privacidad

- **No se graba audio ni se guardan datos personales**, porque la usan menores de edad.
  El historial de la conversación vive solo en el navegador.
- **Si un niño dice que está triste o en peligro,** el personaje deja su papel un momento
  y le dice con cariño que hable con un adulto de confianza.
- **Temas difíciles** (guerras, muertes): se cuentan con delicadeza, sin detalles crueles.
- **Si intentan sacarlo de su papel** o piden contenido inapropiado, el personaje
  redirige con amabilidad.
- **Límites:** 20 preguntas por minuto por IP y 1 500 por día.
  Las IP se guardan en memoria y cifradas.
- **Ninguna clave está en el código:** todo va en `.env`, que no se sube a GitHub.

---

## 11. Servidor y API

**Tecnología:** Python 3.11+, FastAPI y uvicorn (una sola app que también sirve el frontend);
HTML, CSS y JavaScript puro, sin frameworks ni build step; sin base de datos.

| Método | Ruta | Para qué |
|---|---|---|
| GET | `/health` | Responde `ok` |
| GET | `/api/estado` | Si la IA está activa o en modo demo |
| GET | `/api/personajes` | Lista de personajes |
| GET | `/api/categorias` | Categorías con personajes y su portada |
| POST | `/api/chat` | Pregunta → respuesta del personaje |
| POST | `/api/tts` | Texto → mp3 completo |
| GET | `/api/voz` | Texto → mp3 en vivo (por partes) |
| POST | `/api/stt` | Audio → texto (Whisper) |
| GET | `/api/fuentes/{id}` | Fuentes verificadas del personaje |
| GET | `/api/lecturas/{id}` y `/api/lecturas/{id}/{lectura}` | Lecturas de Garcilaso |
| GET | `/api/respaldo/{id}` | Preguntas con respuesta sin internet |

### Variables del `.env`

| Variable | Para qué |
|---|---|
| `DEEPSEEK_API_KEY` · `DEEPSEEK_BASE_URL` · `DEEPSEEK_MODEL` | La IA (`deepseek-flash`) |
| `MAX_TOKENS` · `IA_RAZONAR` · `HISTORIAL_MAX` · `TIMEOUT_IA` | Largo, rapidez y memoria de la IA |
| `LIMITE_POR_MIN` · `TOPE_DIARIO` | Límites de uso |
| `MODO_DEMO` | Forzar respuestas sin IA |
| `STT_ACTIVO` · `WHISPER_MODELO` · `WHISPER_HILOS` | Voz a texto en el servidor |

---

## 12. Herramientas incluidas

| Herramienta | Qué hace |
|---|---|
| `herramientas/probar_todo.py` | Prueba completa: servidor, 25 personajes, retratos, voces, fuentes, respaldo, lecturas, seguridad y (con `--ia`) la IA real |
| `herramientas/crear_respaldo.py` | Crea las respuestas sin internet desde la ficha y rechaza cifras inventadas |
| `generar_respaldo.py` | Genera los audios de saludos, respaldo y lecturas, y borra los viejos |
| `herramientas/preparar_retratos.py` | Procesa los retratos (nombres, zonas de boca y ojos, fondo negro) |
| `herramientas/generar_iconos.py` | Íconos de la app instalable |
| `docs/PROMPTS_GEMINI.md` | Prompts para crear retratos de nuevos personajes |

**Para probar antes de la feria** (con el servidor encendido):
`python herramientas/probar_todo.py --ia`

---

## 13. Despliegue

- **VPS:** Caddy con HTTPS automático, servicio systemd `voces` y carpeta `/opt/voces`.
- **Actualización automática** (`.github/workflows/desplegar.yml`): cada push a `main`
  entra por SSH, actualiza el código, instala dependencias si cambiaron, reinicia el servicio
  y comprueba `/health`.
  ⚠️ **Falta activarla una vez:** crear los secrets `VPS_HOST`, `VPS_USUARIO` y `VPS_CLAVE_SSH`
  en GitHub y permitir el reinicio del servicio. Los pasos están en el README.
- **Actualización manual:** en el servidor, `bash deploy/actualizar.sh`.

---

## 14. Recomendaciones para la feria

- Usar **Chrome en Android**. Para el holograma, agregar `?holograma=1` a la dirección.
- **Subir `LIMITE_POR_MIN` en el `.env`** ese día: si todos los celulares usan el mismo wifi,
  el servidor los ve como una sola IP.
- Correr `probar_todo.py --ia` antes de abrir.
- Llevar datos móviles de respaldo. Si falla el internet, las preguntas frecuentes
  siguen funcionando.

---

## 15. Ideas para crecer

- Más personajes: Chabuca Granda, Clorinda Matto de Turner, María Parado de Bellido, entre otros.
- Voces más humanas con Gemini, si en el futuro se activa la facturación.
- Avatares en 3D.

---

*Voces de la Historia: el Perú te habla.*
