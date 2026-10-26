// Voces de la Historia — lógica del frontend (JavaScript puro, sin frameworks).
"use strict";

const $ = (s) => document.querySelector(s);
const params = new URLSearchParams(location.search);
const ABRIR_HOLO = params.get("holograma") === "1";
const HISTORIAL_MAX = 6;

const estado = {
  personajes: [],
  actual: null,          // personaje elegido
  historial: [],         // solo en memoria; nunca se guarda
  fase: "listo",         // listo | escuchando | pensando | hablando
  demo: localStorage.getItem("voces-demo") === "1",
  ultimoTexto: "",
  reconocedor: null,
  pedido: null,          // AbortController del pedido a la IA en curso
  lecturaActiva: null,   // {cancelada: bool}
  sesion: 0,             // sube al cambiar de pantalla para cancelar tareas viejas
  holo: false,           // true mientras se usa el modo holograma
  servidorDemo: false,   // el servidor no tiene clave de IA
  categorias: [],        // categorías con personajes (escritores, héroes…)
};

// ---------- Iconos ----------
const ICONOS = {
  mic: '<svg viewBox="0 0 24 24" width="62" height="62" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0"/><path d="M12 18v3"/></svg>',
  libro: '<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 5h7a3 3 0 0 1 3 3v12a2 2 0 0 0-2-2H2z"/><path d="M22 5h-7a3 3 0 0 0-3 3v12a2 2 0 0 1 2-2h8z"/></svg>',
  ancla: '<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="5" r="2.5"/><path d="M12 7.5V21"/><path d="M5 13a7 7 0 0 0 14 0"/><path d="M8 11h8"/></svg>',
  teclado: '<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="6" width="20" height="12" rx="3"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10"/></svg>',
  otraVez: '<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/></svg>',
  parar: '<svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="3"/></svg>',
  play: '<svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" aria-hidden="true"><path d="M8 5l11 7-11 7z"/></svg>',
  pausa: '<svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1.5"/><rect x="14" y="5" width="4" height="14" rx="1.5"/></svg>',
  oreja: '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 8.5a6 6 0 1 1 12 0c0 3-2 4.5-3.5 5.5S12 16 12 18a3 3 0 0 1-6 0"/><path d="M9.5 8.5a2.5 2.5 0 0 1 5 0"/></svg>',
  idea: '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3z"/></svg>',
  pregunta: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.7v.5M12 17h.01"/></svg>',
};

// ---------- Utilidades ----------
function aviso(texto, ms = 3500) {
  const el = $("#aviso");
  el.textContent = texto;
  el.hidden = false;
  clearTimeout(aviso._t);
  aviso._t = setTimeout(() => (el.hidden = true), ms);
}

/** Saludo al azar, sin repetir el último que dijo ese personaje. */
const ultimoSaludo = {};
function elegirSaludo(p) {
  const lista = p.saludos && p.saludos.length ? p.saludos : [p.saludo];
  let i = Math.floor(Math.random() * lista.length);
  if (lista.length > 1 && i === ultimoSaludo[p.id]) i = (i + 1) % lista.length;
  ultimoSaludo[p.id] = i;
  // Queda en la memoria de la conversación para que la IA sepa que ya saludó.
  estado.historial = [{ rol: "personaje", texto: lista[i] }];
  return lista[i];
}

function normalizar(t) {
  return t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

async function api(ruta, datos) {
  const opciones = datos
    ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(datos) }
    : {};
  const r = await fetch(ruta, opciones);
  return r;
}

function mostrar(nombre) {
  estado.sesion++;
  detenerTodo();
  document.querySelectorAll(".pantalla").forEach((p) => p.classList.remove("activa"));
  $(`#pantalla-${nombre}`).classList.add("activa");
  document.body.dataset.pantalla = nombre;
  document.body.classList.toggle("holo", nombre === "holo");
  if (nombre === "inicio" || nombre === "elegir") Ambiente.detener();
  window.scrollTo(0, 0);
}

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

function aplicarColores(p) {
  const c = p.colores;
  const raiz = document.documentElement.style;
  raiz.setProperty("--fondo", c.fondo);
  raiz.setProperty("--principal", c.principal);
  raiz.setProperty("--oscuro", c.oscuro);
  raiz.setProperty("--sombra", c.sombra);
  raiz.setProperty("--suave", c.suave || "#fff");
  document.querySelector('meta[name="theme-color"]').content = c.fondo;
}

// ---------- Audio: reproducción + boca animada ----------
const SILENCIO = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";
const audio = new Audio();
audio.preload = "auto";
let ctxAudio = null, analizador = null, datosOnda = null;
let audioListo = false;

function prepararAudio() {
  // iOS y Chrome solo dejan sonar audio después de un toque: lo "desbloqueamos" aquí.
  if (!ctxAudio) {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      ctxAudio = new Ctx();
      const fuente = ctxAudio.createMediaElementSource(audio);
      analizador = ctxAudio.createAnalyser();
      analizador.fftSize = 512;
      datosOnda = new Uint8Array(analizador.fftSize);
      fuente.connect(analizador);
      analizador.connect(ctxAudio.destination);
      Ambiente.usarContexto(ctxAudio);
      Oido.configurar({ contexto: ctxAudio });
    } catch (e) {
      analizador = null;
    }
  }
  if (ctxAudio && ctxAudio.state === "suspended") ctxAudio.resume();
  if (!audioListo) {
    audioListo = true;
    audio.src = SILENCIO;
    audio.play().catch(() => {});
    if ("speechSynthesis" in window) {
      const u = new SpeechSynthesisUtterance(" ");
      u.volume = 0;
      speechSynthesis.speak(u);
    }
  }
}

function avataresActivos() {
  return document.querySelectorAll(".pantalla.activa .avatar[data-personaje]");
}
function ponerBoca(b) {
  avataresActivos().forEach((a) => {
    if (a.dataset.boca !== b) a.dataset.boca = b;
  });
}

