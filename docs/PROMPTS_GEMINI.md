# Prompts para Gemini: retratos de los personajes

Con estas imágenes, la app (pantalla normal **y** holograma) muestra tus retratos, con boca que se mueve al hablar y ojos que parpadean. Mientras un personaje no tenga imágenes, aparece una silueta con su color.

## 1. Qué necesito exactamente

Por cada personaje, **4 imágenes del mismo retrato** (la 4.ª es opcional). Si por ahora solo tienes `cerrada`, también funciona: el retrato se muestra fijo y "late" suavemente al hablar.

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

**Lista de personajes** (al menos 5 por categoría). La carpeta lleva el nombre de la columna *id*:

| Categoría | Personaje | id (carpeta) | Estado |
|---|---|---|---|
| Escritores y poetas | Inca Garcilaso de la Vega | `garcilaso` | En la app |
| | José María Arguedas | `arguedas` | En la app |
| | César Vallejo | `vallejo` | Nuevo |
| | Ricardo Palma | `palma` | Nuevo |
| | Abraham Valdelomar | `valdelomar` | Nuevo |
| Héroes y heroínas | Miguel Grau | `grau` | En la app |
| | Túpac Amaru II | `tupac_amaru` | Nuevo |
| | Micaela Bastidas | `micaela` | Nuevo |
| | Francisco Bolognesi | `bolognesi` | Nuevo |
| | José Olaya | `olaya` | Nuevo |
| Incas y Perú antiguo | Manco Cápac | `manco_capac` | Nuevo |
| | Mama Ocllo | `mama_ocllo` | Nuevo |
| | Pachacútec | `pachacutec` | Nuevo |
| | Atahualpa | `atahualpa` | Nuevo |
| | Señor de Sipán | `sipan` | Nuevo |
| Sabios y científicos | Antonio Raimondi | `raimondi` | Nuevo |
| | Daniel Alcides Carrión | `carrion` | Nuevo |
| | Pedro Paulet | `paulet` | Nuevo |
| | Julio C. Tello | `tello` | Nuevo |
| | María Reiche | `reiche` | Nuevo |

> Los personajes nuevos necesitan, además de sus retratos, su carpeta en `personajes/<id>/` con `config.json` (voz, colores, saludos) y `ficha.md`. Eso es un paso aparte: los retratos se pueden ir generando desde ya.

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
- **Mismo estilo para todos**, para que se vean como una colección.

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

Todos los prompts empiezan con la misma línea de estilo, para que se vean como una colección. Si cambias el estilo, cámbialo igual en todos.

**Sobre las imágenes de referencia:** solo sube a Gemini las que sean de **dominio público**. Antes de subir una imagen de Wikimedia Commons, revisa la sección *Licencia* de su página: tiene que decir "dominio público" o tener una licencia libre (CC BY o CC BY-SA). Si no lo dice, o si se trata de una pintura, escultura o reconstrucción moderna, úsala solo para mirarla y guíate por la descripción.

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

---

## 3b. Personajes nuevos

Cada descripción sale de **mirar la imagen de referencia indicada** (fotografías y pinturas de Wikimedia Commons, revisadas en octubre de 2026). Se indica la licencia de cada una:

- **Dominio público** o **CC BY / CC BY-SA**: puedes subirla a Gemini como referencia, escribiendo antes del prompt: *"Usa esta imagen como referencia del rostro, el peinado y la ropa."*
- **Sin licencia libre**: úsala solo para mirarla.

Cuando no existe un retrato de la época (los incas, Túpac Amaru II, Micaela Bastidas), se sigue la imagen tradicional más antigua que se conoce, y se indica cuál es.

### Escritores y poetas

#### César Vallejo (`vallejo`)

**Referencia (dominio público):** fotografía de París, 17 de diciembre de 1930. <https://commons.wikimedia.org/wiki/File:Cesar_Vallejo_(1930)_-_Restored.jpg>

