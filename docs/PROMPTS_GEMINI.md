# Prompts para Gemini: retratos de los personajes

Con estas imágenes, la app (pantalla normal **y** holograma) deja de usar las ilustraciones de dibujo y muestra tus retratos, con boca que se mueve al hablar y ojos que parpadean.

## 1. Qué necesito exactamente

Por cada personaje, **4 imágenes del mismo retrato** (la 4.ª es opcional):

| Archivo | Qué muestra |
|---|---|
| `cerrada.png` | Boca cerrada, ojos abiertos (la imagen base) |
| `media.png` | Boca entreabierta |
| `abierta.png` | Boca bien abierta, como diciendo "a" |
| `parpadeo.png` | *(opcional)* Ojos cerrados, boca cerrada |

Dónde van:

```
static/img/garcilaso/cerrada.png  media.png  abierta.png  parpadeo.png
static/img/arguedas/...
static/img/grau/...
```

Sirven en **JPG, PNG o WebP** (tal como los descarga Gemini).

**Después de copiarlas, ejecuta una vez** (cambia el nombre del personaje):

```bash
.venv/Scripts/python herramientas/preparar_retratos.py arguedas
```

Ese programa guarda tus originales en `imagenes_originales/`, toma de cada variación **solo la boca o los ojos** y los pega sobre la imagen base. Así, aunque Gemini haya redibujado un poco el cabello o la ropa, el personaje no "tiembla". También deja el fondo en negro puro y las imágenes livianas (~100 KB). Revisa el resultado en `imagenes_originales/<personaje>/_revision.jpg`: arriba están tus originales y abajo el resultado, con la zona usada marcada en verde. Luego recarga la página.