// Se mide el volumen cada 60 ms: suficiente para la boca y gasta poca batería.
let bucleBoca = 0;
function animarBoca(modo) {
  clearInterval(bucleBoca);
  let actual = "cerrada", cambio = 0, nivelSuave = 0;
  // Con retratos realistas la boca muy abierta se reserva para las sílabas fuertes.
  const realista = !!document.querySelector(".pantalla.activa .avatar.con-imagenes");
  const [umbralMedia, umbralAbierta] = realista ? [0.02, 0.12] : [0.025, 0.075];
  const paso = () => {
    const t = performance.now();
    let nivel;
    if (modo === "analizador" && analizador) {
      analizador.getByteTimeDomainData(datosOnda);
      let suma = 0;
      for (let i = 0; i < datosOnda.length; i++) {
        const v = (datosOnda[i] - 128) / 128;
        suma += v * v;
      }
      nivel = Math.sqrt(suma / datosOnda.length);
    } else {
      // Sin datos del audio (voz del navegador): movimiento simulado y natural.
      nivel = 0.06 + 0.06 * Math.sin(t / 90) * Math.sin(t / 37) + Math.random() * 0.03;
    }
    nivelSuave = nivelSuave * 0.35 + nivel * 0.65;
    const nueva = nivelSuave < umbralMedia ? "cerrada" : nivelSuave < umbralAbierta ? "media" : "abierta";
    if (nueva !== actual && t - cambio > 70) {
      actual = nueva;
      cambio = t;
      ponerBoca(actual);
    }
  };
  bucleBoca = setInterval(paso, 60);
}
function pararBoca() {
  clearInterval(bucleBoca);
  ponerBoca("cerrada");
}

let finActual = null; // resuelve la reproducción en curso
function detenerAudio() {
  audio.pause();
  if ("speechSynthesis" in window) speechSynthesis.cancel();
  pararBoca();
  if (finActual) finActual();
  finActual = null;
  // Corta también la descarga de una voz que estaba llegando por partes
  // (cambiar el src la cancela; un src vacío provocaría un error tardío).
  if (audio.src.includes("/api/voz")) audio.src = SILENCIO;
}

/** Pide el audio al servidor (edge-tts). Devuelve un Blob o null si falla. */
async function pedirAudio(texto, pid = estado.actual.id) {
  try {
    const r = await api("/api/tts", { personaje: pid, texto });
    if (!r.ok) return null;
    return await r.blob();
  } catch {
    return null;
  }
}

/** Reproduce un Blob mp3 animando la boca. onProgreso recibe 0..1. */
function reproducirBlob(blob, onProgreso) {
  return new Promise((resolver) => {
    const url = URL.createObjectURL(blob);
    let terminado = false;
    const fin = () => {
      if (terminado) return;
      terminado = true;
      audio.onended = audio.onerror = audio.ontimeupdate = null;
      URL.revokeObjectURL(url);
      pararBoca();
      onProgreso && onProgreso(1);
      resolver();
    };
    finActual = fin;
    audio.src = url;
    audio.onended = fin;
    audio.onerror = fin;
    audio.ontimeupdate = () => {
      if (onProgreso && audio.duration) onProgreso(audio.currentTime / audio.duration);
    };
    if (ctxAudio && ctxAudio.state === "suspended") ctxAudio.resume();
    audio.play().then(() => animarBoca("analizador")).catch(fin);
  });
}

/**
 * Reproduce la voz a medida que llega del servidor (empieza en ~1 s, sin esperar el mp3 entero).
 * Devuelve true si sonó, o false si falló antes de empezar (entonces se usa la voz del navegador).
 */
function reproducirEnVivo(texto, onProgreso, onInicio) {
  return new Promise((resolver) => {
    const url = `/api/voz?personaje=${encodeURIComponent(estado.actual.id)}&texto=${encodeURIComponent(texto)}`;
    // Mientras llega por partes el navegador no sabe cuánto dura: se estima por el largo del texto.
    const estimado = Math.max(2, texto.length * 0.072);
    let empezo = false, terminado = false;
    const fin = () => {
      if (terminado) return;
      terminado = true;
      audio.onended = audio.onerror = audio.ontimeupdate = audio.onplaying = null;
      pararBoca();
      if (empezo) onProgreso && onProgreso(1);
      resolver(empezo);
    };
    finActual = fin;
    audio.src = url;
    audio.onplaying = () => {
      if (empezo || !audio.src.endsWith(url)) return;
      empezo = true;
      onInicio && onInicio();
      animarBoca("analizador");
    };
    // Solo cuentan los eventos de ESTE audio (no los de uno anterior que se canceló).
    const esEste = () => audio.src.endsWith(url);
    audio.onended = () => esEste() && fin();
    audio.onerror = () => esEste() && fin();
    audio.ontimeupdate = () => {
      if (!onProgreso || !empezo || !esEste()) return;
      const total = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : estimado;
      onProgreso(Math.min(0.98, audio.currentTime / total));
    };
    if (ctxAudio && ctxAudio.state === "suspended") ctxAudio.resume();
    audio.play().catch(fin);
  });
}

/** Respaldo: voz del navegador. */
function hablarNavegador(texto, onProgreso) {
  return new Promise((resolver) => {
    if (!("speechSynthesis" in window)) return resolver();
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(texto);
    u.lang = "es-PE";
    const voces = speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith("es"));
    u.voice = voces.find((v) => /PE|419|US|MX/i.test(v.lang)) || voces[0] || null;
    u.rate = 0.95;
    let terminado = false;
    const fin = () => {
      if (terminado) return;
      terminado = true;
      pararBoca();
      onProgreso && onProgreso(1);
      resolver();
    };
    finActual = fin;
    u.onboundary = (e) => onProgreso && onProgreso(e.charIndex / texto.length);
    u.onend = fin;
    u.onerror = fin;
    speechSynthesis.speak(u);
    animarBoca("simulado");
    // Algunos navegadores no avisan el final: plan de seguridad.
    setTimeout(fin, 1500 + texto.length * 90);
  });
}

async function decir(texto, onProgreso, blobPrevio) {
  const blob = blobPrevio || (await pedirAudio(texto));
  Ambiente.voz(true);
  try {
    if (blob) return await reproducirBlob(blob, onProgreso);
    return await hablarNavegador(texto, onProgreso);
  } finally {
    Ambiente.voz(false);
  }
}