```
Retrato ilustrado semirrealista, estilo pintura digital cálida y detallada, como de película animada de alta calidad.
Personaje: César Vallejo, poeta peruano nacido en Santiago de Chuco (La Libertad), a sus 38 años (París, 1930).
Rostro: delgado, anguloso y huesudo, de rasgos mestizos andinos; piel trigueña; pómulos muy salientes; surcos marcados que bajan de la nariz a las comisuras de la boca; frente amplia; ojos oscuros hundidos, de párpados algo pesados, mirada seria, profunda y melancólica; cejas oscuras rectas; nariz recta, ancha en la base; labios medianos, cerrados y serios; orejas un poco salientes.
Cabello: negro, abundante y lacio, peinado hacia atrás con volumen arriba.
Vello facial: completamente afeitado, sin bigote ni barba.
Ropa: terno oscuro de lana de solapas anchas, chaleco, camisa clara de rayas finas y corbata con un dibujo pequeño de cuadritos.
Expresión: serena y pensativa, con una tristeza suave en la mirada. Boca cerrada.
Encuadre: busto de frente, mirando directo a la cámara, cabeza centrada, la coronilla cerca del borde superior dejando un pequeño margen, los hombros llegan al borde inferior. Formato cuadrado 1:1.
Iluminación: luz cálida y suave en el rostro, más una luz de contorno dorada en el cabello y los hombros, para que el terno oscuro se separe del fondo.
Fondo: negro puro y liso (#000000), sin degradados, sin textura, sin objetos. Sin texto, sin marcos, sin marca de agua.
```

#### Ricardo Palma (`palma`)

**Referencia (dominio público):** fotografía de Manuel Moral, hacia 1910 (Archivo Courret, Biblioteca Nacional del Perú). <https://commons.wikimedia.org/wiki/File:Palma1.jpg>

```
Retrato ilustrado semirrealista, estilo pintura digital cálida y detallada, como de película animada de alta calidad.
Personaje: Ricardo Palma, escritor limeño, autor de las Tradiciones peruanas y director de la Biblioteca Nacional, a sus 75 años (hacia 1908).
Rostro: ancho, lleno y redondeado, con papada; piel clara; cejas gruesas y canosas; ojos oscuros, de mirada bondadosa, algo cansada y pícara; nariz ancha y carnosa; mejillas llenas.
Cabello: blanco, abundante y ondulado, peinado hacia arriba y hacia atrás (NO es calvo).
Vello facial: bigote blanco muy grande y poblado, caído hacia los lados (estilo morsa); deja ver el labio inferior. Mentón y mejillas afeitados, sin barba.
Accesorio: quevedos (anteojos pequeños sin patillas, sujetos en la nariz) con una cadenita fina que cuelga hacia el pecho.
Ropa: saco oscuro de comienzos del siglo XX, chaleco, camisa blanca de cuello alto y corbata de rayas diagonales.
Expresión: amable y traviesa, como un abuelo a punto de contar un cuento. Boca cerrada.
Encuadre: busto de frente, mirando directo a la cámara, cabeza centrada, la coronilla cerca del borde superior dejando un pequeño margen, los hombros llegan al borde inferior. Formato cuadrado 1:1.
Iluminación: luz cálida y suave en el rostro, más una luz de contorno dorada en el cabello blanco y los hombros, para que el saco oscuro se separe del fondo.
Fondo: negro puro y liso (#000000), sin degradados, sin textura, sin objetos. Sin texto, sin marcos, sin marca de agua.
```

> Si el bigote tapa toda la boca, la animación al hablar casi no se nota: pide *"Igual, pero que el bigote deje ver bien el labio inferior"*.

#### Abraham Valdelomar (`valdelomar`)

**Referencia (dominio público):** fotografía publicada por la Biblioteca Nacional del Perú. <https://commons.wikimedia.org/wiki/File:Valdelomar1.jpg>. Según su biógrafo Luis Alberto Sánchez, al volver de Roma usaba quevedos con una cinta.

```
Retrato ilustrado semirrealista, estilo pintura digital cálida y detallada, como de película animada de alta calidad.
Personaje: Abraham Valdelomar, escritor peruano nacido en Ica, autor del cuento El Caballero Carmelo, a sus 28 años (1916), elegante como un dandi.
Rostro: ovalado y lleno, de piel clara con un leve tono trigueño; frente amplia; ojos oscuros, de mirada seria y soñadora; cejas oscuras finas; nariz recta; labios llenos; mentón redondeado.
Cabello: castaño oscuro, corto, liso y bien peinado, con raya al costado.
Vello facial: completamente afeitado.
Accesorio: quevedos redondos de marco metálico fino, sujetos en la nariz, con una cinta oscura que cuelga a un lado de la cara.
Ropa: saco claro de color crema, camisa blanca de cuello alto almidonado y una gran corbata de lazo negra.
Expresión: serena, soñadora y un poco orgullosa. Boca cerrada.
Encuadre: busto de frente, mirando directo a la cámara, cabeza centrada, la coronilla cerca del borde superior dejando un pequeño margen, los hombros llegan al borde inferior. Formato cuadrado 1:1.
Iluminación: luz cálida y suave en el rostro, más una luz de contorno dorada en el cabello y los hombros para separar la silueta del fondo.
Fondo: negro puro y liso (#000000), sin degradados, sin textura, sin objetos. Sin texto, sin marcos, sin marca de agua.
```

