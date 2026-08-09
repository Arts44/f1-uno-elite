[🇬🇧 English](README.md) · [🇫🇷 Français](README.fr.md) · 🇪🇸 **Español** · [🇨🇳 中文](README.zh.md) · [🇮🇹 Italiano](README.it.md) · [🇳🇱 Nederlands](README.nl.md) · [🇩🇪 Deutsch](README.de.md)

# 🏎️ F1 UNO Élite — Collection Tracker

**Un gestor de colección de cartas instalable y offline-first, construido con JavaScript vanilla y cero dependencias en tiempo de ejecución — sin framework, sin SDK, sin CDN, sin backend.**

[| Visita guiada — cinco capítulos, uno por página | Las cinco familias de foil, en el nivel atenuado |
|---|---|
| ![Visita guiada — cinco capítulos, uno por página](screenshots/tutorial-chapter.jpg) | ![Las cinco familias de foil, en el nivel atenuado](screenshots/foil-family.jpg) |

![tests](https://github.com/Arts44/f1-uno-elite/actions/workflows/tests.yml/badge.svg)](https://github.com/Arts44/f1-uno-elite/actions/workflows/tests.yml)
![License: MIT](https://img.shields.io/badge/license-MIT-green)
![PWA](https://img.shields.io/badge/PWA-installable%20%2B%20offline%20%E2%9C%93-brightgreen)
![Zero runtime deps](https://img.shields.io/badge/runtime%20dependencies-0-blue)
![Vanilla JS](https://img.shields.io/badge/JavaScript-vanilla-f7df1e?logo=javascript&logoColor=black)
![i18n](https://img.shields.io/badge/languages-7-purple)

## ▶️ **[Pruébala en vivo → arts44.github.io/f1-uno-elite](https://arts44.github.io/f1-uno-elite/)**

Es una **PWA**: instálala desde tu navegador y funciona como una app nativa, totalmente sin conexión, con su propio icono — en escritorio y en móvil.

![Cuadrícula de colección — tema oscuro](screenshots/grid-desktop-dark.jpg)

| Ficha de carta — tipos foil animados | Panel de estadísticas |
|---|---|
| ![Modal de carta](screenshots/modal-dark.jpg) | ![Vista de estadísticas](screenshots/stats-light.jpg) |

<sub>Más capturas en [`screenshots/`](screenshots/) — temas claro y oscuro, escritorio y móvil.</sub>

### ✨ En movimiento

| Añadido rápido — un toque, un ejemplar | Navegación con píldora | Insignias — 120, siete familias |
|---|---|---|
| ![Demo añadido rápido](screenshots/demo-quick-add.gif) | ![Demo navegación](screenshots/demo-nav.gif) | ![Demo insignias](screenshots/demo-badges.gif) |


### Novedades 1.29 — la pasada v2

| Insignias — familias, progreso, objetivo fijado | Detalle de insignia — fecha de desbloqueo, cartas contributivas |
|---|---|
| ![Insignias — familias, progreso, objetivo fijado](screenshots/badges-dark.jpg) | ![Detalle de insignia — fecha de desbloqueo, cartas contributivas](screenshots/badges-detail.jpg) |

| Cuenta — nube, copias, zona de peligro | Ajustes — la tarjeta de seguridad |
|---|---|
| ![Cuenta — nube, copias, zona de peligro](screenshots/account-dark.jpg) | ![Ajustes — la tarjeta de seguridad](screenshots/settings-dark.jpg) |

| Desbloqueo con PIN — segmentado y enmascarado | Código por correo — el mismo componente compartido |
|---|---|
| ![Desbloqueo con PIN — segmentado y enmascarado](screenshots/pin-screen.jpg) | ![Código por correo — el mismo componente compartido](screenshots/otp-input.jpg) |

| Trazados de circuitos — rehechos desde datos GPS reales | Insignias — tema claro |
|---|---|
| ![Trazados de circuitos — rehechos desde datos GPS reales](screenshots/circuit-gp.jpg) | ![Insignias — tema claro](screenshots/badges-light.jpg) |

![Navegación inferior — la pastilla y su muesca se mueven como una sola pieza](screenshots/nav-bead.jpg)

<sub>Localizado en 7 idiomas — cada texto, insignia y entrada del registro</sub>

| Rareza Eterna — campeones con set completo | Añadido rápido — selector de variantes |
|---|---|
| ![Rareza Eterna — campeones con set completo](screenshots/i18n/eternal-tile.es.jpg) | ![Añadido rápido — selector de variantes](screenshots/i18n/quick-add.es.jpg) |

| Donut de rarezas con Eterna | Aviso Deshacer |
|---|---|
| ![Donut de rarezas con Eterna](screenshots/i18n/stats-rarity.es.jpg) | ![Aviso Deshacer](screenshots/i18n/toast.es.jpg) |

---

## ✨ Qué hace

Seguir una colección completa de cartas **F1 UNO Élite** — 101 cartas, cada una en hasta 16 variantes (colores base, foils, duales, Wild, Nitro, promos):

- 📇 **Gestión completa de la colección** — en propiedad / repetidas / wishlist / favoritas, cantidades por variante, toda la colección siempre a la vista.
- ➕ **Añadido rápido con un gesto** — un botón + en cada casilla abre un selector de variantes: un toque añade un ejemplar, con aviso «Deshacer». La cabecera de la página Colección muestra tu progreso en vivo: una barra más poseídas / que faltan / repetidas.
- ✨ **Sistema de rareza animado de 7 niveles** — `epic → legendary → mythic → ultra → cosmic → divine → eternal`, calculado a partir de la mejor variante en propiedad, +1 nivel cuando la serie está completa (todas las variantes en propiedad) — `eternal` solo se alcanza así. Las cartas foil llevan barridos de luz animados, `divine` se muestra como un degradado iridiscente y `eternal` en negro y oro centelleante (todo respetando `prefers-reduced-motion`).
- 📴 **Funciona totalmente sin conexión** — toda la app queda precacheada por un service worker; tras la primera visita, el modo avión no cambia nada.
- 🔄 **Actualizaciones transparentes** — las nuevas versiones se detectan en segundo plano y se aplican con un toque, con un changelog integrado que muestra qué ha cambiado desde *tu* última versión.
- 🌍 **7 idiomas** — inglés, francés, español, chino, italiano, neerlandés, alemán. Cada texto, insignia y entrada del changelog.
- 🎓 **Tutorial interactivo, 28 pasos en 5 capítulos** — un capítulo por página, en el orden de las pestañas. Una visita guiada donde *realizas* las acciones reales, en un entorno aislado que revierte todos los cambios al terminar.
- 🏅 **Una página de insignias que cuenta tu colección** — 120 insignias en 7 familias: trayectoria, sets completos, foils, colores, pasión y experiencias vividas que validas tú mismo. Un anillo de progreso con tu título, una tarjeta *Próxima insignia* que destaca siempre la más cercana — o el objetivo que fijaste —, una escalera de hitos de 1 a 101 cartas, las fechas de desbloqueo y una celebración de verdad cuando cae una: aviso agrupado, vibración breve y estallido en la ficha. Tu tarjeta de coleccionista se exporta como imagen para compartir.
- 📊 **Panel de estadísticas** — progreso global, donut de rarezas, completitud por categoría, momentos destacados, una curva de progreso día a día (SVG puro, sin librería de gráficos) y las herramientas de coleccionista como pestañas internas: listas de faltantes, repetidas e intercambios.
- 👤 **Una página Cuenta dedicada** — inicio de sesión en la nube por código de correo, copia/restauración, exportación/importación JSON, transferencia por QR, opiniones integradas y una zona de peligro con tres alcances de borrado, cada uno protegido por una palabra que hay que escribir. En modo espectador toda la página se sustituye por un estado bloqueado: los controles están ausentes, no desactivados.
- 🔁 **Copias de seguridad por todas partes** — exportación/importación JSON, un código de respaldo comprimido de dispositivo a dispositivo, el mismo código como QR escaneable, y copia en la nube opcional.
- 🔐 **Bloqueo con PIN, modo espectador y cifrado opcional** — un PIN de 4 dígitos en un teclado segmentado (cada dígito visible un instante y luego enmascarado), recorridos guiados para crearlo/cambiarlo/desactivarlo con progreso visible, un modo de solo lectura para compartir y cifrado en reposo opcional de la colección (PBKDF2 + AES-GCM, derivado del PIN).
- 🧭 **Una barra de navegación con pastilla** — la píldora, su muesca y la pastilla son un único trazado SVG recalculado fotograma a fotograma desde un solo reloj de animación, así que nunca se desincronizan. Arrastrable, accesible por teclado y respeta `prefers-reduced-motion`.

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
| Fuentes | WOFF2 autoalojadas (SIL OFL) — ninguna petición a Google Fonts, 5 temas a elegir |
| Tests | **Runner de tests integrado en Node** (`node --test`) — 519 tests, sin framework de test |
| CI | GitHub Actions — tests + build + verificación de frescura del bundle commiteado en cada push/PR |

**Cero dependencias en runtime es una regla de diseño, no una casualidad.** Todo lo que un framework o SDK proporcionaría — renderizado, navegación entre vistas, i18n, caché offline, auth por REST, cifrado, generación de QR — está construido directamente sobre las API de la plataforma web. La app que instalas es exactamente el código de este repositorio.

---

## 🧱 La arquitectura en breve

El código es un conjunto de **módulos ES** enfocados tras un único punto de entrada, `app.js`, empaquetados por esbuild en un `app.bundle.js` commiteado (GitHub Pages no ejecuta ningún paso de build). Dos puntos de entrada HTML comparten todo lo demás: `index-dev.html` carga los módulos en crudo para desarrollo, `index.html` carga el bundle.

| Capa | Módulos |
|---|---|
| Estado y datos | `storage.js` (localStorage, por temporada, migración v1→v2), `data.js`, `history.js` |
| Interfaz | `render.js` (cuadrícula, filtros, ficha de carta), `stats.js`, `badges.js`, `pin.js` (ajustes) |
| Plataforma | `sw.js` (precache), `update.js` (actualizaciones), `install.js`, `secure-store.js` |
| Nube opcional | `cloud.js`, `feedback.js`, `settings-sync.js` — todos en REST puro |

Las acciones pasan por **un único listener delegado** sobre `[data-action]` en lugar de manejadores en línea — que es también lo que hace posible el modo lector, ya que un solo conjunto `VIEWER_BLOCKED` bloquea toda escritura. El texto de interfaz nunca aparece en el código: pasa por `t()` sobre diccionarios que cubren los 7 idiomas.

### La forma del proyecto

Cuatro scripts clásicos publican globales `window.__*` antes que los módulos; todo lo demás es un módulo ES tras un único punto de entrada.

```mermaid
flowchart TB
  subgraph BOOT["Arranque"]
    H["index.html"] --> C["translations.js<br/>card-descriptions.js<br/>data-embedded.js<br/>cloud-config.js"]
    H --> B["app.bundle.js"]
  end
  B --> APP["app.js"]
  APP --> UI
  APP --> ST
  APP --> PL
  subgraph UI["Vistas"]
    R["render.js"]; S["stats.js"]; BG["badges.js"]; PN["pin.js"]; AC["account.js"]; TU["tutorial.js"]; PH["pagehead.js"]; IC["icons.js"]
  end
  subgraph ST["Estado"]
    STO["storage.js"]; DA["data.js"]; HI["history.js"]; SEC["secure-store.js"]; I18["i18n.js"]
  end
  subgraph PL["Plataforma"]
    SW["sw.js"]; UP["update.js"]; IN["install.js"]; BK["backup.js"]
  end
  subgraph CL["Nube opcional"]
    CLO["cloud.js"]; FB["feedback.js"]; SS["settings-sync.js"]
  end
  ST --> CL
  STO --> SEC
```


---

## 🧗 Retos técnicos

Los problemas que realmente moldearon este código:

### Offline-first *y* siempre al día
Un service worker cache-first hace la app indestructible sin conexión — y excelente sirviendo código obsoleto indefinidamente. Las PWA instaladas son las más afectadas: pueden quedar abiertas días sin una navegación, así que el navegador nunca vuelve a comprobar el worker.
**Solución:** el nuevo worker se descarga en segundo plano y se aparca deliberadamente en estado *waiting* (sin `skipWaiting` automático — cambiar el shell bajo una app en marcha es la receta para corromper el estado). Un banner lo promociona con un toque mediante `SKIP_WAITING`; un banner ignorado se resuelve en el siguiente arranque en frío. Las PWA instaladas llaman además a `registration.update()` al volver al primer plano y cada hora. La versión de la app deriva de la entrada más reciente del changelog: publicar *es* escribir el changelog.

### Inicio de sesión por e-mail que sobrevive a una PWA instalada
El magic link clásico se rompe en una PWA instalada: el enlace se abre en el navegador por defecto — una partición de almacenamiento distinta — y la sesión aterriza donde la app no está.
**Solución:** la autenticación usa **códigos OTP por e-mail** como vía principal, tecleados en la propia app, así que la sesión se crea siempre en el contexto correcto. Todo el flujo GoTrue está implementado con `fetch()` puro.

### Un service worker que nunca toca la API
Un service worker de precache que intercepta todo servirá encantado una respuesta de API desde la caché — un bug silencioso de corrupción de datos que solo aparece en producción.
**Solución:** el worker excluye por completo el origen de Supabase, y las llamadas a la nube envían además `cache: 'no-store'`.

### Un refactor de CSS probado idéntico, byte a byte
Migrar cientos de valores de espaciado escritos a mano hacia tokens, con «a mí me parece igual» como única garantía.
**Solución:** sustitución solo por coincidencia exacta, y después una prueba — resolver cada `var()` de ambas hojas de estilo a píxeles y compararlas byte a byte. Una pasada posterior nombró los medios pasos recurrentes en vez de redondear 61 declaraciones solo por pureza de escala.

### Feedback con notificación por e-mail — sin servidor
**Solución:** un trigger de Postgres sobre la tabla `feedback` llama a la API de Resend mediante `pg_net`, todo dentro de Supabase. La clave de API vive cifrada en el Vault, el contenido del usuario se escapa como HTML desde SQL, y el trigger se traga sus propios fallos (`exception when others`): un e-mail fallido jamás puede bloquear la inserción. Un **segundo trigger aplica el límite real de frecuencia en la base de datos** — cinco opiniones por usuario y hora, lanzadas como `rate_limited` — y la app traduce ese error a un código tipado. La espera del lado cliente es una cortesía; la protección está en el servidor.

### Probar una app de navegador sin navegador
Mantener la promesa de cero dependencias descarta Jest, Vitest y los arneses de navegador headless.
**Solución:** la lógica se factorizó para ser independiente del navegador y está cubierta por **519 tests en el runner integrado de Node** — sin dependencias de test, sin red real. La CI también reconstruye el bundle y falla si el artefacto commiteado está obsoleto.

---

### Qué cubren las pruebas — y qué no

519 pruebas sobre el ejecutor integrado de Node, sin framework. Ser preciso sobre el límite importa más que el número:

- **Cubierto:** migraciones de almacenamiento y esquema de claves por temporada; la escala de rareza de siete niveles, incluido el ascenso por set completo; todas las condiciones de insignia y el modelo de dificultad; las listas del coleccionista (que faltan, repetidas, intercambio); los ciclos de codificación de los códigos de copia; los ayudantes de nube contra un `fetch` simulado, incluidos los caminos de fallo; la paridad de claves i18n en los 7 idiomas y la detección de duplicados; la precaché del service worker frente al grafo real de importaciones; los contratos de marcado del acceso por teclado; la procedencia de cada `innerHTML` alimentado desde fuera; el contraste WCAG AA en ambos temas.
- **No cubierto:** el renderizado real (ninguna aserción DOM más allá de cadenas de marcado), el comportamiento del service worker en ejecución, llamadas de red reales, IndexedDB, los avisos de instalación, y todo lo que exija un motor de navegador — eso se verifica a mano y con la pasada determinista de capturas, no con la suite. El porcentaje de cobertura no se publica a propósito: mediría la parte sin navegador y se leería como si midiera la aplicación.

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

npm test        # 519 tests, node --test, sin framework
```

**Despliegue.** El repositorio se despliega tal cual en GitHub Pages: todas las URL son relativas, así que la app funciona igual en la raíz de un dominio, bajo un subdirectorio y en localhost. Rutina de release: añadir una entrada al changelog (eso *es* el bump de versión) → subir `SW_VERSION` → build → push.

---

## ⚖️ Límites asumidos

- **El PIN es una barrera de interfaz, no seguridad fuerte.** Sin el cifrado opcional, la colección es legible en `localStorage` desde las DevTools. Con el cifrado activo, la curiosidad casual queda bloqueada — pero un PIN de 4 dígitos puede forzarse offline si alguien tiene el dispositivo. Un PIN olvidado hace irrecuperable una colección local cifrada.
- **Las notificaciones de opinión salen del dominio de pruebas de Resend** (`onboarding@resend.dev`). Desde ese dominio, Resend solo entrega a la dirección del propietario de la cuenta: la notificación llega al mantenedor y a nadie más. Enviar desde otro sitio exigiría poseer y verificar un dominio. Es un límite asumido, no un defecto: la opinión se guarda en la base de datos en cualquier caso, y un envío fallido nunca la bloquea.
- **Los códigos de acceso viajan por un proveedor SMTP configurado en Supabase** — una cadena totalmente distinta de las notificaciones anteriores. La entrega, las cuotas y la reputación del remitente dependen de ese proveedor y este repositorio no las mide; considera los correos de acceso como «en la medida de lo posible» para un proyecto personal.
- **El historial de progresión no tiene relleno retroactivo** — la curva de estadísticas empieza el día en que se instaló la función.
- **La nota de Codacy es B, y sigue siendo B a propósito.** Tres de los cuatro objetivos de calidad están en verde: 0 issues abiertas, 4 % de duplicación y 62,72 % de cobertura frente a un umbral del 60 %. El cuarto no lo está — 13 de los 30 archivos fuente analizados superan el umbral de complejidad. Ese umbral es ajustable, y subirlo pondría la cifra en verde sin cambiar una línea de código; no se ha subido, porque cuatro de esos archivos hacen realmente demasiado. Los dos más pesados son `badges.js` y `cloud.js`. Dividirlos es el próximo trabajo — es lo que separa al proyecto de la exportación de lista de intercambio, y del soporte multitemporada. Una salvedad sobre la métrica en sí: cuenta *archivos*, por lo que penaliza una arquitectura hecha de pocos módulos grandes — el mismo código repartido en 300 archivos pasaría sin cambiar una línea. Es un hecho sobre la medición, no una excusa: los cuatro módulos densos lo son de verdad, y son ellos los que el refactor apunta.

---

## 🔩 Notas de ingeniería

Cero dependencias en ejecución (solo esbuild, al compilar); cero desplazamiento de diseño, medido al píxel entre versiones; el añadido rápido perfilado y optimizado (~300 ms → ~45 ms en un móvil medio); cifrado local opcional ligado al PIN (PBKDF2 + AES-GCM); modo espectador bloqueado en la lógica, no en CSS; capturas regeneradas por un script determinista versionado; 519 tests en JS vanilla con el runner integrado de Node. Detalles completos en el [README inglés](README.md).

---

## ☕ Apoyar al desarrollador

Un único enlace saliente, en **Ajustes → Acerca de**, lleva a [Ko-fi](https://ko-fi.com/arts44). Apoya **a mí, el desarrollador** — no a la app ni a su universo. Ningún script de terceros, ningún píxel de seguimiento, ningún dato personal sale del dispositivo: es un `<a target="_blank" rel="noopener noreferrer">` y nada más. La URL vive en una constante única (`SUPPORT_URL` en `pin.js`); vaciarla hace desaparecer la fila. Sin conexión, la fila queda visiblemente inerte en vez de llevar a una página muerta.

**Nada se desbloquea al donar** — ninguna función, ninguna insignia, ningún nombre en una lista. Una donación que comprara algo sería una compra, y este proyecto sigue siendo un proyecto de fan no comercial.

---

## 📜 Licencia y marcas

Publicado bajo **licencia MIT** — ver [LICENSE](LICENSE). © 2026 Arthur — [@Arts44](https://github.com/Arts44).

> **Proyecto de fan no oficial, sin ánimo de lucro.** «F1» y «UNO», junto con los logotipos e imágenes de equipos y pilotos, pertenecen a sus respectivos propietarios. Esta herramienta no está afiliada, respaldada ni patrocinada por la Formula 1, Mattel ni ningún equipo.
