[🇬🇧 English](README.md) · [🇫🇷 Français](README.fr.md) · 🇪🇸 **Español** · [🇨🇳 中文](README.zh.md) · [🇮🇹 Italiano](README.it.md) · [🇳🇱 Nederlands](README.nl.md) · [🇩🇪 Deutsch](README.de.md)

# 🏎️ F1 UNO Élite — Collection Tracker

**Un gestor de colección de cartas instalable y offline-first, construido con JavaScript vanilla y cero dependencias en tiempo de ejecución — sin framework, sin SDK, sin CDN, sin backend.**

[![tests](https://github.com/Arts44/f1-uno-elite/actions/workflows/tests.yml/badge.svg)](https://github.com/Arts44/f1-uno-elite/actions/workflows/tests.yml)
![License: MIT](https://img.shields.io/badge/license-MIT-green)
![PWA](https://img.shields.io/badge/PWA-installable%20%2B%20offline%20%E2%9C%93-brightgreen)
![Zero runtime deps](https://img.shields.io/badge/runtime%20dependencies-0-blue)
![Vanilla JS](https://img.shields.io/badge/JavaScript-vanilla-f7df1e?logo=javascript&logoColor=black)
![i18n](https://img.shields.io/badge/languages-7-purple)

## ▶️ **[Pruébala en vivo → arts44.github.io/f1-uno-elite](https://arts44.github.io/f1-uno-elite/)**

Es una **PWA**: instálala desde tu navegador y funciona como una app nativa, totalmente sin conexión, con su propio icono — en escritorio y en móvil.

![Cuadrícula de colección — tema oscuro](screenshots/grid-desktop-dark.jpg)

| Detalle de carta — tipos foil animados | Panel de estadísticas |
|---|---|
| ![Modal de carta](screenshots/modal-dark.jpg) | ![Vista de estadísticas](screenshots/stats-light.jpg) |

<sub>Más capturas en [`screenshots/`](screenshots/) — temas claro/oscuro, móvil.</sub>

---

## ✨ Qué hace

Seguir una colección completa de cartas **F1 UNO Élite** (101 cartas, cada una en hasta 16 variantes — colores base, foils, duales, Wild, Nitro, promos):

- 📇 **Gestión completa de la colección** — en propiedad / repetidas / wishlist / favoritas, con cantidades por variante, búsqueda instantánea y filtros avanzados.
- ✨ **Sistema de rareza animado de 6 niveles** — `epic → legendary → mythic → ultra → cosmic → divine`, calculado automáticamente a partir de la mejor variante en propiedad; las cartas foil llevan barridos de luz animados y el nivel supremo se muestra como un degradado iridiscente en movimiento (todo respetando `prefers-reduced-motion`).
- 📴 **Funciona totalmente sin conexión** — toda la app queda precacheada por un service worker; tras la primera visita, el modo avión no cambia nada.
- 🔄 **Actualizaciones transparentes** — las nuevas versiones se detectan en segundo plano y se aplican con un toque en un banner discreto, con un changelog integrado («novedades desde *tu* última versión»).
- 🌍 **7 idiomas** — inglés, francés, español, chino, italiano, neerlandés, alemán. Cada texto, insignia y entrada del changelog.
- 🎓 **Tutorial interactivo de 26 pasos** — una visita guiada en la que *realizas* las acciones reales, dentro de un sandbox que revierte cada cambio al terminar.
- 🏅 **50 insignias y títulos** — 25 desbloqueadas automáticamente por condiciones medidas, 25 autodeclaradas.
- 📊 **Panel de estadísticas** — progreso global, donut de rarezas, compleción por categoría, destacados y una curva de progresión día a día (SVG puro, sin librería de gráficos).
- 🔁 **Copias de seguridad por todas partes** — exportación/importación JSON, un **código de respaldo** comprimido de dispositivo a dispositivo, el mismo código como **QR** escaneable, y una **copia en la nube** opcional (Supabase).
- 🔐 **Bloqueo por PIN, modo lector y cifrado opcional** — un PIN de 4 dígitos (SHA-256), un modo de solo lectura para compartir, y cifrado en reposo opt-in de la colección (PBKDF2 + AES-GCM, derivado del PIN — Web Crypto nativo).
- 🤝 **Herramientas de coleccionista** — listas de faltantes / repetidas / intercambios para llevar a una quedada de cambios.
- 💬 **Feedback integrado** — los usuarios con sesión iniciada envían sugerencias o errores directamente desde Ajustes.

---

## 🛠️ Stack técnico

| Área | Elección |
|---|---|
| Lenguaje | **JavaScript vanilla** (módulos ES nativos), HTML5, CSS3 — sin framework |
| Dependencias en runtime | **Cero.** Sin paquetes npm, sin CDN, sin SDK en ejecución |
| Build | [esbuild](https://esbuild.github.io/) (la *única* devDependency) → un bundle IIFE minificado |
| Offline / PWA | Service Worker escrito a mano (precache versionado, shell cache-first) + Web App Manifest |
| Nube (opcional) | **Supabase por `fetch()` REST puro** — sin SDK; auth por código OTP por e-mail, Row Level Security |
| Cripto | **Web Crypto** nativo — SHA-256 (PIN), PBKDF2 + AES-GCM (cifrado en reposo opcional) |
| Códigos QR | Codificador de un solo archivo vendorizado ([Project Nayuki](https://www.nayuki.io/page/qr-code-generator-library), MIT) |
| Fuentes | WOFF2 autoalojadas (SIL OFL) — ninguna petición a Google Fonts, 5 temas de fuente |
| Tests | **Runner de tests integrado en Node** (`node --test`) — 166 tests, sin framework de test |
| CI | GitHub Actions — tests + build + verificación de frescura del bundle commiteado en cada push/PR |

**Cero dependencias en runtime es una regla de diseño, no una casualidad.** Todo lo que un framework o SDK proporcionaría — renderizado, navegación entre vistas, i18n, caché offline, auth por REST, cifrado, generación de QR — está implementado directamente sobre las API de la plataforma web. La app que instalas es exactamente el código de este repositorio.

---

## 🧗 Retos técnicos

Los problemas que realmente moldearon este código, y cómo se resolvieron:

### Offline-first *y* siempre al día
**Problema:** un service worker cache-first hace la app indestructible sin conexión — y excelente sirviendo código obsoleto para siempre. Las PWA instaladas son las más afectadas: pueden quedar abiertas días sin una navegación, así que el navegador nunca vuelve a comprobar el worker por sí mismo.
**Solución:** el nuevo worker se descarga en segundo plano y se aparca deliberadamente en estado *waiting* (sin `skipWaiting` automático — cambiar el shell bajo una app en marcha es la receta para corromper el estado). La app muestra un banner de un toque «nueva versión — recargar» que lo promociona con un mensaje `SKIP_WAITING`; un banner ignorado se resuelve en el siguiente arranque en frío. Las PWA instaladas llaman además a `registration.update()` al volver al primer plano y cada hora. La versión de la app deriva de la entrada más reciente del changelog: publicar *es* escribir el changelog — versión e historial no pueden divergir.

### Inicio de sesión por e-mail que sobrevive a una PWA instalada
**Problema:** el magic link clásico se rompe en una PWA instalada: el enlace se abre en el navegador por defecto — una partición de almacenamiento distinta — y la sesión aterriza donde la app no está.
**Solución:** la autenticación usa **códigos OTP por e-mail** como vía principal: el código se teclea en la propia app, así que la sesión se crea siempre en el contexto correcto. El magic link queda como bonus en el navegador. Todo el flujo GoTrue (envío, verificación, refresh, margen de expiración) está implementado con `fetch()` puro — sin SDK de Supabase.

### Un service worker que nunca toca la API
**Problema:** un service worker de precache que intercepta todo servirá encantado una respuesta de API desde la caché — un bug silencioso de corrupción de datos que solo aparece en producción.
**Solución:** el worker excluye por completo el origen de Supabase (las peticiones pasan sin interceptar), y las llamadas a la nube envían además `cache: 'no-store'`. Cinturón y tirantes, verificado con tests.

### Un refactor de CSS probado idéntico, byte a byte
**Problema:** migrar cientos de valores de espaciado escritos a mano hacia tokens de diseño con «a mí me parece igual» como única garantía.
**Solución:** sustitución solo por coincidencia exacta (nada de redondear al token más cercano), y después una prueba: resolver cada `var()` de las hojas de estilo anterior y posterior a valores en píxeles y compararlas byte a byte — renderizado matemáticamente idéntico, con los valores fuera de escala intactos e inventariados para una pasada posterior y deliberada.

### Feedback con notificación por e-mail — sin servidor
**Problema:** el mantenedor quiere un e-mail por cada opinión enviada desde la app, pero no hay backend que lo envíe.
**Solución:** un trigger de Postgres sobre la tabla `feedback` llama a la API de Resend mediante `pg_net`, todo dentro de Supabase. La clave de API vive cifrada en el Vault de Supabase (nunca en este repositorio), el contenido del usuario se escapa como HTML, y un e-mail fallido jamás puede bloquear la inserción. En el cliente: un cooldown; en el servidor: un límite SQL (máx. 5/hora por usuario) impuesto por trigger.

### 7 idiomas sin librería de i18n
**Problema:** cada texto visible — interfaz, insignias, tutorial, entradas del changelog, mensajes de error — en 7 idiomas, sin un framework que imponga disciplina.
**Solución:** un pequeño helper `t()` sobre archivos-diccionario, atributos `data-i18n` para el HTML estático, y tests unitarios que fallan si a una entrada del changelog le falta uno solo de los 7 idiomas. El inglés es el fallback declarado; una regla dura del proyecto dice que un texto solo en inglés es un cambio incompleto.

### Probar una app de navegador sin navegador
**Problema:** mantener la promesa de cero dependencias descarta Jest, Vitest y los arneses de navegador headless.
**Solución:** la lógica se factorizó para ser independiente del navegador (cálculo de rareza, migración de almacenamiento, codificación de respaldos, estadísticas, insignias, cifrado, helpers de nube, lógica de actualización…) y está cubierta por **166 tests en el runner integrado de Node** — cero dependencias de test, sin red real (cada test de nube stubbea `fetch`). La CI también reconstruye el bundle y falla si el artefacto commiteado está obsoleto: el código desplegado coincide de forma demostrable con las fuentes.

---

## 🚀 Primeros pasos

Un navegador moderno y cualquier servidor HTTP estático (`file://` no sirve — los módulos ES y el `fetch()` de los JSON quedan bloqueados ahí).

```bash
# Desarrollo — sin build, módulos ES en crudo:
python3 -m http.server 8000
# → http://localhost:8000/index-dev.html

# Bundle de producción:
npm install     # instala esbuild, la única devDependency
npm run build   # app.js → app.bundle.js (minificado + sourcemap)
# → http://localhost:8000/  (index.html)

# Tests:
npm test        # 166 tests, node --test, sin framework
```

### Despliegue

El repositorio se despliega **tal cual** en GitHub Pages (estático, sin build de servidor): todas las URL son relativas, así que la app funciona igual en la raíz de un dominio, bajo un subdirectorio y en localhost. El bundle compilado va commiteado porque Pages no ejecuta ningún paso de npm; la CI verifica que nunca quede obsoleto. Rutina de release: añadir una entrada al changelog (eso *es* el bump de versión) → subir `SW_VERSION` en `sw.js` → build → push. Los visitantes que vuelven reciben el banner de actualización.

---

## ⚖️ Límites asumidos

- **El PIN es una barrera de interfaz, no seguridad fuerte.** Sin el cifrado opcional, la colección es legible en `localStorage` desde las DevTools. Con el cifrado activo, la curiosidad casual queda bloqueada — pero un PIN de 4 dígitos puede forzarse offline si alguien tiene el dispositivo. Protege contra el fisgoneo oportunista, no contra expertos. Un PIN olvidado hace irrecuperable una colección local cifrada — guarda copias de seguridad.
- **El inicio de sesión en la nube corre sobre un dominio de e-mail de prueba.** Los correos de auth y de feedback salen hoy por dominios de envío por defecto/de prueba con límites estrictos — perfecto para un proyecto personal, no entrega de correo de producción. Un SMTP/dominio propio eliminaría esta limitación.
- **El historial de progresión no tiene relleno retroactivo** — la curva de estadísticas empieza el día en que se instaló la función; no existe marca de tiempo por carta para reconstruir el pasado.

---

## 📜 Licencia y marcas

Publicado bajo **licencia MIT** — ver [LICENSE](LICENSE). © 2026 Arthur.

> «F1» y «UNO», junto con los logotipos e imágenes de equipos y pilotos, pertenecen a sus respectivos propietarios. Esta es una herramienta de seguimiento de colección **no oficial** y personal, sin afiliación, respaldo ni patrocinio de la Formula 1, Mattel ni ningún equipo.