// ---------- Subtítulos con avance de palabras ----------
function pintarSubtitulo(el, texto) {
  el.innerHTML = "";
  const palabras = texto.split(/(\s+)/);
  palabras.forEach((p) => {
    const s = document.createElement("span");
    s.textContent = p;
    el.appendChild(s);
  });
  return (progreso) => {
    const total = texto.length;
    let acumulado = 0, ultimaDicha = null;
    for (const s of el.children) {
      acumulado += s.textContent.length;
      const dicha = acumulado / total <= progreso + 0.02;
      s.className = dicha ? "" : "por-decir";
      if (dicha) ultimaDicha = s;
    }
    // Si el texto no cabe, se desplaza solo para seguir a la voz.
    if (ultimaDicha && el.scrollHeight > el.clientHeight) {
      const objetivo = ultimaDicha.offsetTop - el.clientHeight * 0.4;
      if (Math.abs(el.scrollTop - objetivo) > 12) el.scrollTo({ top: Math.max(0, objetivo), behavior: "smooth" });
    }
  };
}

// ---------- Fases de la conversación ----------
function fase(f) {
  estado.fase = f;
  const pantalla = estado.holo ? $("#pantalla-holo") : $("#pantalla-charla");
  pantalla.dataset.fase = f;
  if (estado.holo) return;
  const p = estado.actual;
  const mic = $("#btn-mic");
  const texto = $("#mic-texto");
  const izq = $("#btn-izquierda");
  const der = $("#btn-derecha");
  const pastilla = $("#pastilla-estado");
  mic.disabled = false;

  if (f === "listo") {
    mic.innerHTML = ICONOS.mic;
    mic.setAttribute("aria-label", "Tocar y hablar");
    texto.textContent = "¡Toca y habla!";
    botonLateral(izq, p.tiene_lecturas ? ICONOS.libro : p.id === "grau" ? ICONOS.ancla : ICONOS.libro, p.boton_obras, abrirObras);
    botonLateral(der, ICONOS.teclado, "Escribir", alternarTeclado);
  } else if (f === "escuchando") {
    mic.innerHTML = '<span class="barra-voz"></span><span class="barra-voz"></span><span class="barra-voz"></span><span class="barra-voz"></span>';
    mic.setAttribute("aria-label", "Ya terminé de hablar");
    texto.textContent = "Toca cuando termines";
    pastilla.innerHTML = ICONOS.oreja + " Te estoy escuchando…";
    izq.disabled = der.disabled = true;
  } else if (f === "pensando") {
    mic.innerHTML = ICONOS.mic.replace('width="62" height="62"', 'width="48" height="48"');
    mic.setAttribute("aria-label", "Preguntar otra cosa");
    texto.textContent = "Pensando… (toca para cambiar)";
    pastilla.innerHTML = ICONOS.idea + " Pensando…";
    izq.disabled = der.disabled = true;
  } else if (f === "hablando") {
    mic.innerHTML = ICONOS.parar;
    mic.setAttribute("aria-label", "Parar y preguntar otra cosa");
    texto.textContent = "Toca para preguntar";
    $("#quien-habla").textContent = `${p.nombre_corto.split(" ").slice(-1)[0]} está hablando`;
    botonLateral(izq, ICONOS.otraVez, "Otra vez", repetir);
    botonLateral(der, p.tiene_lecturas ? ICONOS.libro : p.id === "grau" ? ICONOS.ancla : ICONOS.libro, p.boton_obras, abrirObras);
  }
}

function botonLateral(btn, icono, etiqueta, accion) {
  btn.disabled = false;
  btn.innerHTML = `<span class="icono">${icono}</span>${etiqueta}`;
  btn.onclick = accion;
}

// ---------- Pantalla 2: elegir ----------
/** Orden "surtido" para la vista Todos: se alternan las categorías (escritor, héroe, inca,
 *  sabio, santo, y otra vez), empezando por el personaje de portada de cada una.
 *  Dentro de cada categoría se respeta el "orden" de los config.json. */
function ordenSurtido() {
  const grupos = estado.categorias.map((c) => {
    const lista = estado.personajes.filter((p) => p.categoria === c.id);
    const i = lista.findIndex((p) => p.id === c.portada);
    if (i > 0) lista.unshift(...lista.splice(i, 1));
    return lista;
  });
  const sinCategoria = estado.personajes.filter((p) => !estado.categorias.some((c) => c.id === p.categoria));
  const surtido = [];
  for (let i = 0; grupos.some((g) => i < g.length); i++) {
    grupos.forEach((g) => g[i] && surtido.push(g[i]));
  }
  return [...surtido, ...sinCategoria];
}

function pintarTarjetas() {
  const lista = $("#lista-personajes");
  lista.innerHTML = "";
  ordenSurtido().forEach((p) => {
    const b = document.createElement("button");
    b.className = "tarjeta";
    b.style.setProperty("--c-principal", p.colores.principal);
    b.style.setProperty("--c-oscuro", p.colores.oscuro);
    b.style.setProperty("--c-fondo", p.colores.fondo);
    b.style.setProperty("--c-texto", p.colores.texto_tarjeta || "#fff");
    b.innerHTML = `
      <div class="tarjeta-foto"><div class="avatar"></div></div>
      <div class="tarjeta-info">
        <div class="tarjeta-rol"></div>
        <div class="tarjeta-nombre"></div>
        <div class="tarjeta-lema"></div>
        <div class="tarjeta-epoca"></div>
        ${p.tiene_lecturas ? `<div class="tarjeta-extra">${ICONOS.libro.replace(/width="30" height="30"/, 'width="15" height="15"')} Te lee sus libros</div>` : ""}
      </div>`;
    b.querySelector(".tarjeta-nombre").textContent = p.nombre_corto;
    b.querySelector(".tarjeta-lema").textContent = p.lema;
    b.querySelector(".tarjeta-epoca").textContent = [p.periodo, p.epoca].filter(Boolean).join(" · ");
    b.querySelector(".tarjeta-rol").textContent = p.rol || "";
    b.dataset.categoria = p.categoria || "";
    b.setAttribute("aria-label", `Hablar con ${p.nombre}`);
    Avatares.pintarAvatar(b.querySelector(".avatar"), p.id);
    b.onclick = () => {
      prepararAudio();
      b.classList.add("elegida");
      setTimeout(() => entrarCharla(p), 180);
    };
    lista.appendChild(b);
  });
}