### Héroes y heroínas

#### Túpac Amaru II (`tupac_amaru`)

**Referencia:** no se conserva ningún retrato hecho en vida. La imagen más antigua de dominio público es el mural de **Tadeo Escalante** (siglo XIX), que lo muestra a caballo con casaca roja de botones dorados y sombrero de ala ancha con pluma: <https://commons.wikimedia.org/wiki/File:Rebelión_de_Tupac_Amaru,_de_Tadeo_Escalante_(1802-1840).jpg>. Súbelo solo como **referencia de la ropa**. El rostro sigue la imagen tradicional con la que se le representa en el Perú.

```
Retrato ilustrado semirrealista, estilo pintura digital cálida y detallada, como de película animada de alta calidad.
Personaje: José Gabriel Condorcanqui, Túpac Amaru II, curaca de Tungasuca (Cusco), descendiente de los incas, líder de la rebelión de 1780, a sus 42 años.
Rostro: andino mestizo, de piel cobriza; rostro alargado; pómulos altos y marcados; frente amplia; ojos oscuros, de mirada firme, noble y serena; cejas negras rectas; nariz aguileña; labios firmes.
Cabello: negro y lacio, largo hasta los hombros.
Vello facial: afeitado.
Ropa: casaca roja del siglo XVIII con botones dorados y bordes dorados, camisa blanca con chorrera de encaje en el cuello. Sombrero negro de ala ancha, levantado de un lado, con una pluma oscura.
Expresión: digna, serena y decidida. Boca cerrada.
Encuadre: busto de frente, mirando directo a la cámara, cabeza centrada, la parte de arriba del sombrero cerca del borde superior dejando un pequeño margen, los hombros llegan al borde inferior. Formato cuadrado 1:1.
Iluminación: luz cálida y suave en el rostro, más una luz de contorno dorada en el sombrero, el cabello y los hombros, para que el sombrero negro se separe del fondo.
Fondo: negro puro y liso (#000000), sin degradados, sin textura, sin objetos. Sin texto, sin marcos, sin marca de agua.
```

#### Micaela Bastidas (`micaela`)

**Referencia (dominio público):** sello postal del Perú de 1971 basado en el retrato al óleo con el que se la conoce: <https://commons.wikimedia.org/wiki/File:Stamp_of_Peru_-_Micaela_Bastidas_(cropped).jpeg>. No existe un retrato hecho en vida. Por su padre tenía ascendencia africana (en su época la llamaban "zamba"). El retrato tradicional la muestra con rasgos mestizos.

```
Retrato ilustrado semirrealista, estilo pintura digital cálida y detallada, como de película animada de alta calidad.
Personaje: Micaela Bastidas Puyucahua, heroína peruana nacida en Pampamarca (Canas, Cusco), esposa de Túpac Amaru II y estratega de la rebelión de 1780, a sus 36 años.
Rostro: alargado y anguloso, de rasgos mestizos; piel trigueña; pómulos marcados; mentón firme; ojos oscuros, de mirada intensa, valiente y decidida; cejas oscuras bien definidas; nariz recta y prominente; labios finos.
Cabello: negro, con raya al medio, peinado liso y recogido hacia atrás, cubriendo las orejas.
Ropa: vestido de color granate oscuro de cuello alto, con un fino cuello de encaje blanco y pequeños botones al frente.
Expresión: firme, serena y segura. Boca cerrada.
Encuadre: busto de frente, mirando directo a la cámara, cabeza centrada, la coronilla cerca del borde superior dejando un pequeño margen, los hombros llegan al borde inferior. Formato cuadrado 1:1.
Iluminación: luz cálida y suave en el rostro, más una luz de contorno dorada en el cabello y los hombros, para que el vestido oscuro se separe del fondo.
Fondo: negro puro y liso (#000000), sin degradados, sin textura, sin objetos. Sin texto, sin marcos, sin marca de agua.
```

#### Francisco Bolognesi (`bolognesi`)

**Referencia (dominio público):** óleo de Daniel Hernández (1924): <https://commons.wikimedia.org/wiki/File:Francisco_Bolognesi.jpg>. La pintura es de cuerpo entero y de perfil: pide que lo ponga de frente y en busto.

