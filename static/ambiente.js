// Ambientación sonora de cada personaje.
// Los sonidos se generan en el navegador (sin archivos, sin internet, sin derechos de autor).
// Si existen static/sonidos/<personaje>/fondo.mp3 o entrada.mp3, se usan esos en su lugar.
"use strict";

const Ambiente = (() => {
  let ctx = null;          // AudioContext compartido con la voz (lo entrega app.js)
  let master = null;       // volumen general del ambiente
  let escena = null;       // escena sonando: { salida, fuentes, reloj }
  let actual = null;       // id del personaje
  const guardado = localStorage.getItem("voces-ambiente");
  let volumen = guardado === null ? 0.6 : Number(guardado);
  let hablando = false, escuchando = false;
  const archivos = {};     // id -> { fondo, entrada } (rutas de audio propias)
  const decodificados = {};

  const azar = (a, b) => a + Math.random() * (b - a);

  // ---------- Volumen: baja mientras el personaje habla y se calla mientras escucha ----------
  function aplicar(seg = 0.5) {
    if (!master) return;
    const nivel = escuchando ? 0 : hablando ? 0.3 : 1;
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setTargetAtTime(volumen * volumen * nivel, ctx.currentTime, seg / 3);
  }

  // ---------- Materia prima: ruidos y cuerdas ----------
  let ruidoBlanco = null, ruidoMarron = null;
  function crearRuidos() {
    const n = ctx.sampleRate * 4;
    ruidoBlanco = ctx.createBuffer(1, n, ctx.sampleRate);
    ruidoMarron = ctx.createBuffer(1, n, ctx.sampleRate);
    const b = ruidoBlanco.getChannelData(0), m = ruidoMarron.getChannelData(0);
    let ultimo = 0;
    for (let i = 0; i < n; i++) {
      const w = Math.random() * 2 - 1;
      b[i] = w;
      ultimo = (ultimo + 0.02 * w) / 1.02;
      m[i] = ultimo * 3.5;
    }
  }
  function ruido(tipo) {
    const s = ctx.createBufferSource();
    s.buffer = tipo === "marron" ? ruidoMarron : ruidoBlanco;
    s.loop = true;
    return s;
  }
  const filtro = (type, frequency, Q = 1) => new BiquadFilterNode(ctx, { type, frequency, Q });
  const ganancia = (gain) => new GainNode(ctx, { gain });

  /** Oscilador lento que mueve un parámetro (para que nada suene "fijo"). */
  function lfo(param, centro, profundidad, hz, fuentes) {
    param.value = centro;
    const o = new OscillatorNode(ctx, { frequency: hz });
    const g = ganancia(profundidad);
    o.connect(g).connect(param);
    o.start();
    fuentes.push(o);
  }

  // Cuerda pulsada (algoritmo Karplus-Strong): suena como arpa o charango.
  const cuerdas = {};
  function cuerda(f) {
    const clave = Math.round(f);
    if (cuerdas[clave]) return cuerdas[clave];
    const sr = ctx.sampleRate, n = Math.floor(sr * 2.4), p = Math.round(sr / f);
    const buf = ctx.createBuffer(1, n, sr), d = buf.getChannelData(0);
    const linea = new Float32Array(p).map(() => Math.random() * 2 - 1);
    for (let i = 0, k = 0; i < n; i++) {
      const sig = (k + 1) % p;
      d[i] = linea[k];
      linea[k] = 0.996 * 0.5 * (linea[k] + linea[sig]);
      k = sig;
    }
    return (cuerdas[clave] = buf);
  }
  function pulsar(f, t, vol, destino) {
    const s = new AudioBufferSourceNode(ctx, { buffer: cuerda(f) });
    s.connect(ganancia(vol)).connect(destino);
    s.start(t);
  }

  /** Campana: suma de parciales que se apagan despacio. */
  function campana(f, t, vol, destino, dur = 4.5) {
    for (const [r, a] of [[0.5, 0.5], [1, 1], [1.2, 0.5], [1.5, 0.35], [2, 0.45], [2.7, 0.2], [4.1, 0.1]]) {
      const o = new OscillatorNode(ctx, { frequency: f * r });
      const g = ganancia(0);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vol * a, t + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur / r ** 0.4);
      o.connect(g).connect(destino);
      o.start(t);
      o.stop(t + dur + 0.1);
    }
  }

  /** Ráfaga corta de ruido filtrado (crujidos, plumas, gotas). */
  function rafaga(t, dur, frec, q, vol, destino, tipo = "bandpass") {
    const s = ruido("blanco");
    const g = ganancia(0);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + dur * 0.2);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(filtro(tipo, frec, q)).connect(g).connect(destino);
    s.start(t, Math.random() * 3);
    s.stop(t + dur + 0.05);
  }

  /** Canto de ave: silbido que sube y baja. */
  function pajaro(t, vol, destino, base = 2600) {
    const notas = Math.floor(azar(2, 5));
    for (let i = 0; i < notas; i++) {
      const t0 = t + i * azar(0.12, 0.22);
      const o = new OscillatorNode(ctx, { frequency: base });
      o.frequency.setValueAtTime(base * azar(0.9, 1.1), t0);
      o.frequency.exponentialRampToValueAtTime(base * azar(1.3, 1.6), t0 + 0.05);
      o.frequency.exponentialRampToValueAtTime(base * azar(0.8, 1), t0 + 0.11);
      const g = ganancia(0);
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(vol, t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.12);
      o.connect(g).connect(destino);
      o.start(t0);
      o.stop(t0 + 0.15);
    }
  }

  /** Gaviota: grito que baja de tono, con vibrato. */
  function gaviota(t, vol, destino) {
    for (let i = 0; i < Math.floor(azar(2, 4)); i++) {
      const t0 = t + i * azar(0.35, 0.5);
      const o = new OscillatorNode(ctx, { type: "sawtooth", frequency: 1800 });
      o.frequency.setValueAtTime(azar(1500, 1700), t0);
      o.frequency.linearRampToValueAtTime(azar(2100, 2400), t0 + 0.08);
      o.frequency.exponentialRampToValueAtTime(azar(1100, 1300), t0 + 0.32);
      const g = ganancia(0);
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(vol, t0 + 0.04);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.34);
      o.connect(filtro("bandpass", 1900, 3)).connect(g).connect(destino);
      o.start(t0);
      o.stop(t0 + 0.4);
    }
  }

  // ---------- Escenas de cada personaje ----------
  // Cada escena arma su fondo continuo y devuelve "eventos" que suenan de vez en cuando.
  const PENTATONICA = [220, 261.6, 293.7, 329.6, 392, 440, 523.3, 587.3];

  const ESCENAS = {
    // Grau: el mar. Olas que van y vienen, gaviotas y el crujido de la madera del barco.
    grau(salida, fuentes) {
      const olas = ganancia(0.05);
      const r = ruido("marron");
      r.connect(filtro("lowpass", 520, 0.7)).connect(olas).connect(salida);
      r.start();
      const espuma = ganancia(0.02);
      const b = ruido("blanco");
      b.connect(filtro("highpass", 2600)).connect(espuma).connect(salida);
      b.start();
      fuentes.push(r, b);
      return [
        { cada: [6, 9], fn: (t) => {
          // Una ola: sube, rompe y se retira.
          for (const [g, pico] of [[olas, 0.55], [espuma, 0.12]]) {
            g.gain.cancelScheduledValues(t);
            g.gain.setValueAtTime(g.gain.value, t);
            g.gain.linearRampToValueAtTime(pico, t + azar(2.2, 3));
            g.gain.linearRampToValueAtTime(pico * 0.12, t + azar(5.5, 7));
          }
        } },
        { cada: [14, 26], fn: (t) => gaviota(t, 0.025, salida) },
        { cada: [9, 16], fn: (t) => rafaga(t, azar(0.3, 0.6), azar(180, 320), 9, 0.12, salida) },
      ];
    },

    // Arguedas: los Andes. Un río que no se detiene, un arpa lejana tocando un huayno y pájaros.
    arguedas(salida, fuentes) {
      const rio = ganancia(0.09);
      const b = ruido("blanco");
      const bp = filtro("bandpass", 1200, 0.6);
      b.connect(bp).connect(rio).connect(salida);
      lfo(bp.frequency, 1250, 350, 0.07, fuentes);
      const fondo = ganancia(0.1);
      const m = ruido("marron");
      m.connect(filtro("lowpass", 260)).connect(fondo).connect(salida);
      b.start();
      m.start();
      fuentes.push(b, m);
      const arpa = filtro("lowpass", 2600, 0.5);
      arpa.connect(salida);
      return [
        { cada: [16, 28], fn: (t) => {
          // Frase de huayno: largo-corto-corto, en escala pentatónica.
          let x = t, i = Math.floor(azar(2, 5));
          for (let k = 0; k < Math.floor(azar(7, 12)); k++) {
            i = Math.max(0, Math.min(PENTATONICA.length - 1, i + Math.floor(azar(-2, 3))));
            pulsar(PENTATONICA[i], x, 0.16, arpa);
            if (k % 3 === 0) pulsar(PENTATONICA[Math.max(0, i - 4)] / 2, x, 0.1, arpa);
            x += [0.42, 0.21, 0.21][k % 3];
          }
        } },
        { cada: [8, 15], fn: (t) => pajaro(t, 0.018, salida, azar(2400, 3400)) },
        { cada: [0.4, 1.4], fn: (t) => rafaga(t, 0.04, azar(500, 1100), 12, 0.02, salida) },
      ];
    },

    // Garcilaso: el Cusco. Viento de cordillera, campanas lejanas y una pluma que escribe.
    garcilaso(salida, fuentes) {
      const viento = ganancia(0.12);
      const m = ruido("marron");
      const bp = filtro("bandpass", 550, 1.4);
      m.connect(bp).connect(viento).connect(salida);
      lfo(bp.frequency, 560, 220, 0.05, fuentes);
      lfo(viento.gain, 0.12, 0.06, 0.031, fuentes);
      m.start();
      fuentes.push(m);
      const lejos = filtro("lowpass", 1800, 0.5);
      lejos.connect(salida);
      return [
        { cada: [24, 40], fn: (t) => {
          const f = azar(300, 360);
          for (let k = 0; k < Math.floor(azar(2, 4)); k++) campana(f, t + k * 2.6, 0.05, lejos);
        } },
        { cada: [14, 24], fn: (t) => {
          // Pluma: rasgueos cortos y agudos sobre el papel.
          let x = t;
          for (let k = 0; k < Math.floor(azar(5, 11)); k++) {
            rafaga(x, azar(0.04, 0.09), azar(3200, 4200), 2.5, 0.035, salida);
            x += azar(0.08, 0.17);
          }
        } },
      ];
    },
  };

  // Sonido de entrada (cortina corta al elegir al personaje). Devuelve su duración.
  const ENTRADAS = {
    grau(destino) {
      const t = ctx.currentTime + 0.05;
      campana(1050, t, 0.12, destino, 2.2);
      campana(1050, t + 0.45, 0.12, destino, 2.6);
      return 1.6;
    },
    arguedas(destino) {
      // El zumbayllu: un trompo que zumba y canta, y un arpegio de arpa.
      const t = ctx.currentTime + 0.05;
      const o = new OscillatorNode(ctx, { frequency: 260 });
      o.frequency.linearRampToValueAtTime(360, t + 2.2);
      const trem = new OscillatorNode(ctx, { frequency: 13 });
      const g = ganancia(0);
      const tg = ganancia(0.04);
      trem.connect(tg).connect(g.gain);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.07, t + 0.3);
      g.gain.linearRampToValueAtTime(0, t + 2.4);
      o.connect(g).connect(destino);
      o.start(t); trem.start(t); o.stop(t + 2.5); trem.stop(t + 2.5);
      [0, 2, 4, 5, 7].forEach((i, k) => pulsar(PENTATONICA[i], t + 0.2 + k * 0.16, 0.2, destino));
      return 1.5;
    },
    garcilaso(destino) {
      const t = ctx.currentTime + 0.05;
      campana(392, t, 0.09, destino, 4);
      campana(523.3, t + 0.5, 0.07, destino, 4);
      return 1.6;
    },
  };

  // ---------- Archivos propios (opcionales) ----------
  async function decodificar(url) {
    if (!(url in decodificados)) {
      decodificados[url] = fetch(url).then((r) => r.arrayBuffer()).then((b) => ctx.decodeAudioData(b)).catch(() => null);
    }
    return decodificados[url];
  }

  // ---------- Control ----------
  function preparar() {
    if (!ctx) return false;
    if (!master) {
      master = ganancia(0);
      master.connect(ctx.destination);
      crearRuidos();
    }
    return true;
  }

  function detener() {
    if (!escena) return;
    const e = escena;
    escena = null;
    actual = null;
    clearInterval(e.reloj);
    const t = ctx.currentTime;
    e.salida.gain.setTargetAtTime(0, t, 0.25);
    setTimeout(() => {
      e.fuentes.forEach((f) => { try { f.stop(); } catch {} });
      e.salida.disconnect();
    }, 1500);
  }

  /** Empieza el ambiente del personaje. Devuelve los segundos que dura su cortina de entrada. */
  function iniciar(id, conEntrada = true) {
    if (!preparar()) return 0;
    if (actual === id && escena) return 0;
    detener();
    actual = id;
    const salida = ganancia(0);
    salida.connect(master);
    salida.gain.setTargetAtTime(1, ctx.currentTime, 0.8);
    const fuentes = [];
    const propio = archivos[id] || {};
    let eventos = [];

    if (propio.fondo) {
      decodificar(propio.fondo).then((buf) => {
        if (!buf || actual !== id) return;
        const s = new AudioBufferSourceNode(ctx, { buffer: buf, loop: true });
        s.connect(ganancia(0.8)).connect(salida);
        s.start();
        fuentes.push(s);
      });
    } else if (ESCENAS[id]) {
      eventos = ESCENAS[id](salida, fuentes);
    }

    const ahora = ctx.currentTime;
    eventos.forEach((ev) => (ev.prox = ahora + azar(1.5, ev.cada[0])));
    const reloj = setInterval(() => {
      const t = ctx.currentTime;
      for (const ev of eventos) {
        if (t >= ev.prox) {
          ev.fn(t + 0.05);
          ev.prox = t + azar(ev.cada[0], ev.cada[1]);
        }
      }
    }, 200);
    escena = { salida, fuentes, reloj };
    aplicar(0.2);

    if (!conEntrada) return 0;
    if (propio.entrada) {
      decodificar(propio.entrada).then((buf) => {
        if (!buf || actual !== id) return;
        const s = new AudioBufferSourceNode(ctx, { buffer: buf });
        s.connect(salida);
        s.start();
      });
      return 1.5;
    }
    return ENTRADAS[id] ? ENTRADAS[id](salida) : 0;
  }

  /** Para revisar desde la consola: personaje sonando y nivel real de sonido (0 = silencio). */
  let medidor = null;
  function diagnostico() {
    if (!master) return { activo: false };
    if (!medidor) {
      medidor = new AnalyserNode(ctx, { fftSize: 2048 });
      master.connect(medidor);
    }
    const d = new Float32Array(medidor.fftSize);
    medidor.getFloatTimeDomainData(d);
    const rms = Math.sqrt(d.reduce((s, x) => s + x * x, 0) / d.length);
    return { activo: !!escena, personaje: actual, ganancia: +master.gain.value.toFixed(3), nivel: +rms.toFixed(4) };
  }

  return {
    diagnostico,
    usarContexto(c) { ctx = c; },
    configurarArchivos(id, rutas) { if (rutas) archivos[id] = rutas; },
    iniciar,
    detener,
    voz(activo) { hablando = activo; aplicar(); },
    microfono(activo) { escuchando = activo; aplicar(0.15); },
    get volumen() { return volumen; },
    set volumen(v) {
      volumen = Math.max(0, Math.min(1, v));
      localStorage.setItem("voces-ambiente", volumen);
      aplicar(0.2);
    },
  };
})();

window.Ambiente = Ambiente;