/** Filtros por categoría (solo si hay personajes de 2 o más categorías). */
function pintarFiltros() {
  const caja = $("#filtros");
  caja.innerHTML = "";
  caja.hidden = estado.categorias.length < 2;
  if (caja.hidden) return;
  const opciones = [{ id: "", nombre: "Todos", cantidad: estado.personajes.length }, ...estado.categorias];
  opciones.forEach((c) => {
    const b = document.createElement("button");
    b.className = "filtro";
    b.setAttribute("role", "tab");
    b.innerHTML = `<span></span> <small>${c.cantidad}</small>`;
    b.querySelector("span").textContent = c.nombre;
    if (c.descripcion) b.title = c.descripcion;
    b.onclick = () => filtrar(c.id);
    b.dataset.id = c.id;
    caja.appendChild(b);
  });
  filtrar("");
}

function filtrar(id) {
  document.querySelectorAll("#filtros .filtro").forEach((b) => {
    const activo = b.dataset.id === id;
    b.classList.toggle("activo", activo);
    b.setAttribute("aria-selected", activo);
  });
  document.querySelectorAll("#lista-personajes .tarjeta").forEach((t) => {
    t.hidden = Boolean(id) && t.dataset.categoria !== id;
  });
}

function elegirPorVoz() {
  prepararAudio();
  if (!Oido.soportado()) return aviso("Este navegador no puede escucharte. Toca a un personaje.");
  const boton = $("#btn-elegir-voz");
  if (estado.reconocedor) return estado.reconocedor.detener();
  boton.classList.add("escuchando");
  $("#texto-elegir-voz").innerHTML = "Te escucho…<br><span>Di el nombre del personaje</span>";
  const restaurar = () => {
    estado.reconocedor = null;
    boton.classList.remove("escuchando");
    $("#texto-elegir-voz").innerHTML = "…o dime su nombre<br><span>“Quiero hablar con Grau”</span>";
  };
  estado.reconocedor = Oido.escuchar({
    lang: "es-PE",
    onEntendiendo: () => ($("#texto-elegir-voz").innerHTML = "Entendiendo…<br><span>Un segundito</span>"),
    onFin: (texto, error) => {
      restaurar();
      if (error === "permiso") return aviso("Necesito permiso para usar el micrófono.");
      if (!texto) return aviso("No te escuché bien. Prueba otra vez o toca un personaje.");
      const dicho = normalizar(texto);
      const p = estado.personajes.find((x) => (x.nombres_voz || []).some((n) => dicho.includes(normalizar(n))));
      if (p) entrarCharla(p);
      else aviso(`Escuché “${texto}”. Prueba otra vez o toca un personaje.`);
    },
  });
}

// ---------- Pantalla 3-6: conversación ----------
async function entrarCharla(p) {
  estado.actual = p;
  estado.historial = [];
  aplicarColores(p);
  mostrar("charla");
  $("#charla-nombre").textContent = p.nombre_corto;
  $("#charla-epoca").textContent = p.epoca;
  await Avatares.pintarAvatar($("#avatar-principal"), p.id);
  const saludo = elegirSaludo(p);
  $("#subtitulo").textContent = saludo;
  $("#form-teclado").hidden = true;
  const lista = $("#sugerencias-lista");
  lista.innerHTML = "";
  (p.sugerencias || []).forEach((s) => {
    const c = document.createElement("button");
    c.className = "chip";
    c.textContent = s;
    c.onclick = () => enviar(s);
    lista.appendChild(c);
  });
  fase("listo");
  const sesion = estado.sesion;
  const cortina = Ambiente.iniciar(p.id);
  if (cortina) await esperar(cortina * 700);
  // El personaje saluda al llegar.
  responderConVoz(saludo, sesion);
}

/** Corta todo lo que esté en curso (pedido a la IA, voz, micrófono) para empezar algo nuevo. */
function cancelarTurno() {
  estado.sesion++;
  detenerTodo();
}

/** El personaje dice un texto: subtítulos que avanzan con la voz y boca animada. */
async function responderConVoz(texto, sesion) {
  if (sesion !== estado.sesion) return;
  estado.ultimoTexto = texto;
  const sub = estado.holo ? null : $("#subtitulo");
  const avanzar = sub ? pintarSubtitulo(sub, texto) : null;
  const empezar = () => {
    if (sesion !== estado.sesion) return;
    fase("hablando");
    avanzar && avanzar(0);
  };
  Ambiente.voz(true);
  try {
    // La voz llega por partes y suena apenas llega el primer trozo.
    const sono = await reproducirEnVivo(texto, avanzar, empezar);
    if (sesion !== estado.sesion) return;
    // Sin voz del servidor (sin internet o edge-tts caído): voz del navegador.
    if (!sono) {
      empezar();
      await hablarNavegador(texto, avanzar);
    }
  } finally {
    Ambiente.voz(false);
  }
  if (sesion !== estado.sesion) return;
  if (estado.fase === "hablando") fase("listo");
  // Holograma en conversación continua: vuelve a escuchar solo.
  if (estado.holo && holoConfig.continuo && estado.fase === "listo" && !panelHoloAbierto()) {
    setTimeout(() => {
      if (sesion === estado.sesion && estado.fase === "listo" && !panelHoloAbierto()) escuchar();
    }, 500);
  }
}