```
Retrato ilustrado semirrealista, estilo pintura digital cálida y detallada, como de película animada de alta calidad.
Personaje: Francisco Bolognesi, coronel del Ejército del Perú, héroe de Arica, nacido en Lima, a sus 63 años (1880).
Rostro: alargado y enérgico, de piel clara curtida; frente amplia; nariz recta y prominente; ojos claros, de mirada firme, serena y valiente, con arrugas suaves; cejas canosas pobladas.
Cabello: blanco, abundante y ondulado, peinado hacia atrás con volumen.
Vello facial (muy importante): bigote blanco poblado con las puntas hacia los lados y una perilla blanca y larga en punta en el mentón (piocha). Las mejillas están AFEITADAS: no tiene barba completa.
Ropa: levita militar azul muy oscuro, casi negra, de 1880, con cuello alto rojo bordado en hilo dorado, botones dorados al frente y pequeñas hombreras doradas.
Expresión: noble, tranquila y decidida. Boca cerrada.
Encuadre: busto de frente, mirando directo a la cámara, cabeza centrada, la coronilla cerca del borde superior dejando un pequeño margen, los hombros llegan al borde inferior. Formato cuadrado 1:1.
Iluminación: luz cálida y suave en el rostro, más una luz de contorno fría y sutil en el cabello blanco y los hombros para separar la silueta del fondo.
Fondo: negro puro y liso (#000000), sin degradados, sin textura, sin objetos. Sin texto, sin marcos, sin marca de agua.
```

#### José Olaya (`olaya`)

**Referencia (dominio público):** óleo de **José Gil de Castro** (1828), pintor de su época, que se conserva en el Museo Nacional de Arqueología, Antropología e Historia del Perú: <https://commons.wikimedia.org/wiki/File:José_Olaya_óleo.jpg>. Es de cuerpo entero: pide busto.

```
Retrato ilustrado semirrealista, estilo pintura digital cálida y detallada, como de película animada de alta calidad.
Personaje: José Silverio Olaya Balandra, pescador de Chorrillos (Lima) y mensajero de los patriotas en la Independencia del Perú, a sus 31 años (1823).
Rostro: alargado, de piel morena; pómulos marcados; frente amplia; ojos oscuros, de mirada serena, leal y tranquila; cejas negras finas; nariz recta y larga; labios cerrados.
Vello facial (importante): patillas negras largas y pobladas que bajan por las mejillas hasta la mandíbula. Sin bigote y sin barba en el mentón.
Cabello: negro, corto, casi todo cubierto por el gorro.
Gorro: gorro blanco de tela, ajustado a la cabeza, con un borde fino de encaje.
Ropa: chaqueta blanca de cuello ancho abierto, camisa blanca con una pechera de encaje fino. Es la mejor ropa que podía tener un pescador.
Expresión: humilde, firme y cálida, con una sonrisa muy leve. Boca cerrada.
Encuadre: busto de frente, mirando directo a la cámara, cabeza centrada, la parte de arriba del gorro cerca del borde superior dejando un pequeño margen, los hombros llegan al borde inferior. Formato cuadrado 1:1.
Iluminación: luz cálida y suave en el rostro, más una luz de contorno azulada, como del mar al atardecer, en los hombros. La ropa blanca debe verse limpia, sin quemarse por exceso de luz.
Fondo: negro puro y liso (#000000), sin degradados, sin textura, sin objetos. Sin texto, sin marcos, sin marca de agua.
```

### Incas y Perú antiguo

No hay retratos de los incas hechos en vida. La referencia más conocida es la **serie de 14 retratos de los reyes incas** de la escuela cusqueña del siglo XVIII, que está en el Brooklyn Museum y es de **dominio público**. Las pinturas son de perfil o de tres cuartos: pide siempre *"de frente y en busto"*.

#### Manco Cápac (`manco_capac`)

**Referencia (dominio público):** <https://commons.wikimedia.org/wiki/File:Brooklyn_Museum_-_Manco_Capac,_First_Inca,_1_of_14_Portraits_of_Inca_Kings_-_overall.jpg>