**Reglas para que funcione bien:**
- **Cuadradas**, 1024 × 1024 px, PNG.
- **Fondo negro puro** (#000000). En el holograma, el negro se vuelve transparente y el personaje "flota".
- **Mismo encuadre en las 4:** busto de frente, la cabeza más o menos en el centro horizontal, la coronilla cerca del 12 % desde arriba y los hombros llegando al borde de abajo. Si la cabeza se mueve entre una imagen y otra, el personaje "tiembla" al hablar.
- **Luz de contorno (rim light):** en el holograma todo lo oscuro desaparece, así que ropa negra sobre fondo negro se pierde. Pedimos una luz suave en el borde para separar la silueta del fondo.
- **Mismo estilo para los tres**, para que se vean como una colección.

## 2. Cómo trabajar en Gemini (paso a paso)

1. Abre **Gemini** (gemini.google.com) o **Google AI Studio** y elige el modelo de imágenes (*Nano Banana* / "Gemini Image").
2. Pega el **prompt del retrato base** del personaje (sección 3). Genera varias veces hasta que te guste. Esa es `cerrada.png`.
3. **En el mismo chat**, con esa imagen, pega el prompt de **boca entreabierta** (sección 4). Descárgala como `media.png`.
4. Vuelve a la imagen base y pega el de **boca abierta** → `abierta.png`.
5. Lo mismo con **parpadeo** → `parpadeo.png`.
6. **Revisa** que la cara, la ropa y el encuadre no hayan cambiado. Truco: ábrelas en el visor de fotos y pasa de una a otra con las flechas. Si algo "salta", descártala y repite. Si Gemini insiste en cambiar la cara, sube la imagen base de nuevo y repite el pedido.
7. Antes de generar otro personaje, empieza un **chat nuevo**.

> En cada personaje se indica qué imagen de referencia puedes subir a Gemini (solo las de dominio público) y cuál conviene usar solo para mirar.

## 3. Prompts del retrato base (`cerrada`)

Las descripciones salen de las imágenes reales que el público reconoce. **Para que se parezcan de verdad, sube también la imagen de referencia** que se indica en cada personaje y luego pega el prompt. Gemini usa la foto para los rasgos y el prompt para el estilo, la ropa y el encuadre.

Los tres prompts empiezan con la misma línea de estilo, para que se vean como una colección. Si cambias el estilo, cámbialo igual en los tres.

### Inca Garcilaso de la Vega

**Referencia:** no existe ningún retrato hecho en vida. La cara que todos reconocen en el Perú la pintó el cusqueño **Francisco González Gamarra** a partir de 1925: busca "Inca Garcilaso González Gamarra" para verla. Esa pintura es del siglo XX y puede tener derechos de autor, así que **no la subas**: usa solo la descripción.

```
Retrato ilustrado semirrealista, estilo pintura digital cálida y detallada, como de película animada de alta calidad.
Personaje: el Inca Garcilaso de la Vega, escritor mestizo cusqueño, hijo de una princesa inca y de un capitán español, a sus 50 años.
Rostro: alargado y delgado, de rasgos andinos y españoles mezclados; pómulos marcados; frente alta y amplia; piel trigueña cálida; ojos oscuros almendrados, de mirada serena, inteligente y algo melancólica, con párpados un poco caídos; cejas oscuras finas y arqueadas; nariz larga y recta, ligeramente aguileña; labios delgados.
Cabello: negro y lacio, corto, peinado hacia atrás y pegado a la cabeza, dejando ver la frente alta.
Vello facial: bigote negro delgado y bien cuidado, con las puntas hacia los lados, y una pequeña perilla (mosca) negra justo debajo del labio inferior. Mejillas y mentón afeitados.
Ropa: jubón de terciopelo negro de caballero español de fines del siglo XVI, con cuello alto y cerrado negro, rematado arriba por un borde blanco delgado de camisa (sin gorguera grande). Sobre el pecho, una gruesa cadena de oro de eslabones con una medalla dorada redonda.
Expresión: serena, digna y amable, con una sonrisa muy leve. Boca cerrada.
Encuadre: busto de frente, mirando directo a la cámara, cabeza centrada, la coronilla cerca del borde superior dejando un pequeño margen, los hombros llegan al borde inferior. Formato cuadrado 1:1.
Iluminación: luz cálida y suave en el rostro, más una luz de contorno dorada en el cabello, los hombros y el borde del jubón, para que la ropa negra se separe del fondo.
Fondo: negro puro y liso (#000000), sin degradados, sin textura, sin objetos. Sin texto, sin marcos, sin marca de agua.
```

### José María Arguedas

**Referencia:** sube la foto de Arguedas con su gato en Chaclacayo, que es de **dominio público en el Perú**: <https://commons.wikimedia.org/wiki/File:Jos%C3%A9_Mar%C3%ADa_Arguedas_en_Chaclacayo,_Lima,_Per%C3%BA.jpg>. Su imagen más conocida (saco de tweed, mirada de lado) es la del mural del parque Arguedas en Andahuaylas. Al subir la foto, escribe antes del prompt: *"Usa esta foto solo como referencia del rostro de la persona."*

```
Retrato ilustrado semirrealista, estilo pintura digital cálida y detallada, como de película animada de alta calidad.
Personaje: José María Arguedas, escritor y antropólogo peruano, nacido en Andahuaylas, a sus 50 años (década de 1960).
Rostro: alargado, de piel clara con un leve tono trigueño; frente alta con entradas marcadas a los lados; pómulos marcados y mejillas algo hundidas; cejas oscuras, gruesas y rectas, un poco juntas; ojos castaños, hundidos, de mirada intensa, sensible y melancólica, con ojeras suaves; nariz grande, larga y recta; labios delgados.
Cabello: castaño oscuro con algunas canas en las sienes, ondulado y abundante en la parte de arriba, peinado hacia atrás con volumen y un mechón suelto que cae sobre la frente.
Vello facial: bigote castaño oscuro, corto y tupido, bien recortado sobre el labio superior. Sin barba.
Ropa: saco de tweed gris de espiga, de los años cincuenta y sesenta, con camisa oscura de cuello abierto, sin corbata.
Expresión: cálida pero pensativa, con una sonrisa leve y tímida, como quien recuerda su infancia en los Andes. Boca cerrada.
Encuadre: busto de frente, mirando directo a la cámara, cabeza centrada, la coronilla cerca del borde superior dejando un pequeño margen, los hombros llegan al borde inferior. Formato cuadrado 1:1.
Iluminación: luz cálida y suave en el rostro, más una luz de contorno dorada en el cabello y los hombros para separar la silueta del fondo.
Fondo: negro puro y liso (#000000), sin degradados, sin textura, sin objetos. Sin texto, sin marcos, sin marca de agua.
```

### Miguel Grau

**Referencia:** sube el retrato al óleo de Grau con uniforme, que es del siglo XIX y de **dominio público**: <https://commons.wikimedia.org/wiki/File:Miguel_Grau_01.jpg>. Escribe antes del prompt: *"Usa este retrato como referencia del rostro y del uniforme."*

```
Retrato ilustrado semirrealista, estilo pintura digital cálida y detallada, como de película animada de alta calidad.
Personaje: Miguel Grau Seminario, almirante peruano, el Caballero de los Mares, a sus 45 años (1879).
Rostro: redondo y lleno, de piel clara con mejillas sonrosadas; frente muy amplia por una calvicie en la parte de arriba de la cabeza; ojos oscuros, de mirada serena, bondadosa y firme; cejas castañas; nariz recta y ancha.
Cabello: castaño oscuro, escaso arriba, peinado hacia los lados y detrás de las orejas.
Vello facial (muy importante): grandes patillas castañas oscuras, muy pobladas y esponjosas, que bajan por las mejillas y se unen con un bigote tupido y ancho. El mentón y la zona de debajo de la boca están AFEITADOS: no tiene barba en la barbilla.
Ropa: levita de la Marina de Guerra del Perú de 1879, azul marino oscuro, con cuello y bocamangas bordados en hilo dorado, hombreras doradas de contraalmirante, botones dorados, camisa blanca de cuello alto y corbata de lazo negra (corbatín).
Expresión: noble, tranquila y bondadosa, con una sonrisa muy leve bajo el bigote. Boca cerrada.
Encuadre: busto de frente, mirando directo a la cámara, cabeza centrada, la coronilla cerca del borde superior dejando un pequeño margen, los hombros llegan al borde inferior. Formato cuadrado 1:1.
Iluminación: luz cálida y suave en el rostro, más una luz de contorno fría y sutil en el contorno de la cabeza y los hombros para separar la silueta del fondo.
Fondo: negro puro y liso (#000000), sin degradados, sin textura, sin objetos. Sin texto, sin marcos, sin marca de agua.
```

**Si el parecido no sale a la primera:** genera varias veces y, en el mismo chat, corrige lo que falle con frases cortas. Por ejemplo: *"Igual, pero con el mentón afeitado y las patillas más grandes"*, *"Igual, pero con la frente más alta y el bigote más tupido"* o *"Igual, pero con el cuello alto negro, sin gorguera"*.

## 4. Prompts para las variaciones (en el mismo chat, sobre la imagen base)

### Boca entreabierta → `media.png`

```
Edita esta misma imagen. No cambies absolutamente nada más: el mismo rostro, la misma ropa, el mismo peinado, la misma iluminación, el mismo fondo negro, el mismo encuadre y la cabeza exactamente en la misma posición y tamaño.
Lo único que cambia: la boca ligeramente abierta, como si estuviera hablando en medio de una frase (pronunciando la letra "e"). Se ven apenas los dientes de arriba. Los ojos siguen abiertos mirando a la cámara.
```

### Boca abierta → `abierta.png`

```
Edita esta misma imagen. No cambies absolutamente nada más: el mismo rostro, la misma ropa, el mismo peinado, la misma iluminación, el mismo fondo negro, el mismo encuadre y la cabeza exactamente en la misma posición y tamaño.
Lo único que cambia: la boca bien abierta, como si estuviera diciendo la letra "a" al hablar con entusiasmo. La mandíbula baja un poco, se ven los dientes de arriba y un poco de la lengua. Los ojos siguen abiertos mirando a la cámara.
```

### Ojos cerrados → `parpadeo.png` (opcional)

```
Edita esta misma imagen. No cambies absolutamente nada más: el mismo rostro, la misma ropa, el mismo peinado, la misma iluminación, el mismo fondo negro, el mismo encuadre y la cabeza exactamente en la misma posición y tamaño.
Lo único que cambia: los ojos completamente cerrados y relajados, como en un parpadeo natural. La boca queda cerrada igual que en la imagen original.
```

**Si el fondo no sale negro puro:** pide *"Cambia solo el fondo a negro puro #000000, sin tocar al personaje"*. También puedes quitar el fondo con `rembg` (ver `GUIA_RECURSOS.md`).

## 5. Extras opcionales

### Video de espera para el holograma (Veo, desde Gemini)
La app no lo necesita, pero sirve para una pantalla de presentación o un video de respaldo. Sube `cerrada.png` y pide:

```
Anima esta imagen: el personaje respira suavemente, parpadea dos veces y sonríe un poco, mirando siempre a la cámara. La cámara no se mueve. El fondo sigue negro puro. Sin texto. Duración 8 segundos, que el último cuadro sea igual al primero para repetirlo en bucle.
```

### Cartel para el stand de la feria

```
Diseña un cartel vertical para una feria escolar de tecnología en el Perú. Título grande: "Voces de la Historia". Frase: "Los niños que no quieren leer, conversan con el autor". Muestra a tres personajes históricos peruanos ilustrados con estilo cálido y amigable: el Inca Garcilaso de la Vega (cuello de lechuguilla), José María Arguedas (terno de los años 50) y Miguel Grau (uniforme naval del siglo XIX). Colores vivos: morado #3B1FA8, rojo #D12F45, amarillo #F2A900 y azul #1F6FD1 sobre fondo lila claro. Deja un espacio cuadrado blanco abajo a la derecha para pegar un código QR. Tipografía redondeada y amigable. Estilo limpio y moderno para niños.
```

### Revisar y ampliar las fichas (Gemini con "Deep Research")
Lo que más mejora las respuestas de la IA es una buena ficha. Puedes pedir un borrador y luego **tú lo verificas**:

```
Investiga la vida de [Miguel Grau] usando fuentes confiables (instituciones oficiales del Perú, museos, universidades, biografías académicas). Escribe en español, para que lo use un personaje de inteligencia artificial que conversa con niños de 8 a 14 años, con estas secciones: Datos básicos; Vida (por etapas); Obras o hazañas (con año y de qué tratan); Cómo hablaba y qué valoraba; 10 anécdotas verdaderas y apropiadas para niños; Temas delicados y cómo tratarlos con cuidado. Marca con [VERIFICAR] cualquier dato en el que las fuentes no coincidan. Al final, lista las fuentes con sus enlaces. No inventes citas textuales.
```

Pega el resultado revisado en `personajes/<id>/ficha.md` (respeta las secciones que ya tiene).
