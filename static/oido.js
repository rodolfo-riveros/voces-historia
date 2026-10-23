// El "oído" de la app: convierte lo que dice el niño en texto, en cualquier navegador.
//  - Google Chrome: usa su propio reconocimiento de voz (rápido y con texto en vivo).
//  - Edge, Brave, Firefox, Safari, etc.: graba el audio y lo transcribe el servidor (Whisper).
// Si el reconocimiento de Chrome falla por red, pasa solo al del servidor.
// El audio nunca se guarda: viaja una vez al servidor, se transcribe en memoria y se descarta.

const Oido = (() => {
  const SILENCIO_MS = 1600;  // pausa tras la última palabra para dar por terminada la pregunta
  const SIN_VOZ_MS = 8000;   // si no dice nada en este tiempo, se deja de escuchar
  const MAXIMO_MS = 25000;   // tope de una sola pregunta

  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  let servidorDisponible = false;
  let forzarServidor = sessionStorage.getItem("voces-oido-servidor") === "1";
  let ctx = null;

  /** Chrome de Google (no Edge, Brave, Opera…): el único con reconocimiento confiable en es-PE. */
  function esChromeDeGoogle() {
    if (navigator.brave) return false;
    const marcas = navigator.userAgentData && navigator.userAgentData.brands;
    if (marcas) return marcas.some((m) => m.brand === "Google Chrome");
    const ua = navigator.userAgent;
    return /Chrome\//.test(ua) && !/Edg\/|OPR\/|SamsungBrowser|YaBrowser|Vivaldi|DuckDuckGo/.test(ua);
  }

  const puedeGrabar = () => !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
  const usarNativo = () => !!SR && esChromeDeGoogle() && !(forzarServidor && servidorDisponible);

  function soportado() {
    return usarNativo() || (servidorDisponible && puedeGrabar());
  }

  /**
   * Empieza a escuchar. Devuelve un control {detener(), cancelar()}.
   * op: {lang, personaje, onParcial(texto), onEntendiendo(), onFin(texto, error)}
   * Errores: "permiso", "sin-microfono", "red", "nada", "no-soportado".
   */
  function escuchar(op) {
    if (usarNativo()) return escucharNativo(op);
    if (servidorDisponible && puedeGrabar()) return escucharServidor(op);
    setTimeout(() => op.onFin("", "no-soportado"), 0);
    return { detener() {}, cancelar() {} };
  }

  // ---------- Chrome: Web Speech API ----------
  function escucharNativo(op) {
    const rec = new SR();
    rec.lang = op.lang || "es-PE";
    rec.interimResults = true;
    // Continuo: no corta en la primera pausa (los niños se detienen a pensar).
    rec.continuous = true;
    rec.maxAlternatives = 1;
    let final = "", interino = "", error = null, cancelado = false, cambiado = null;
    let timerSilencio = setTimeout(() => rec.stop(), SIN_VOZ_MS);
    const timerMaximo = setTimeout(() => rec.stop(), MAXIMO_MS);

    rec.onresult = (e) => {
      interino = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        const t = r[0].transcript.trim();
        if (!r.isFinal) { interino += " " + t; continue; }
        // En Chrome de Android cada resultado final puede repetir lo anterior: no duplicar.
        if (final && t.toLowerCase().startsWith(final.toLowerCase())) final = t;
        else final = (final + " " + t).trim();
      }
      interino = interino.trim();
      clearTimeout(timerSilencio);
      timerSilencio = setTimeout(() => rec.stop(), SILENCIO_MS);
      op.onParcial && op.onParcial(final, interino);
    };
    rec.onerror = (e) => (error = e.error);
    rec.onend = () => {
      clearTimeout(timerSilencio);
      clearTimeout(timerMaximo);
      if (cancelado) return;
      const texto = (final || interino).trim();
      if (texto) return op.onFin(texto, null);
      // Sin servicio de Google (red bloqueada, navegador sin acceso): se pasa al servidor.
      if ((error === "network" || error === "service-not-allowed") && servidorDisponible && puedeGrabar()) {
        forzarServidor = true;
        sessionStorage.setItem("voces-oido-servidor", "1");
        cambiado = escucharServidor(op);
        return;
      }
      const mapa = { "not-allowed": "permiso", "service-not-allowed": "permiso", "audio-capture": "sin-microfono", network: "red" };
      op.onFin("", mapa[error] || "nada");
    };
    try {
      rec.start();
    } catch {
      clearTimeout(timerSilencio);
      clearTimeout(timerMaximo);
      setTimeout(() => op.onFin("", "nada"), 0);
    }
    return {
      detener() { cambiado ? cambiado.detener() : rec.stop(); },
      cancelar() {
        cancelado = true;
        if (cambiado) cambiado.cancelar();
        try { rec.abort(); } catch {}
      },
    };
  }

  // ---------- Otros navegadores: grabar y transcribir en el servidor ----------
  function tipoDeAudio() {
    const tipos = ["audio/webm;codecs=opus", "audio/ogg;codecs=opus", "audio/mp4", "audio/webm"];
    return tipos.find((t) => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t)) || "";
  }

  function escucharServidor(op) {
    let cancelado = false, grabador = null, stream = null, reloj = 0, timerMaximo = 0;
    let huboVoz = false;
    const partes = [];

    const terminar = () => {
      clearInterval(reloj);
      clearTimeout(timerMaximo);
      if (grabador && grabador.state !== "inactive") grabador.stop();
      else if (stream) stream.getTracks().forEach((t) => t.stop());
    };

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        });
      } catch (e) {
        if (cancelado) return;
        return op.onFin("", e && e.name === "NotFoundError" ? "sin-microfono" : "permiso");
      }
      if (cancelado) return stream.getTracks().forEach((t) => t.stop());

      const tipo = tipoDeAudio();
      grabador = new MediaRecorder(stream, tipo ? { mimeType: tipo } : undefined);
      grabador.ondataavailable = (e) => e.data && e.data.size && partes.push(e.data);
      grabador.onstop = () => enviar();
      grabador.start(250);

      // Detector de voz simple: mide el volumen y corta tras un silencio.
      try {
        ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
        if (ctx.state === "suspended") ctx.resume();
        const analizador = ctx.createAnalyser();
        analizador.fftSize = 1024;
        ctx.createMediaStreamSource(stream).connect(analizador);
        const datos = new Float32Array(analizador.fftSize);
        const inicio = performance.now();
        let ruido = 0.01, ultimaVoz = 0, vozDesde = 0;
        reloj = setInterval(() => {
          analizador.getFloatTimeDomainData(datos);
          let suma = 0;
          for (let i = 0; i < datos.length; i++) suma += datos[i] * datos[i];
          const nivel = Math.sqrt(suma / datos.length);
          const t = performance.now();
          // El primer medio segundo sirve para medir el ruido del lugar.
          if (t - inicio < 500) { ruido = Math.max(ruido, nivel); return; }
          const umbral = Math.max(0.02, ruido * 2.2);
          if (nivel > umbral) {
            if (!vozDesde) vozDesde = t;
            if (t - vozDesde > 150) { huboVoz = true; ultimaVoz = t; }
          } else {
            vozDesde = 0;
          }
          if (huboVoz && t - ultimaVoz > SILENCIO_MS) terminar();
          else if (!huboVoz && t - inicio > SIN_VOZ_MS) terminar();
        }, 50);
      } catch {
        huboVoz = true; // sin medidor: se envía lo grabado al tocar o al llegar al tope
      }
      timerMaximo = setTimeout(terminar, MAXIMO_MS);
    })();

    async function enviar() {
      if (stream) stream.getTracks().forEach((t) => t.stop());
      if (cancelado) return;
      const blob = new Blob(partes, { type: (grabador && grabador.mimeType) || "audio/webm" });
      if (!huboVoz || blob.size < 1500) return op.onFin("", "nada");
      op.onEntendiendo && op.onEntendiendo();
      try {
        const r = await fetch(`/api/stt?personaje=${encodeURIComponent(op.personaje || "")}`, {
          method: "POST",
          headers: { "Content-Type": blob.type || "application/octet-stream" },
          body: blob,
        });
        if (cancelado) return;
        if (!r.ok) return op.onFin("", r.status === 429 ? "nada" : "red");
        const { texto } = await r.json();
        op.onFin((texto || "").trim(), texto ? null : "nada");
      } catch {
        if (!cancelado) op.onFin("", "red");
      }
    }

    return {
      detener() { huboVoz = true; terminar(); },
      cancelar() { cancelado = true; terminar(); },
    };
  }

  return {
    escuchar,
    soportado,
    /** El servidor avisa en /api/estado si tiene Whisper activo. */
    configurar(op) {
      if ("servidor" in op) servidorDisponible = !!op.servidor;
      if (op.contexto) ctx = op.contexto;
    },
    get modo() { return usarNativo() ? "navegador" : servidorDisponible && puedeGrabar() ? "servidor" : "ninguno"; },
  };
})();

window.Oido = Oido;