async function enviar(pregunta) {
  pregunta = (pregunta || "").trim();
  if (!pregunta) return;
  // Una pregunta nueva siempre gana: se cancela la anterior aunque siga pensando o hablando.
  cancelarTurno();
  const sesion = estado.sesion;
  $("#form-teclado").hidden = true;
  if (!estado.holo) $("#texto-usuario").textContent = pregunta;
  $("#burbuja-usuario").hidden = false;
  fase("pensando");
  // Si la pregunta anterior quedó sin respuesta (se cortó), se quita de la memoria:
  // si no, la IA vería dos preguntas seguidas y podría contestar la vieja.
  while (estado.historial.length && estado.historial[estado.historial.length - 1].rol === "usuario") {
    estado.historial.pop();
  }
  estado.historial.push({ rol: "usuario", texto: pregunta });
  estado.historial = estado.historial.slice(-HISTORIAL_MAX);

  let texto = null;
  const control = new AbortController();
  estado.pedido = control;
  try {
    const r = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ personaje: estado.actual.id, mensajes: estado.historial, demo: estado.demo }),
      signal: control.signal,
    });
    const datos = await r.json();
    texto = datos.texto || datos.detail;
  } catch {
    texto = null;
  }
  if (sesion !== estado.sesion) return;
  estado.pedido = null;
  if (!texto) {
    texto = "Parece que se cortó la conexión y no pude escucharte bien. ¿Me preguntas otra vez?";
  }
  estado.historial.push({ rol: "personaje", texto });
  await responderConVoz(texto, sesion);
}

function escuchar() {
  prepararAudio();
  if (!Oido.soportado()) {
    if (estado.holo) return;
    aviso("Este navegador no puede escucharte. ¡Escribe tu pregunta!");
    return alternarTeclado(true);
  }
  cancelarTurno();
  const sesion = estado.sesion;

  if (!estado.holo) {
    $("#texto-usuario").innerHTML = '<span class="interino">…</span>';
    $("#burbuja-usuario").hidden = false;
  }
  fase("escuchando");
  if (estado.holo) pitido(true);
  Ambiente.microfono(true);

  estado.reconocedor = Oido.escuchar({
    lang: "es-PE",
    personaje: estado.actual.id,
    // Texto en vivo (solo con el reconocimiento de Chrome).
    onParcial: (final, interino) => {
      if (estado.holo || sesion !== estado.sesion) return;
      const el = $("#texto-usuario");
      el.textContent = final;
      if (interino) {
        const s = document.createElement("span");
        s.className = "interino";
        s.textContent = interino + "…";
        el.appendChild(s);
      }
    },
    // Grabación enviada al servidor: se espera la transcripción.
    onEntendiendo: () => {
      Ambiente.microfono(false);
      if (estado.holo || sesion !== estado.sesion) return;
      $("#texto-usuario").innerHTML = '<span class="interino">Entendiendo lo que dijiste…</span>';
      $("#btn-mic").disabled = true;
      $("#mic-texto").textContent = "Un segundito…";
    },
    onFin: (texto, error) => {
      estado.reconocedor = null;
      Ambiente.microfono(false);
      if (sesion !== estado.sesion) return;
      if (estado.holo) pitido(false);
      if (texto) return enviar(texto);
      fase("listo");
      if (error === "permiso" || error === "sin-microfono") {
        if (!estado.holo) return mostrarError();
        return aviso("Necesito permiso para usar el micrófono. Revisa el candado de la barra de direcciones.", 6000);
      }
      if (estado.holo) return;
      if (error === "no-soportado") {
        aviso("Este navegador no puede escucharte. ¡Escribe tu pregunta!");
        return alternarTeclado(true);
      }
      aviso(error === "red"
        ? "Sin conexión para escucharte. Toca una idea o escribe tu pregunta."
        : "No te escuché bien. ¡Toca y habla otra vez, más cerquita!");
    },
  });
}

function tocarMic() {
  if (estado.fase === "escuchando") return estado.reconocedor && estado.reconocedor.detener();
  // Listo, pensando o hablando: se escucha una pregunta nueva (lo anterior se cancela).
  escuchar();
}

function repetir() {
  if (!estado.ultimoTexto) return;
  cancelarTurno();
  responderConVoz(estado.ultimoTexto, estado.sesion);
}

function abrirObras() {
  if (estado.actual.tiene_lecturas) return abrirLecturas();
  enviar(estado.actual.pregunta_obras);
}

function alternarTeclado(forzar) {
  const form = $("#form-teclado");
  form.hidden = forzar === true ? false : !form.hidden;
  if (!form.hidden) setTimeout(() => $("#input-pregunta").focus(), 50);
}

function detenerTodo() {
  if (estado.pedido) {
    estado.pedido.abort();
    estado.pedido = null;
  }
  if (estado.reconocedor) {
    estado.reconocedor.cancelar();
    estado.reconocedor = null;
  }
  Ambiente.microfono(false);
  if (estado.lecturaActiva) estado.lecturaActiva.cancelada = true;
  estado.lecturaActiva = null;
  detenerAudio();
}

// ---------- Pantalla 7: lecturas ----------
async function abrirLecturas() {
  const p = estado.actual;
  mostrar("lecturas");
  await Avatares.pintarAvatar($("#avatar-lecturas"), p.id);
  $("#lecturas-quien").innerHTML = `${p.nombre_corto.split(" ").slice(-1)[0]} te lee<br>con su voz`;
  $("#lector").hidden = true;
  const lista = $("#lista-lecturas");
  lista.innerHTML = "";
  let lecturas = [];
  try {
    lecturas = await (await fetch(`/api/lecturas/${p.id}`)).json();
  } catch {
    aviso("No pude traer las lecturas. Revisa la conexión.");
  }
  lecturas.forEach((l) => {
    const b = document.createElement("button");
    b.className = "lectura";
    b.innerHTML = `
      <span class="lectura-portada" aria-hidden="true">${ICONOS.libro}</span>
      <span class="lectura-info"><span class="lectura-titulo"></span><span class="lectura-obra"></span></span>
      <span class="lectura-play" aria-hidden="true">${ICONOS.play}</span>`;
    b.querySelector(".lectura-titulo").textContent = l.titulo;
    b.querySelector(".lectura-obra").textContent = `${l.obra} · ${l.minutos} min`;
    b.onclick = () => (b.classList.contains("activa") ? pararLectura() : leer(l.id, b));
    lista.appendChild(b);
  });
}

function pararLectura() {
  if (estado.lecturaActiva) estado.lecturaActiva.cancelada = true;
  estado.lecturaActiva = null;
  detenerAudio();
  document.querySelectorAll(".lectura").forEach((x) => {
    x.classList.remove("activa");
    x.querySelector(".lectura-play").innerHTML = ICONOS.play;
  });
  $("#lector").hidden = true;
}

