// ═══════════════════════════════════════════════════════════════════
//   Mi TV — lógica de la app
//   (Los canales NO van aquí: van en canales.js)
// ═══════════════════════════════════════════════════════════════════
(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const reproductor = $("reproductor");
  const video = $("video");
  const pantalla = document.querySelector(".pantalla");
  const marco = $("marco");
  const radio = $("radio");
  const cargando = $("cargando");
  const aviso = $("aviso");
  const lista = $("lista");
  const btnFavoritos = $("btn-favoritos");

  const CLAVE_FAVORITOS = "mitv-favoritos";
  let favoritos = new Set(leerFavoritos());
  let soloFavoritos = false;
  let hls = null;
  let actual = null;
  let reloj = null;

  // ─────────── 1. Leer canales.js ───────────
  const errorCanales = window.__errores.find((e) => /canales\.js/i.test(e.filename || ""));
  // CANALES viene de canales.js
  const crudos = typeof CANALES !== "undefined" && Array.isArray(CANALES) ? CANALES : null;

  if (!crudos) {
    mostrarErrorLista(errorCanales);
    return;
  }

  const canales = crudos
    .filter((c) => c && c.nombre && c.link)
    .map((c) => ({
      nombre: String(c.nombre).trim(),
      link: String(c.link).trim(),
      grupo: c.grupo ? String(c.grupo).trim() : "Canales",
      nota: c.nota ? String(c.nota) : "",
      logo: c.logo ? String(c.logo).trim() : "",
      tipo: String(c.tipo || detectarTipo(c.link)).toLowerCase(),
    }));

  dibujarLista();
  registrarServiceWorker();

  // Link directo a un canal: ...app-tv/?canal=UChile TV
  const pedido = new URLSearchParams(location.search).get("canal");
  const canalPedido = pedido && canales.find((c) => c.nombre.toLowerCase() === pedido.toLowerCase());
  if (canalPedido) reproducir(canalPedido);

  // ─────────── 2. Dibujar la lista ───────────
  function dibujarLista() {
    lista.innerHTML = "";
    const visibles = soloFavoritos ? canales.filter((c) => favoritos.has(c.nombre)) : canales;

    if (!visibles.length) {
      lista.innerHTML = soloFavoritos
        ? '<div class="vacio">Todavía no tienes favoritos.<br>Toca la ☆ de un canal para agregarlo.</div>'
        : '<div class="vacio">No hay canales.<br>Agrégalos en <code>canales.js</code>.</div>';
      return;
    }

    const grupos = new Map();
    visibles.forEach((c) => {
      if (!grupos.has(c.grupo)) grupos.set(c.grupo, []);
      grupos.get(c.grupo).push(c);
    });

    grupos.forEach((items, nombreGrupo) => {
      const seccion = document.createElement("section");
      seccion.className = "grupo";
      const h2 = document.createElement("h2");
      h2.textContent = nombreGrupo;
      const grilla = document.createElement("div");
      grilla.className = "grilla";
      items.forEach((c) => grilla.appendChild(crearTarjeta(c)));
      seccion.append(h2, grilla);
      lista.appendChild(seccion);
    });
  }

  function crearTarjeta(c) {
    const t = document.createElement("div");
    t.className = "tarjeta" + (actual === c ? " activa" : "");
    t.setAttribute("role", "button");
    t.tabIndex = 0;
    t.dataset.nombre = c.nombre;

    const logo = document.createElement("div");
    logo.className = "logo";
    pintarLogo(logo, c);

    const nombre = document.createElement("div");
    nombre.className = "tarjeta-nombre";
    nombre.textContent = c.nombre;

    const etiqueta = document.createElement("span");
    etiqueta.className = "etiqueta " + c.tipo;
    etiqueta.textContent = { iptv: "En vivo", youtube: "YouTube", web: "Web" }[c.tipo] || c.tipo;

    t.append(logo, etiqueta, nombre);

    if (c.nota) {
      const nota = document.createElement("div");
      nota.className = "tarjeta-nota";
      nota.textContent = c.nota;
      t.appendChild(nota);
    }

    const estrella = document.createElement("button");
    estrella.type = "button";
    estrella.className = "estrella" + (favoritos.has(c.nombre) ? " si" : "");
    estrella.textContent = favoritos.has(c.nombre) ? "★" : "☆";
    estrella.setAttribute("aria-label", "Favorito");
    estrella.addEventListener("click", (ev) => {
      ev.stopPropagation();
      alternarFavorito(c);
    });
    t.appendChild(estrella);

    t.addEventListener("click", () => reproducir(c));
    t.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); reproducir(c); }
    });
    return t;
  }

  function pintarLogo(caja, c) {
    caja.style.background = colorDe(c.nombre);
    if (c.logo) {
      const img = document.createElement("img");
      img.alt = c.nombre;
      img.loading = "lazy";
      img.src = c.logo;
      img.onerror = () => { img.remove(); caja.textContent = iniciales(c.nombre); };
      caja.appendChild(img);
    } else {
      caja.textContent = iniciales(c.nombre);
    }
  }

  // ─────────── 3. Reproducir ───────────
  function reproducir(c) {
    detener();
    actual = c;
    reproductor.hidden = false;
    $("titulo").textContent = c.nombre;
    $("subtitulo").textContent = c.nota || "";
    $("radio-nombre").textContent = c.nombre;
    document.querySelectorAll(".tarjeta").forEach((t) => t.classList.toggle("activa", t.dataset.nombre === c.nombre));
    window.scrollTo({ top: 0, behavior: "smooth" });

    if (/^http:\/\//i.test(c.link) && location.protocol === "https:") {
      return mostrarAviso(
        "Este link empieza con http:// (sin “s”)",
        "El navegador bloquea las señales http:// dentro de una app publicada en internet. Busca una versión https:// del canal.",
        c.link
      );
    }

    if (c.tipo === "youtube") {
      const src = linkYoutube(c.link);
      if (!src) {
        return mostrarAviso(
          "No reconozco este link de YouTube",
          "Usa un link de video (youtube.com/watch?v=…) o de canal (youtube.com/channel/UC…). Los links con @nombre no sirven.",
          c.link
        );
      }
      ponerMarco(src);
    } else if (c.tipo === "web") {
      ponerMarco(c.link);
    } else {
      reproducirIptv(c);
    }
    ponerInfoPantallaBloqueo(c);
  }

  function reproducirIptv(c) {
    video.hidden = false;
    cargando.hidden = false;
    let reintentoHecho = false;

    const esArchivoDirecto = /\.(mp4|webm|mp3|aac|m4a|ogg)(\?|$)/i.test(c.link);
    if (!esArchivoDirecto && window.Hls && Hls.isSupported()) {
      hls = new Hls({ enableWorker: true });
      hls.on(Hls.Events.ERROR, (_e, d) => {
        if (!d.fatal) return;
        if (d.type === Hls.ErrorTypes.MEDIA_ERROR && !reintentoHecho) {
          reintentoHecho = true;
          hls.recoverMediaError();
          return;
        }
        falloSenal(c, d.details);
      });
      hls.loadSource(c.link);
      hls.attachMedia(video);
    } else {
      // iPhone (Safari) reproduce .m3u8 por sí solo
      video.src = c.link;
    }

    video.play().catch(() => { /* si el navegador no deja partir solo, el usuario aprieta ▶ */ });

    clearTimeout(reloj);
    reloj = setTimeout(() => {
      if (actual === c && video.readyState < 2 && aviso.hidden) {
        falloSenal(c, "tardó más de 25 segundos");
      }
    }, 25000);
  }

  video.addEventListener("loadeddata", () => {
    cargando.hidden = true;
    clearTimeout(reloj);
    // Si la señal no trae imagen, es radio: mostramos la pantalla de audio
    const soloAudio = video.videoWidth === 0 && video.videoHeight === 0;
    radio.hidden = !soloAudio;
    pantalla.classList.toggle("solo-audio", soloAudio);
  });
  video.addEventListener("playing", () => { cargando.hidden = true; });
  video.addEventListener("error", () => {
    if (actual && actual.tipo === "iptv" && !hls) falloSenal(actual, "el navegador no pudo abrir la señal");
  });

  function falloSenal(c, detalle) {
    if (actual !== c) return;
    if (hls) { hls.destroy(); hls = null; }
    mostrarAviso(
      "No se pudo cargar " + c.nombre,
      "Puede que el canal esté caído, que el link haya cambiado o que el servidor no deje usar su señal en otras apps.",
      "Detalle: " + detalle
    );
  }

  function ponerMarco(src) {
    const iframe = document.createElement("iframe");
    iframe.src = src;
    iframe.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = "strict-origin-when-cross-origin";
    marco.appendChild(iframe);
    marco.hidden = false;
  }

  function detener() {
    clearTimeout(reloj);
    if (hls) { hls.destroy(); hls = null; }
    video.pause();
    video.removeAttribute("src");
    video.load();
    video.hidden = true;
    marco.innerHTML = "";
    marco.hidden = true;
    radio.hidden = true;
    pantalla.classList.remove("solo-audio");
    cargando.hidden = true;
    aviso.hidden = true;
  }

  function mostrarAviso(titulo, texto, detalle) {
    cargando.hidden = true;
    aviso.innerHTML = "";
    const s = document.createElement("strong");
    s.textContent = titulo;
    const p = document.createElement("div");
    p.textContent = texto;
    aviso.append(s, p);
    if (detalle) {
      const d = document.createElement("small");
      d.textContent = detalle;
      aviso.appendChild(d);
    }
    aviso.hidden = false;
  }

  $("btn-cerrar").addEventListener("click", () => {
    detener();
    actual = null;
    reproductor.hidden = true;
    document.querySelectorAll(".tarjeta.activa").forEach((t) => t.classList.remove("activa"));
  });

  // ─────────── 4. Favoritos ───────────
  btnFavoritos.addEventListener("click", () => {
    soloFavoritos = !soloFavoritos;
    btnFavoritos.setAttribute("aria-pressed", String(soloFavoritos));
    btnFavoritos.textContent = (soloFavoritos ? "★" : "☆") + " Favoritos";
    dibujarLista();
  });

  function alternarFavorito(c) {
    if (favoritos.has(c.nombre)) favoritos.delete(c.nombre);
    else favoritos.add(c.nombre);
    localStorage.setItem(CLAVE_FAVORITOS, JSON.stringify([...favoritos]));
    dibujarLista();
  }

  function leerFavoritos() {
    try { return JSON.parse(localStorage.getItem(CLAVE_FAVORITOS) || "[]"); }
    catch (_e) { return []; }
  }

  // ─────────── 5. Ayudantes ───────────
  function detectarTipo(link) {
    if (/(youtube\.com|youtu\.be)\//i.test(link)) return "youtube";
    return "iptv";
  }

  function linkYoutube(link) {
    const vid = link.match(/(?:[?&]v=|youtu\.be\/|\/live\/|\/embed\/|\/shorts\/)([\w-]{11})/);
    if (vid) return "https://www.youtube.com/embed/" + vid[1] + "?autoplay=1&playsinline=1";
    const canal = link.match(/\/channel\/(UC[\w-]{22})/);
    if (canal) return "https://www.youtube.com/embed/live_stream?channel=" + canal[1] + "&autoplay=1&playsinline=1";
    return null;
  }

  function iniciales(nombre) {
    return nombre
      .replace(/\(.*?\)/g, " ")
      .split(/[^\p{L}\p{N}]+/u)
      .filter(Boolean)
      .slice(0, 3)
      .map((p) => p[0])
      .join("")
      .toUpperCase();
  }

  function colorDe(texto) {
    let h = 0;
    for (const ch of texto) h = (h * 31 + ch.charCodeAt(0)) % 360;
    return "linear-gradient(135deg, hsl(" + h + " 65% 42%), hsl(" + ((h + 40) % 360) + " 70% 28%))";
  }

  function ponerInfoPantallaBloqueo(c) {
    if (!("mediaSession" in navigator) || c.tipo !== "iptv") return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: c.nombre,
      artist: c.nota || "Mi TV",
      artwork: [{ src: "iconos/icono-512.png", sizes: "512x512", type: "image/png" }],
    });
  }

  function mostrarErrorLista(e) {
    const caja = document.createElement("div");
    caja.className = "error-lista";
    const linea = e && e.lineno ? " en la <strong>línea " + e.lineno + "</strong>" : "";
    caja.innerHTML =
      "<strong>Hay un error en canales.js</strong>" + linea + ".<br>" +
      "Revisa que cada dato termine en coma, que los textos tengan sus comillas \" \" y que haya una coma después de cada } ." +
      (e && e.message ? "<br><small>" + e.message.replace(/</g, "&lt;") + "</small>" : "");
    lista.appendChild(caja);
  }

  function registrarServiceWorker() {
    if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
      navigator.serviceWorker.register("sw.js").catch(() => {});
    }
  }
})();
