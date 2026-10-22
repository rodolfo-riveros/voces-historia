// Retratos ilustrados de cada personaje (SVG), con tres bocas para animar el habla.
// Si existen static/img/<personaje>/cerrada.png, media.png y abierta.png, se usan esas imágenes.

const BOCAS = (y, color = "#5A1E1A") => `
  <g class="boca boca-cerrada"><path d="M89 ${y - 1} Q100 ${y + 5} 111 ${y - 1}" fill="none" stroke="${color}" stroke-width="3.2" stroke-linecap="round"/></g>
  <g class="boca boca-media"><ellipse cx="100" cy="${y + 1}" rx="9" ry="4.5" fill="${color}"/></g>
  <g class="boca boca-abierta"><ellipse cx="100" cy="${y + 2}" rx="10" ry="8" fill="${color}"/><ellipse cx="100" cy="${y + 6}" rx="6" ry="3" fill="#C9575A"/><rect x="93" y="${y - 6}" width="14" height="3" rx="1.5" fill="#FFF"/></g>`;

const OJOS = (iris = "#2A1A14") => `
  <g class="ojos">
    <ellipse cx="85" cy="92" rx="4.6" ry="5.2" fill="${iris}"/><circle cx="86.6" cy="90.2" r="1.5" fill="#fff"/>
    <ellipse cx="115" cy="92" rx="4.6" ry="5.2" fill="${iris}"/><circle cx="116.6" cy="90.2" r="1.5" fill="#fff"/>
  </g>`;