async function leer(id, boton) {
  pararLectura();
  prepararAudio();
  const control = { cancelada: false };
  estado.lecturaActiva = control;
  boton.classList.add("activa");
  boton.querySelector(".lectura-play").innerHTML = ICONOS.pausa;

  let lectura;
  try {
    lectura = await (await fetch(`/api/lecturas/${estado.actual.id}/${id}`)).json();
  } catch {
    return aviso("No pude abrir esa lectura.");
  }
  const partes = lectura.partes;
  const lector = $("#lector");
  const barras = $("#lector-barras");
  lector.hidden = false;
  barras.innerHTML = partes.map(() => "<div></div>").join("");
  $("#lector-estado").textContent = "Leyendo…";

  // Se pide el audio de la siguiente parte mientras suena la actual (menos espera).
  let siguiente = pedirAudio(partes[0]);
  for (let i = 0; i < partes.length; i++) {
    if (control.cancelada) return;
    $("#lector-parte").textContent = `Parte ${i + 1} de ${partes.length}`;
    [...barras.children].forEach((b, j) => (b.className = j < i ? "hecha" : j === i ? "ahora" : ""));
    const avanzar = pintarSubtitulo($("#lector-texto"), partes[i]);
    $("#lector-texto").scrollTop = 0;
    const blob = await siguiente;
    if (control.cancelada) return;
    siguiente = i + 1 < partes.length ? pedirAudio(partes[i + 1]) : null;
    await decir(partes[i], avanzar, blob);
  }
  if (control.cancelada) return;
  [...barras.children].forEach((b) => (b.className = "hecha"));
  $("#lector-estado").textContent = "¡Terminé!";
  $("#lector-parte").textContent = "";
  boton.classList.remove("activa");
  boton.querySelector(".lectura-play").innerHTML = ICONOS.otraVez.replace(/width="30" height="30"/, 'width="24" height="24"');
  estado.lecturaActiva = null;
}

// ---------- Pantalla 8: no te puedo oír ----------
function mostrarError() {
  mostrar("error");
  const preguntas = ["¿Cómo eras de niño?", estado.actual.pregunta_obras, "¿Cómo era tu época?", "Cuéntame algo curioso"];
  const caja = $("#baldosas");
  caja.innerHTML = "";
  preguntas.forEach((q) => {
    const b = document.createElement("button");
    b.className = "baldosa";
    b.innerHTML = ICONOS.pregunta;
    b.append(q);
    b.onclick = () => volverYPreguntar(q);
    caja.appendChild(b);
  });
}

function volverYPreguntar(q) {
  mostrar("charla");
  fase("listo");
  if (q) enviar(q);
}

// ---------- Pantalla 9: holograma ----------
const holoConfig = {
  tam: Number(localStorage.getItem("voces-holo-tam")) || 30,
  continuo: localStorage.getItem("voces-holo-continuo") !== "0",
  sonidos: localStorage.getItem("voces-holo-sonidos") !== "0",
  guia: localStorage.getItem("voces-holo-guia") === "1",
};
let holoSaludado = false;

const panelHoloAbierto = () => $("#holo-panel").classList.contains("abierto");

function abrirHolograma(p) {
  estado.holo = true;
  mostrar("holo");
  ponerPersonajeHolo(p || estado.actual || estado.personajes[0], false);
  aplicarConfigHolo();
  abrirPanelHolo();
}

function salirHolograma() {
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  $("#holo-panel").classList.remove("abierto");
  document.body.classList.remove("panel-abierto");
  estado.holo = false;
  if (ABRIR_HOLO) history.replaceState(null, "", "/");
  mostrar("elegir");
}

function ponerPersonajeHolo(p, anunciar = true) {
  estado.sesion++;
  detenerTodo();
  estado.actual = p;
  estado.historial = [];
  holoSaludado = false;
  aplicarColores(p);
  document.querySelectorAll(".holo-avatar").forEach((el) => Avatares.pintarAvatar(el, p.id));
  document.querySelectorAll("#holo-personajes button").forEach((b) => b.classList.toggle("elegido", b.dataset.id === p.id));
  fase("listo");
  if (!panelHoloAbierto()) Ambiente.iniciar(p.id);
  if (anunciar) {
    const n = $("#holo-nombre");
    n.textContent = p.nombre_corto;
    n.classList.add("visible");
    clearTimeout(n._t);
    n._t = setTimeout(() => n.classList.remove("visible"), 1500);
  }
}

function cambiarPersonajeHolo(paso) {
  const i = estado.personajes.indexOf(estado.actual);
  const n = estado.personajes.length;
  ponerPersonajeHolo(estado.personajes[(i + paso + n) % n]);
}

function aplicarConfigHolo() {
  const zona = $("#holo-toque");
  zona.style.setProperty("--tam", holoConfig.tam);
  zona.classList.toggle("guia", holoConfig.guia);
  $("#holo-tam").value = holoConfig.tam;
  $("#holo-continuo").checked = holoConfig.continuo;
  $("#holo-sonidos").checked = holoConfig.sonidos;
  $("#holo-guia").checked = holoConfig.guia;
  localStorage.setItem("voces-holo-tam", holoConfig.tam);
  localStorage.setItem("voces-holo-continuo", holoConfig.continuo ? "1" : "0");
  localStorage.setItem("voces-holo-sonidos", holoConfig.sonidos ? "1" : "0");
  localStorage.setItem("voces-holo-guia", holoConfig.guia ? "1" : "0");
}

function abrirPanelHolo() {
  estado.sesion++;
  detenerTodo();
  fase("listo");
  $("#holo-panel").classList.add("abierto");
  document.body.classList.add("panel-abierto");
  Ambiente.detener();
}

function cerrarPanelHolo() {
  $("#holo-panel").classList.remove("abierto");
  document.body.classList.remove("panel-abierto");
  prepararAudio();
  if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  }
  const sesion = estado.sesion;
  const cortina = Ambiente.iniciar(estado.actual.id);
  if (!holoSaludado) {
    holoSaludado = true;
    setTimeout(() => responderConVoz(elegirSaludo(estado.actual), sesion), cortina * 700);
  }
}