```
Retrato ilustrado semirrealista, estilo pintura digital cálida y detallada, como de película animada de alta calidad.
Personaje: Manco Cápac, el primer Inca de la leyenda, hijo del Sol, fundador del Cusco, joven adulto de unos 30 años.
Rostro: andino, de piel cobriza oscura; rostro ancho; pómulos altos; frente amplia; ojos oscuros almendrados, de mirada serena y protectora; cejas negras rectas; nariz recta y fuerte; labios firmes.
Cabello: negro y lacio, corto a la altura de las orejas.
Tocado: llautu (cinta tejida de colores) alrededor de la cabeza, con un adorno dorado en forma de media luna sobre la frente y dos pequeñas plumas oscuras arriba.
Joyas: grandes orejeras redondas de oro con forma de espiral en los lóbulos de las orejas.
Vello facial: lampiño.
Ropa: manta andina tejida sobre los hombros, con franjas de colores rojo, naranja, crema y marrón, y un unku (túnica) oscuro debajo.
Expresión: noble, serena y luminosa. Boca cerrada.
Encuadre: busto de frente, mirando directo a la cámara, cabeza centrada, la parte de arriba de las plumas cerca del borde superior dejando un pequeño margen, los hombros llegan al borde inferior. Formato cuadrado 1:1.
Iluminación: luz cálida y dorada en el rostro, como del sol de la mañana, más una luz de contorno dorada en el cabello y los hombros para separar la silueta del fondo.
Fondo: negro puro y liso (#000000), sin degradados, sin textura, sin objetos. Sin texto, sin marcos, sin marca de agua.
```

#### Mama Ocllo (`mama_ocllo`)

**Referencia:** no hay un retrato suyo de dominio público que sirva. La pintura de Commons titulada "Inca Princess" muestra a otra ñusta e incluye una escena violenta, así que **no la uses**. La ropa sigue los retratos de coyas (reinas incas) de la escuela cusqueña: ñañaca (paño doblado sobre la cabeza), lliclla (manta) y tupu (alfiler).

```
Retrato ilustrado semirrealista, estilo pintura digital cálida y detallada, como de película animada de alta calidad.
Personaje: Mama Ocllo, la primera coya (reina) de la leyenda inca, compañera de Manco Cápac, que enseñó a las mujeres a hilar y tejer, de unos 28 años. Mismo estilo de pintura que un retrato de la escuela cusqueña.
Rostro: andino, de piel cobriza; rostro ovalado; pómulos altos; ojos oscuros almendrados, de mirada dulce, sabia y serena; cejas negras finas y arqueadas; nariz recta; labios llenos.
Cabello: negro, largo y lacio, con raya al medio, cayendo sobre los hombros.
Tocado: ñañaca, un paño de tela blanco y rojo doblado en forma plana sobre la cabeza, con una franja de tocapus (cuadros con dibujos geométricos).
Ropa: lliclla (manta) blanca con pequeños dibujos rojos, con un cuello ancho de tocapus de colores rojo, verde y amarillo, cerrada en el pecho con un tupu (alfiler) de oro de cabeza redonda.
Expresión: cálida, serena y maternal, con una sonrisa muy leve. Boca cerrada.
Encuadre: busto de frente, mirando directo a la cámara, cabeza centrada, la parte de arriba de la ñañaca cerca del borde superior dejando un pequeño margen, los hombros llegan al borde inferior. Formato cuadrado 1:1.
Iluminación: luz cálida y dorada en el rostro, más una luz de contorno plateada y suave, como de luna, en el cabello y los hombros para separar la silueta del fondo.
Fondo: negro puro y liso (#000000), sin degradados, sin textura, sin objetos. Sin texto, sin marcos, sin marca de agua.
```

#### Pachacútec (`pachacutec`)

**Referencia (dominio público):** <https://commons.wikimedia.org/wiki/File:Brooklyn_Museum_-_Pachacuti,_Tenth_Inca,_1_of_14_Portraits_of_Inca_Kings_(cropped).jpg>

```
Retrato ilustrado semirrealista, estilo pintura digital cálida y detallada, como de película animada de alta calidad.
Personaje: Pachacútec Inca Yupanqui, el Inca que convirtió el Cusco en la capital del Tahuantinsuyo, a sus 50 años.
Rostro: andino, de piel cobriza curtida; rostro alargado y fuerte; pómulos muy marcados; frente amplia; ojos oscuros, de mirada firme, sabia y poderosa; cejas negras; nariz aguileña grande y prominente; labios firmes.
Cabello: negro, corto a la altura de las orejas.
Tocado: un tocado alto de oro, como una corona dorada con dibujos geométricos, adornado con plumas rojas y verdes.
Joyas: grandes orejeras redondas de oro con forma de espiral; dos borlas rojas cuelgan a los lados del cuello.
Vello facial: lampiño.
Ropa: unku (túnica) con franjas horizontales de tocapus (cuadros con dibujos geométricos) en rojo, blanco, azul y negro, y una manta rojo oscuro con dibujos sobre los hombros.
Expresión: majestuosa, serena y sabia. Boca cerrada.
Encuadre: busto de frente, mirando directo a la cámara, cabeza centrada, la parte de arriba de las plumas cerca del borde superior dejando un pequeño margen, los hombros llegan al borde inferior. Formato cuadrado 1:1.
Iluminación: luz cálida y dorada en el rostro, más una luz de contorno dorada en el tocado, las orejeras y los hombros para separar la silueta del fondo.
Fondo: negro puro y liso (#000000), sin degradados, sin textura, sin objetos. Sin texto, sin marcos, sin marca de agua.
```

