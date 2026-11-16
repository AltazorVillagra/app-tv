// ═══════════════════════════════════════════════════════════════════
//   LISTA DE CANALES  —  este es el archivo que tú editas
// ═══════════════════════════════════════════════════════════════════
//
//  Cada canal es un bloque { ... } y los bloques van separados por coma.
//
//  Datos de cada canal:
//    nombre : cómo se ve en la app                          (obligatorio)
//    link   : la dirección de la señal                      (obligatorio)
//    grupo  : sección donde aparece, ej. "Chile", "Inglés"  (opcional)
//    nota   : texto corto bajo el nombre                    (opcional)
//    logo   : link a una imagen; si no hay, se usan las iniciales (opcional)
//    tipo   : "iptv", "youtube" o "web" (opcional: la app lo adivina por el link)
//
//  Qué links sirven:
//    IPTV    → terminan en .m3u8        https://servidor.com/canal/playlist.m3u8
//    YouTube → un video en vivo         https://www.youtube.com/watch?v=XXXXXXXXXXX
//              o un canal (su "UC...")  https://www.youtube.com/channel/UCxxxxxxxxxxxxxxxxxxxxxx
//              (los links con @nombre NO sirven)
//    Web     → el reproductor "embed" que entrega el canal (poner tipo: "web")
//
//  OJO: el link tiene que empezar con https:// (con "s"). Los http:// no funcionan.
//  Si te equivocas en una coma o comilla, la app te avisa en qué línea está el error.
// ═══════════════════════════════════════════════════════════════════

const CANALES = [

  // ─────────────── CHILE ───────────────
  {
    nombre: "UChile TV",
    grupo:  "Chile",
    nota:   "Canal de la Universidad de Chile · En vivo",
    link:   "https://unlimited1-cl-isp.dps.live/uchiletv/uchiletv.smil/playlist.m3u8",
  },

  // ─────────────── INGLÉS BRITÁNICO ───────────────
  {
    nombre: "BBC World Service",
    grupo:  "Inglés británico",
    nota:   "Radio de noticias 24 horas · Solo audio",
    link:   "https://a.files.bbci.co.uk/ms6/live/3441A116-B12E-4D2F-ACA8-C1984642FA4B/audio/simulcast/hls/nonuk/pc_hd_abr_v2/aks/bbc_world_service.m3u8",
  },
  {
    nombre: "BBC News (YouTube)",
    grupo:  "Inglés británico",
    nota:   "Solo cuando transmiten en vivo para Chile",
    link:   "https://www.youtube.com/channel/UC16niRr50-MSBwiO3YDb3RA",
  },

  // ─────────────── ESPACIO PARA TUS CANALES NUEVOS ───────────────
  // Copia este bloque, quítale las // del principio y llena los datos:
  //
  // {
  //   nombre: "",
  //   grupo:  "",
  //   nota:   "",
  //   link:   "https://",
  // },

];