function tocarHolo() {
  prepararAudio();
  if (!holoSaludado) {
    holoSaludado = true;
    return responderConVoz(elegirSaludo(estado.actual), estado.sesion);
  }
  tocarMic();
}

/** Pitido corto para saber cuándo empieza (sube) y termina (baja) de escuchar. */
function pitido(subida) {
  if (!holoConfig.sonidos || !ctxAudio) return;
  const t = ctxAudio.currentTime;
  const o = ctxAudio.createOscillator();
  const g = ctxAudio.createGain();
  o.type = "sine";
  o.frequency.setValueAtTime(subida ? 660 : 880, t);
  o.frequency.linearRampToValueAtTime(subida ? 990 : 520, t + 0.15);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
  o.connect(g);
  g.connect(ctxAudio.destination);
  o.start(t);
  o.stop(t + 0.22);
}

function prepararHolograma() {
  // Botones de personajes del panel
  const caja = $("#holo-personajes");
  caja.innerHTML = "";
  estado.personajes.forEach((p) => {
    const b = document.createElement("button");
    b.dataset.id = p.id;
    b.innerHTML = '<div class="avatar"></div><span></span>';
    b.querySelector("span").textContent = p.nombre_corto;
    b.querySelector(".avatar").style.setProperty("--c", p.colores.principal);
    Avatares.pintarAvatar(b.querySelector(".avatar"), p.id);
    b.onclick = () => ponerPersonajeHolo(p, false);
    caja.appendChild(b);
  });

  const cambiarTam = (v) => {
    holoConfig.tam = Math.max(16, Math.min(40, v));
    aplicarConfigHolo();
  };
  $("#holo-tam").oninput = (e) => cambiarTam(Number(e.target.value));
  $("#holo-menos").onclick = () => cambiarTam(holoConfig.tam - 2);
  $("#holo-mas").onclick = () => cambiarTam(holoConfig.tam + 2);
  $("#holo-continuo").onchange = (e) => { holoConfig.continuo = e.target.checked; aplicarConfigHolo(); };
  $("#holo-sonidos").onchange = (e) => { holoConfig.sonidos = e.target.checked; aplicarConfigHolo(); };
  $("#holo-guia").onchange = (e) => { holoConfig.guia = e.target.checked; aplicarConfigHolo(); };
  $("#holo-ambiente").value = Math.round(Ambiente.volumen * 100);
  $("#holo-ambiente").oninput = (e) => {
    Ambiente.volumen = Number(e.target.value) / 100;
    actualizarBotonSonido();
  };
  $("#holo-empezar").onclick = cerrarPanelHolo;
  $("#holo-salir").onclick = salirHolograma;

  // Gestos: toque = hablar, deslizar = cambiar personaje, mantener 2 s = panel.
  const zona = $("#holo-toque");
  let inicio = null, temporizador = 0, usado = false;
  zona.addEventListener("pointerdown", (e) => {
    inicio = { x: e.clientX, y: e.clientY };
    usado = false;
    clearTimeout(temporizador);
    temporizador = setTimeout(() => { usado = true; abrirPanelHolo(); }, 2000);
  });
  zona.addEventListener("pointermove", (e) => {
    if (inicio && Math.hypot(e.clientX - inicio.x, e.clientY - inicio.y) > 30) clearTimeout(temporizador);
  });
  zona.addEventListener("pointerup", (e) => {
    clearTimeout(temporizador);
    if (!inicio || usado) return (inicio = null);
    const dx = e.clientX - inicio.x, dy = e.clientY - inicio.y;
    inicio = null;
    if (Math.abs(dx) > 80 && Math.abs(dx) > Math.abs(dy)) return cambiarPersonajeHolo(dx < 0 ? 1 : -1);
    if (Math.hypot(dx, dy) < 30) tocarHolo();
  });
  zona.addEventListener("pointercancel", () => { clearTimeout(temporizador); inicio = null; });

  // Teclado (útil con computadora + proyector)
  document.addEventListener("keydown", (e) => {
    if (!estado.holo) return;
    if (e.key === "Escape") return panelHoloAbierto() ? cerrarPanelHolo() : abrirPanelHolo();
    if (panelHoloAbierto()) return;
    if (e.key === " " || e.key === "Enter") { e.preventDefault(); tocarHolo(); }
    else if (e.key === "ArrowRight") cambiarPersonajeHolo(1);
    else if (e.key === "ArrowLeft") cambiarPersonajeHolo(-1);
  });
}

// ---------- Modo demo oculto (5 toques en el título del inicio o en el nombre del personaje) ----------
function activarToquesSecretos(el) {
  let toques = 0, t = 0;
  el.addEventListener("click", () => {
    const ahora = Date.now();
    toques = ahora - t < 600 ? toques + 1 : 1;
    t = ahora;
    if (toques >= 5) {
      toques = 0;
      estado.demo = !estado.demo;
      localStorage.setItem("voces-demo", estado.demo ? "1" : "0");
      actualizarSelloDemo();
      aviso(estado.demo ? "Modo demo activado: respuestas sin internet." : "Modo demo desactivado.");
    }
  });
}

/** Portada del inicio: un personaje por categoría ("portada" en categorias.json).
 *  La primera categoría va al centro y las demás se reparten a los lados. */
function pintarPortada() {
  const grupo = $("#inicio-grupo");
  grupo.querySelectorAll(".inicio-cara").forEach((c) => c.remove());
  const porId = Object.fromEntries(estado.personajes.map((p) => [p.id, p]));
  const elegidos = estado.categorias
    .map((c) => porId[c.portada] || estado.personajes.find((p) => p.categoria === c.id && p.imagenes)
      || estado.personajes.find((p) => p.categoria === c.id))
    .filter(Boolean);
  if (!elegidos.length) elegidos.push(...estado.personajes.slice(0, 3));
  const lugares = [3, 2, 4, 1, 5];
  elegidos.slice(0, 5).forEach((p, i) => {
    const cara = document.createElement("div");
    cara.className = `inicio-cara cara-${lugares[i]}`;
    cara.style.setProperty("--c-fondo", p.colores.fondo);
    cara.style.setProperty("--c-oscuro", p.colores.oscuro);
    cara.title = p.nombre_corto;
    const av = document.createElement("div");
    av.className = "avatar";
    cara.appendChild(av);
    grupo.appendChild(cara);
    Avatares.pintarAvatar(av, p.id);
  });
}