#### Atahualpa (`atahualpa`)

**Referencia (dominio público):** es el único de la serie pintado casi de frente, así que sirve muy bien. <https://commons.wikimedia.org/wiki/File:Brooklyn_Museum_-_Atahualpa,_Fourteenth_Inca,_1_of_14_Portraits_of_Inca_Kings_-_overall.jpg>. El cronista Francisco de Xerez, que lo vio en Cajamarca, cuenta que llevaba en la frente una borla de lana color carmesí.

```
Retrato ilustrado semirrealista, estilo pintura digital cálida y detallada, como de película animada de alta calidad.
Personaje: Atahualpa, hijo del Inca Huayna Cápac, el último Inca que gobernó el Tahuantinsuyo, a sus 30 años (Cajamarca, 1532).
Rostro: andino, de piel cobriza; rostro redondeado y lleno; pómulos altos; ojos oscuros grandes, de mirada inteligente, orgullosa y atenta; cejas negras arqueadas; nariz recta; boca pequeña de labios firmes.
Cabello: negro y lacio, largo hasta los hombros.
Tocado: una cinta dorada alrededor de la cabeza, con dos pequeñas serpientes de oro que se cruzan arriba, y sobre la frente una borla corta de lana roja (la mascaipacha).
Joyas: grandes orejeras de oro en forma de espiral.
Vello facial: lampiño.
Ropa: manta fina de color rojizo con flores bordadas en colores, cerrada al cuello con un broche dorado, sobre un unku de franjas de colores.
Expresión: digna y serena, con mirada de rey. Boca cerrada.
Encuadre: busto de frente, mirando directo a la cámara, cabeza centrada, la coronilla cerca del borde superior dejando un pequeño margen, los hombros llegan al borde inferior. Formato cuadrado 1:1.
Iluminación: luz cálida y dorada en el rostro, más una luz de contorno dorada en el cabello, las orejeras y los hombros para separar la silueta del fondo.
Fondo: negro puro y liso (#000000), sin degradados, sin textura, sin objetos. Sin texto, sin marcos, sin marca de agua.
```

#### Señor de Sipán (`sipan`)

**Referencia (CC BY-SA 4.0, se puede subir):** reconstrucción facial forense de Cicero Moraes, un proyecto de la Universidad Inca Garcilaso de la Vega, el Museo Tumbas Reales de Sipán y el Equipo Brasileño de Antropología Forense: <https://commons.wikimedia.org/wiki/File:Señor_de_Sípan_-_Reconstrucción_Facial_Forense.jpg>. Es lo más cercano a su rostro real. Si muestras el retrato en público, menciona al autor (Cicero Moraes) y la licencia.

```
Retrato ilustrado semirrealista, estilo pintura digital cálida y detallada, como de película animada de alta calidad.
Personaje: el Señor de Sipán, gobernante de la cultura Mochica en la costa norte del Perú, hacia el año 250, de unos 45 años.
Rostro: ancho y fuerte, de hombre maduro; piel morena cálida; frente con arrugas suaves de expresión; cejas oscuras algo fruncidas; ojos oscuros, de mirada seria, serena y poderosa; pómulos marcados; nariz ancha y recta; labios rectos y firmes; mentón cuadrado.
Tocado: gorro ajustado de tela de algodón crema con un dibujo escalonado rojo oscuro, y encima un enorme tocado de oro en forma de media luna.
Joyas: grandes orejeras redondas de oro con mosaico de piedra azul verdosa (crisocola) y una pequeña figura de guerrero al centro; un collar de cuentas de plata; un gran collar de cuentas en forma de maní, la mitad de oro y la mitad de plata, sobre el pecho.
Vello facial: lampiño.
Ropa: túnica de algodón crudo con un cuello ancho de cuentas rojas y verdes.
Expresión: majestuosa, tranquila y amable. Boca cerrada.
Encuadre: busto de frente, mirando directo a la cámara, cabeza centrada, la parte de arriba del tocado cerca del borde superior dejando un pequeño margen, los hombros llegan al borde inferior. Formato cuadrado 1:1.
Iluminación: luz cálida en el rostro, más una luz de contorno dorada que haga brillar el oro del tocado, las orejeras y el collar.
Fondo: negro puro y liso (#000000), sin degradados, sin textura, sin objetos. Sin texto, sin marcos, sin marca de agua.
```

