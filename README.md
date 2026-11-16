# 📺 Mi TV

App para ver canales en vivo en el celular (TV, IPTV y YouTube).
Se instala desde el navegador, sin APK ni Play Store.

**Link de la app:** https://altazorvillagra.github.io/app-tv/

---

## Instalarla en el celular
1. Abre el link de arriba en **Chrome**.
2. Menú **⋮** → **Agregar a pantalla de inicio** (o **Instalar app**).
3. Queda con su ícono, como cualquier app.

En iPhone: ábrelo en **Safari** → botón **Compartir** → **Agregar a inicio**.

---

## Agregar un canal
Todo está en **`canales.js`**. No hay que tocar ningún otro archivo.

1. Abre `canales.js` en VS Code.
2. Baja hasta **ESPACIO PARA TUS CANALES NUEVOS**.
3. Copia el bloque de ejemplo, quítale las `//` y llena los datos:

```js
  {
    nombre: "Nombre del canal",
    grupo:  "Inglés británico",
    nota:   "Lo que quieras recordar",
    link:   "https://servidor.com/canal/playlist.m3u8",
  },
```

4. Guarda (**Ctrl + S**) y súbelo (ver abajo).

### Qué links sirven
| Tipo | Cómo se ve el link |
|---|---|
| IPTV | Termina en `.m3u8` → `https://.../playlist.m3u8` |
| YouTube (un video en vivo) | `https://www.youtube.com/watch?v=XXXXXXXXXXX` |
| YouTube (un canal) | `https://www.youtube.com/channel/UC...` (los de `@nombre` no sirven) |
| Página del canal | Su reproductor "embed", con `tipo: "web"` |

⚠️ **Tiene que empezar con `https://`** (con "s"). Los `http://` no funcionan en una app publicada.

### Cómo encontrar el link .m3u8 de un canal
1. Abre la página donde el canal transmite en vivo, en el PC.
2. Aprieta **F12** → pestaña **Red** (Network).
3. En el filtro escribe `m3u8` y recarga la página (**F5**).
4. Aparece algo como `playlist.m3u8` o `index.m3u8`: clic derecho → **Copiar URL**.
5. Pégalo en `canales.js`.

Si el link trae cosas como `token=` o `expires=`, va a dejar de funcionar al rato; busca otro.

---

## Subir los cambios (para que se actualice en el celular)
En VS Code:
1. Ícono de **Control de código fuente** (las ramitas, a la izquierda) o **Ctrl + Shift + G**.
2. Escribe qué cambiaste, por ejemplo: `agregué canal X`.
3. **Confirmar** → **Sincronizar cambios**.
4. En 1 o 2 minutos la app se actualiza sola en el celular (ciérrala y ábrela).

---

## Probarla en el PC antes de subirla
En VS Code: **Ctrl + Shift + D** → **▶ Probar Mi TV** (o F5).
- PC: http://localhost:8000
- Celular (misma red WiFi): `http://<IP del PC>:8000`

Para detenerla: botón ⏹ rojo de VS Code.

---

## Archivos
| Archivo | Para qué |
|---|---|
| `canales.js` | **La lista de canales (el que tú editas)** |
| `index.html` | La estructura de la página |
| `estilos.css` | Colores y diseño (los colores están arriba del todo) |
| `app.js` | Reproductor, favoritos y avisos de error |
| `manifest.webmanifest`, `sw.js`, `iconos/` | Para que se pueda instalar como app |