/** Muestra las fuentes con las que se verificó la ficha del personaje. */
async function mostrarFuentes() {
  const lista = $("#lista-fuentes");
  lista.innerHTML = "<li>Cargando…</li>";
  $("#modal-fuentes").hidden = false;
  try {
    const fuentes = await (await fetch(`/api/fuentes/${estado.actual.id}`)).json();
    lista.innerHTML = "";
    if (!fuentes.length) lista.innerHTML = "<li>Este personaje todavía no tiene fuentes registradas.</li>";
    fuentes.forEach((f) => {
      const li = document.createElement("li");
      if (f.url) {
        const a = document.createElement("a");
        a.href = f.url;
        a.target = "_blank";
        a.rel = "noopener";
        a.textContent = f.texto;
        li.appendChild(a);
      } else {
        li.textContent = f.texto;
      }
      if (f.referencia) {
        const s = document.createElement("span");
        s.className = "fuente-ref";
        s.textContent = " · obra de referencia";
        li.appendChild(s);
      }
      lista.appendChild(li);
    });
  } catch {
    lista.innerHTML = "<li>No pude cargar las fuentes. Revisa la conexión.</li>";
  }
}

function actualizarBotonSonido() {
  const b = $("#btn-sonido");
  const activo = Ambiente.volumen > 0;
  b.classList.toggle("apagado", !activo);
  b.setAttribute("aria-label", activo ? "Silenciar sonido ambiente" : "Activar sonido ambiente");
  b.title = activo ? "Sonido ambiente activado" : "Sonido ambiente apagado";
  const r = $("#holo-ambiente");
  if (r) r.value = Math.round(Ambiente.volumen * 100);
}

function actualizarSelloDemo() {
  const s = $("#sello-demo");
  s.hidden = !(estado.demo || estado.servidorDemo);
  s.textContent = estado.servidorDemo ? "SIN IA · falta la clave en .env" : "DEMO";
}

// ---------- Arranque ----------
async function iniciar() {
  try {
    estado.personajes = await (await fetch("/api/personajes")).json();
    estado.categorias = await (await fetch("/api/categorias")).json();
    const servidor = await (await fetch("/api/estado")).json();
    estado.servidorDemo = servidor.modo_demo;
    Oido.configurar({ servidor: servidor.stt });
  } catch {
    aviso("No me pude conectar con el servidor. Revisa internet y recarga la página.", 8000);
  }
  actualizarSelloDemo();
  estado.personajes.forEach((p) => {
    if (p.imagenes) Avatares.conImagenes.add(p.id);
    if (p.imagen_simple) Avatares.conImagenSimple.add(p.id);
    if (p.img_ext) Avatares.extImagen[p.id] = p.img_ext;
    if (p.retrato) Avatares.encuadre[p.id] = p.retrato;
    Ambiente.configurarArchivos(p.id, p.sonidos);
    if (p.parpadeo) Avatares.conParpadeo.add(p.id);
  });
  pintarPortada();
  if (!estado.personajes.length) return;
  const apellidos = estado.personajes.map((p) => p.nombre_corto.replace(/^Inca /, "").split(" ").pop());
  $("#nota-personajes").textContent = apellidos.length <= 4
    ? `${apellidos.join(" · ")} te esperan`
    : `${apellidos.length} personajes del Perú te esperan`;

  pintarTarjetas();
  pintarFiltros();
  prepararHolograma();
  $("#btn-empezar").onclick = () => {
    prepararAudio();
    mostrar("elegir");
  };
  $("#btn-elegir-voz").onclick = elegirPorVoz;
  $("#btn-holo-elegir").onclick = () => abrirHolograma(estado.personajes[0]);
  $("#btn-holo-charla").onclick = () => abrirHolograma(estado.actual);
  $("#btn-mic").onclick = tocarMic;
  $("#btn-fuentes").onclick = mostrarFuentes;
  $("#fuentes-cerrar").onclick = () => ($("#modal-fuentes").hidden = true);
  $("#modal-fuentes").onclick = (e) => { if (e.target.id === "modal-fuentes") e.target.hidden = true; };
  $("#btn-sonido").onclick = () => {
    // Silencia o recupera el ambiente (recuerda el último volumen usado).
    if (Ambiente.volumen > 0) {
      localStorage.setItem("voces-ambiente-previo", Ambiente.volumen);
      Ambiente.volumen = 0;
    } else {
      Ambiente.volumen = Number(localStorage.getItem("voces-ambiente-previo")) || 0.6;
    }
    actualizarBotonSonido();
  };
  actualizarBotonSonido();
  $("#btn-reintentar").onclick = () => {
    mostrar("charla");
    fase("listo");
    escuchar();
  };
  $("#btn-escribir-error").onclick = () => {
    volverYPreguntar(null);
    alternarTeclado(true);
  };
  $("#form-teclado").onsubmit = (e) => {
    e.preventDefault();
    const q = $("#input-pregunta").value;
    $("#input-pregunta").value = "";
    enviar(q);
  };
  document.querySelectorAll("[data-volver]").forEach((b) => {
    b.onclick = () => {
      const destino = b.dataset.volver;
      if (destino === "charla") {
        mostrar("charla");
        fase("listo");
      } else {
        mostrar(destino);
      }
    };
  });
  activarToquesSecretos($("#titulo-app"));
  activarToquesSecretos($("#charla-nombre"));

  const pedido = estado.personajes.find((x) => x.id === params.get("p"));
  // /?holograma=1&p=grau abre directo el holograma con ese personaje.
  if (ABRIR_HOLO) return abrirHolograma(pedido);
  // /?p=grau va directo a la selección (útil para un QR por personaje).
  if (pedido) {
    mostrar("elegir");
    aviso(`Toca a ${pedido.nombre_corto} para empezar.`);
  }
}

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  navigator.serviceWorker.register("/sw.js").catch(() => {});
}
if ("speechSynthesis" in window) speechSynthesis.getVoices();
iniciar();