> El tocado de media luna es muy alto. Si la cara queda muy pequeña en la imagen, pide *"Igual, pero con el tocado más bajo para que el rostro se vea más grande"*.

### Sabios y científicos

#### Antonio Raimondi (`raimondi`)

**Referencia (dominio público):** fotografía de Courret, hacia 1860. <https://commons.wikimedia.org/wiki/File:Raimondi1.jpg>

```
Retrato ilustrado semirrealista, estilo pintura digital cálida y detallada, como de película animada de alta calidad.
Personaje: Antonio Raimondi, naturalista nacido en Milán que recorrió todo el Perú estudiando sus plantas, animales y minerales, a sus 40 años (hacia 1865).
Rostro: ovalado, de piel clara algo bronceada por los viajes; frente amplia con entradas; ojos oscuros, de mirada curiosa, atenta y bondadosa; cejas oscuras; nariz recta.
Cabello: castaño oscuro, peinado hacia atrás, con entradas a los lados de la frente.
Vello facial (importante): bigote oscuro poblado y una barba corta y recortada solo en el mentón (perilla ancha). Mejillas afeitadas.
Ropa: saco oscuro cruzado con botones, del siglo XIX, camisa blanca de cuello y corbata de lazo oscura.
Expresión: amable y entusiasta, como quien acaba de descubrir una planta nueva. Boca cerrada.
Encuadre: busto de frente, mirando directo a la cámara, cabeza centrada, la coronilla cerca del borde superior dejando un pequeño margen, los hombros llegan al borde inferior. Formato cuadrado 1:1.
Iluminación: luz cálida y suave en el rostro, más una luz de contorno dorada en el cabello y los hombros, para que el saco oscuro se separe del fondo.
Fondo: negro puro y liso (#000000), sin degradados, sin textura, sin objetos. Sin texto, sin marcos, sin marca de agua.
```

#### Daniel Alcides Carrión (`carrion`)

**Referencia (dominio público):** fotografía de Eugenio Courret, hacia 1880. <https://commons.wikimedia.org/wiki/File:Daniel_Alcides_Carríon_García.jpg>

```
Retrato ilustrado semirrealista, estilo pintura digital cálida y detallada, como de película animada de alta calidad.
Personaje: Daniel Alcides Carrión, estudiante de medicina de San Marcos nacido en Cerro de Pasco, héroe de la medicina peruana, a sus 27 años (1885).
Rostro: joven, ovalado y delgado, de piel trigueña; pómulos marcados; ojos oscuros, de mirada seria, tranquila y estudiosa; cejas negras rectas y gruesas; nariz recta; labios finos.
Cabello: negro, abundante y ondulado, peinado con raya al costado y con volumen arriba.
Vello facial: bigote negro poblado con las puntas un poco hacia arriba. Sin barba.
Ropa: saco de tweed oscuro del siglo XIX, camisa blanca de cuello alto y corbata con un dibujo pequeño.
Expresión: tranquila, amable y decidida. Boca cerrada.
Encuadre: busto de frente, mirando directo a la cámara, cabeza centrada, la coronilla cerca del borde superior dejando un pequeño margen, los hombros llegan al borde inferior. Formato cuadrado 1:1.
Iluminación: luz cálida y suave en el rostro, más una luz de contorno fría y sutil en el cabello y los hombros, para que el saco oscuro se separe del fondo.
Fondo: negro puro y liso (#000000), sin degradados, sin textura, sin objetos. Sin texto, sin marcos, sin marca de agua.
```

#### Pedro Paulet (`paulet`)

**Referencia (Commons la marca como dominio público):** <https://commons.wikimedia.org/wiki/File:Pedro_Paulet,_padre_de_la_Aeronautica.PNG>