const RETRATOS = {
  garcilaso: () => `
  <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M14 200 C20 166 56 150 100 150 C144 150 180 166 186 200 Z" fill="#1E1A24"/>
    <path d="M100 152 L100 200" stroke="#3A3344" stroke-width="2"/>
    
    <rect x="87" y="122" width="26" height="30" rx="8" fill="#C48A63"/>
    <path d="M84 126 L116 126 L119 154 L81 154 Z" fill="#15121B"/>
    <path d="M85 127 Q100 132 115 127" fill="none" stroke="#F4EFE4" stroke-width="3" stroke-linecap="round"/>
    <path d="M56 166 Q100 200 144 166" fill="none" stroke="#E2B23A" stroke-width="3.5" stroke-dasharray="4 2"/>
    <circle cx="100" cy="185" r="7" fill="#E2B23A"/><circle cx="100" cy="185" r="3.5" fill="#B8862A"/>
    <ellipse cx="64" cy="96" rx="6.5" ry="10" fill="#C48A63"/><ellipse cx="136" cy="96" rx="6.5" ry="10" fill="#C48A63"/>
    <ellipse cx="100" cy="92" rx="36" ry="44" fill="#D9A27A"/>
    <path d="M63 90 C58 52 80 40 100 40 C122 40 142 52 137 90 C134 70 122 58 100 58 C80 58 68 68 63 90 Z" fill="#1A1412"/>
    <path d="M76 58 C86 50 112 48 126 58" fill="none" stroke="#2E2420" stroke-width="3" stroke-linecap="round"/>
    <path d="M76 82 Q85 77 93 81" fill="none" stroke="#1A1412" stroke-width="3.4" stroke-linecap="round"/>
    <path d="M107 81 Q115 77 124 82" fill="none" stroke="#1A1412" stroke-width="3.4" stroke-linecap="round"/>
    ${OJOS()}
    <path d="M100 96 Q95 108 98 111 Q101 113 105 110" fill="none" stroke="#A8704C" stroke-width="2.6" stroke-linecap="round"/>
    <circle cx="77" cy="108" r="6" fill="#E88E7A" opacity=".35"/><circle cx="123" cy="108" r="6" fill="#E88E7A" opacity=".35"/>
    ${BOCAS(124)}
    <path d="M100 117 C93 113 85 114 80 120 C87 118 94 119.5 100 119 C106 119.5 113 118 120 120 C115 114 107 113 100 117 Z" fill="#1A1412"/>
    <path d="M96 131 Q100 141 104 131 Q100 133 96 131 Z" fill="#1A1412"/>
  </svg>`,

  arguedas: () => `
  <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M14 200 C20 166 56 150 100 150 C144 150 180 166 186 200 Z" fill="#7B766C"/>
    <path d="M82 150 L100 186 L118 150 Z" fill="#2F3542"/>
    <path d="M82 150 L100 186 L86 200 L64 200 L70 160 Z" fill="#68635A"/>
    <path d="M118 150 L100 186 L114 200 L136 200 L130 160 Z" fill="#68635A"/>
    <rect x="87" y="122" width="26" height="30" rx="8" fill="#D29E78"/>
    <ellipse cx="65" cy="96" rx="6.5" ry="10" fill="#D29E78"/><ellipse cx="135" cy="96" rx="6.5" ry="10" fill="#D29E78"/>
    <ellipse cx="100" cy="93" rx="35" ry="45" fill="#E2B08A"/>
    <path d="M64 86 C56 50 78 32 104 34 C130 36 144 54 136 86 C134 66 124 56 104 55 C86 54 72 62 64 86 Z" fill="#2E2119"/>
    <path d="M70 58 C78 38 120 30 134 52 C120 44 92 42 70 58 Z" fill="#3B2A20"/>
    <path d="M75 80 Q85 74 94 79" fill="none" stroke="#2E2119" stroke-width="4.2" stroke-linecap="round"/>
    <path d="M106 79 Q115 74 125 80" fill="none" stroke="#2E2119" stroke-width="4.2" stroke-linecap="round"/>
    ${OJOS("#3A2A1E")}
    <path d="M79 86 Q85 84 91 86" fill="none" stroke="#B98463" stroke-width="1.6" stroke-linecap="round"/>
    <path d="M109 86 Q115 84 121 86" fill="none" stroke="#B98463" stroke-width="1.6" stroke-linecap="round"/>
    <path d="M100 96 Q94 109 97 112 Q101 114 106 111" fill="none" stroke="#B98463" stroke-width="2.6" stroke-linecap="round"/>
    <circle cx="77" cy="108" r="6" fill="#E08A70" opacity=".35"/><circle cx="123" cy="108" r="6" fill="#E08A70" opacity=".35"/>
    ${BOCAS(124)}
    <path d="M100 115 C92 111 83 113 79 120 C87 117.5 94 119.5 100 118.5 C106 119.5 113 117.5 121 120 C117 113 108 111 100 115 Z" fill="#2E2119"/>
  </svg>`,

  grau: () => `
  <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M14 200 C20 166 56 150 100 150 C144 150 180 166 186 200 Z" fill="#1B2A4A"/>
    <ellipse cx="40" cy="168" rx="24" ry="9" fill="#E2B23A" transform="rotate(-18 40 168)"/>
    <ellipse cx="160" cy="168" rx="24" ry="9" fill="#E2B23A" transform="rotate(18 160 168)"/>
    <path d="M22 174 l-2 10 M28 176 l-2 10 M34 177 l-1 10 M178 174 l2 10 M172 176 l2 10 M166 177 l1 10" stroke="#C4932A" stroke-width="2.4" stroke-linecap="round"/>
    <circle cx="88" cy="172" r="3" fill="#E2B23A"/><circle cx="112" cy="172" r="3" fill="#E2B23A"/>
    <circle cx="88" cy="186" r="3" fill="#E2B23A"/><circle cx="112" cy="186" r="3" fill="#E2B23A"/>
    <rect x="87" y="122" width="26" height="30" rx="8" fill="#D9A47E"/>
    <path d="M82 146 L118 146 L117 158 L83 158 Z" fill="#F4F1EA"/>
    <path d="M86 150 L100 155 L86 160 Z M114 150 L100 155 L114 160 Z" fill="#111"/><circle cx="100" cy="155" r="2.6" fill="#111"/>
    <ellipse cx="64" cy="96" rx="6.5" ry="10" fill="#D9A47E"/><ellipse cx="136" cy="96" rx="6.5" ry="10" fill="#D9A47E"/>
    <ellipse cx="100" cy="92" rx="36" ry="44" fill="#EBBD98"/>
    <path d="M64 92 C60 62 70 50 78 48 C74 60 70 72 70 92 Z" fill="#3A2A20"/>
    <path d="M136 92 C140 62 130 50 122 48 C126 60 130 72 130 92 Z" fill="#3A2A20"/>
    <path d="M78 50 C88 44 112 44 122 50 C112 47 88 47 78 50 Z" fill="#3A2A20"/>
    <path d="M63 86 C57 112 64 132 82 135 C88 130 89 124 88 119 C80 117 72 108 70 90 Z" fill="#3A2A20"/>
    <path d="M137 86 C143 112 136 132 118 135 C112 130 111 124 112 119 C120 117 128 108 130 90 Z" fill="#3A2A20"/>
    <path d="M76 80 Q85 76 93 80" fill="none" stroke="#3A2A20" stroke-width="3.6" stroke-linecap="round"/>
    <path d="M107 80 Q115 76 124 80" fill="none" stroke="#3A2A20" stroke-width="3.6" stroke-linecap="round"/>
    ${OJOS("#2A2018")}
    <path d="M100 96 Q95 108 98 111 Q101 113 105 110" fill="none" stroke="#B98462" stroke-width="2.6" stroke-linecap="round"/>
    <circle cx="78" cy="106" r="6" fill="#E88E7A" opacity=".3"/><circle cx="122" cy="106" r="6" fill="#E88E7A" opacity=".3"/>
    ${BOCAS(125)}
    <path d="M100 116 C92 112 82 114 76 122 C84 119 93 121 100 120 C107 121 116 119 124 122 C118 114 108 112 100 116 Z" fill="#3A2A20"/>
  </svg>`,
};

