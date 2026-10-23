// Retratos de los personajes: se arman con las imágenes de static/img/<personaje>/.
//  - Completo: cerrada + media + abierta (+ parpadeo opcional) → la boca se mueve al hablar.
//  - Simple: solo cerrada → la imagen "late" suavemente al hablar.
//  - Sin imágenes: una silueta con el color del personaje, hasta que subas las tuyas.

const SILUETA = () => `
  <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <circle cx="100" cy="80" r="38" fill="currentColor"/>
    <path d="M24 206 C30 158 62 132 100 132 C138 132 170 158 176 206 Z" fill="currentColor"/>
  </svg>`;

// Lo informa el servidor en /api/personajes (según los archivos que encuentra).
const conImagenes = new Set();  // tienen las 3 bocas
const conImagenSimple = new Set(); // solo tienen cerrada
const extImagen = {};           // formato de los retratos (jpg, png o webp)
const encuadre = {};            // zoom y foco para los círculos (bloque "retrato" del config.json)
const conParpadeo = new Set();

/** Rellena un elemento .avatar con el retrato del personaje. */
function pintarAvatar(el, id) {
  el.dataset.personaje = id;
  el.dataset.boca = "cerrada";
  el.classList.remove("con-imagenes", "imagen-simple", "parpadea");
  const ext = extImagen[id] || "jpg";
  const completo = conImagenes.has(id);
  if (!completo && !conImagenSimple.has(id)) {
    el.innerHTML = SILUETA();
    return;
  }
  el.classList.add("con-imagenes");
  if (!completo) el.classList.add("imagen-simple");
  if (encuadre[id]) {
    el.style.setProperty("--zoom", encuadre[id].zoom || 1.2);
    el.style.setProperty("--foco", `${(encuadre[id].foco_y || 0.45) * 100}%`);
  }
  const bocas = completo ? ["cerrada", "media", "abierta"] : ["cerrada"];
  const cuadros = bocas.map(
    (b) => `<img class="boca boca-${b}" src="/img/${id}/${b}.${ext}" alt="" draggable="false">`
  );
  if (completo && conParpadeo.has(id)) {
    cuadros.push(`<img class="img-parpadeo" src="/img/${id}/parpadeo.${ext}" alt="" draggable="false">`);
  }
  el.innerHTML = cuadros.join("");
}

// Parpadeo de los retratos: cada 3 a 6 segundos cierra los ojos 150 ms.
(function parpadear() {
  setTimeout(() => {
    const ojos = document.querySelectorAll(".avatar.con-imagenes");
    ojos.forEach((a) => a.classList.add("parpadea"));
    setTimeout(() => ojos.forEach((a) => a.classList.remove("parpadea")), 150);
    parpadear();
  }, 3000 + Math.random() * 3000);
})();

window.Avatares = { pintarAvatar, conImagenes, conImagenSimple, conParpadeo, extImagen, encuadre };