```
Retrato ilustrado semirrealista, estilo pintura digital cálida y detallada, como de película animada de alta calidad.
Personaje: Pedro Paulet Mostajo, ingeniero e inventor arequipeño, pionero de los motores de cohete, a sus 30 años (hacia 1904).
Rostro: redondeado y lleno, de piel clara; frente amplia; ojos oscuros, de mirada soñadora, curiosa e inteligente; cejas oscuras y pobladas; nariz recta y algo ancha; mentón redondeado.
Cabello: negro, rizado y abundante, peinado hacia atrás y hacia un lado.
Vello facial (importante): bigote negro muy grande y poblado, con las puntas largas y curvadas hacia arriba (estilo manubrio). Sin barba.
Ropa: saco oscuro, chaleco, camisa blanca de cuello alto almidonado y una corbata de lazo negra.
Expresión: entusiasta y soñadora, como quien mira las estrellas. Boca cerrada.
Encuadre: busto de frente, mirando directo a la cámara, cabeza centrada, la coronilla cerca del borde superior dejando un pequeño margen, los hombros llegan al borde inferior. Formato cuadrado 1:1.
Iluminación: luz cálida en el rostro, más una luz de contorno azul clara, como de un cohete encendido, en el cabello y los hombros para separar la silueta del fondo.
Fondo: negro puro y liso (#000000), sin degradados, sin textura, sin objetos. Sin texto, sin marcos, sin marca de agua.
```

#### Julio C. Tello (`tello`)

**Referencia (dominio público):** su retrato de graduación en la Universidad de Harvard, hacia 1910: <https://commons.wikimedia.org/wiki/File:Julio_C._Tello_Harvard.jpg>

```
Retrato ilustrado semirrealista, estilo pintura digital cálida y detallada, como de película animada de alta calidad.
Personaje: Julio César Tello, padre de la arqueología peruana, nacido en Huarochirí (Lima), descubridor de la necrópolis de Paracas, a sus 40 años (1920).
Rostro: ancho y redondeado, de rasgos andinos; piel cobriza; mejillas llenas; frente amplia; ojos oscuros, de mirada tranquila, observadora y paciente; cejas oscuras; nariz ancha; labios finos y serenos.
Cabello: negro, lacio, peinado hacia atrás con raya al costado.
Vello facial: completamente afeitado.
Accesorio (importante): anteojos redondos de marco metálico fino.
Ropa: saco oscuro, camisa blanca de cuello alto y redondeado y corbata con un dibujo de rombos.
Expresión: seria pero amable, con una leve sonrisa de orgullo por su tierra. Boca cerrada.
Encuadre: busto de frente, mirando directo a la cámara, cabeza centrada, la coronilla cerca del borde superior dejando un pequeño margen, los hombros llegan al borde inferior. Formato cuadrado 1:1.
Iluminación: luz cálida en el rostro, más una luz de contorno dorada en el cabello y los hombros, para que el saco oscuro se separe del fondo.
Fondo: negro puro y liso (#000000), sin degradados, sin textura, sin objetos. Sin texto, sin marcos, sin marca de agua.
```

#### María Reiche (`reiche`)

**Referencia:** sus fotos de mayor tienen derechos de autor, así que **no las subas**. Para mirarla sirve la figura de su casa museo en Nasca (CC BY 3.0): <https://commons.wikimedia.org/wiki/File:Maria_Reiche_Nazca.jpg>

```
Retrato ilustrado semirrealista, estilo pintura digital cálida y detallada, como de película animada de alta calidad.
Personaje: María Reiche, matemática nacida en Dresde (Alemania) que dedicó su vida a estudiar y proteger las Líneas de Nasca en el desierto peruano, a sus 75 años (1978).
Rostro: delgado, de piel clara muy bronceada y con arrugas por el sol del desierto; pómulos marcados; ojos claros, de mirada curiosa, decidida y bondadosa; nariz recta y fina; labios finos.
Cabello: gris y blanco, corto y algo ondulado, peinado de forma sencilla.
Accesorio: anteojos de marco delgado.
Ropa: chompa tejida de lana de color naranja, abierta, sobre una blusa blanca de cuello sencillo.
Expresión: amable y entusiasta, con una sonrisa leve. Boca cerrada.
Encuadre: busto de frente, mirando directo a la cámara, cabeza centrada, la coronilla cerca del borde superior dejando un pequeño margen, los hombros llegan al borde inferior. Formato cuadrado 1:1.
Iluminación: luz cálida y dorada en el rostro, como del sol del desierto al atardecer, más una luz de contorno dorada en el cabello y los hombros.
Fondo: negro puro y liso (#000000), sin degradados, sin textura, sin objetos. Sin texto, sin marcos, sin marca de agua.
```

---

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