// Silueta genérica para personajes nuevos que aún no tienen retrato.
const SILUETA = () => `
  <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <circle cx="100" cy="80" r="38" fill="currentColor"/>
    <path d="M24 206 C30 158 62 132 100 132 C138 132 170 158 176 206 Z" fill="currentColor"/>
  </svg>`;

// Personajes que tienen retratos PNG propios (lo informa el servidor en /api/personajes).
const conImagenes = new Set();
const extImagen = {}; // formato de los retratos de cada personaje (jpg, png o webp)
const encuadre = {};  // zoom y foco para los círculos (bloque "retrato" del config.json)
const conParpadeo = new Set();

/** Rellena un elemento .avatar con el retrato del personaje. */
function pintarAvatar(el, id) {
  el.dataset.personaje = id;
  el.dataset.boca = "cerrada";
  el.classList.remove("con-imagenes", "parpadea");
  el.innerHTML = (RETRATOS[id] || SILUETA)();
  if (conImagenes.has(id)) {
    el.classList.add("con-imagenes");
    if (encuadre[id]) {
      el.style.setProperty("--zoom", encuadre[id].zoom || 1.2);
      el.style.setProperty("--foco", `${(encuadre[id].foco_y || 0.45) * 100}%`);
    }
    const cuadros = ["cerrada", "media", "abierta"].map(
      (b) => `<img class="boca boca-${b}" src="/img/${id}/${b}.${extImagen[id] || "png"}" alt="" draggable="false">`
    );
    if (conParpadeo.has(id)) cuadros.push(`<img class="img-parpadeo" src="/img/${id}/parpadeo.${extImagen[id] || "png"}" alt="" draggable="false">`);
    el.innerHTML = cuadros.join("");
  }
}

// Parpadeo de los retratos PNG: cada 3 a 6 segundos cierra los ojos 150 ms.
(function parpadear() {
  setTimeout(() => {
    const ojos = document.querySelectorAll(".avatar.con-imagenes");
    ojos.forEach((a) => a.classList.add("parpadea"));
    setTimeout(() => ojos.forEach((a) => a.classList.remove("parpadea")), 150);
    parpadear();
  }, 3000 + Math.random() * 3000);
})();

window.Avatares = { pintarAvatar, conImagenes, conParpadeo, extImagen, encuadre };
