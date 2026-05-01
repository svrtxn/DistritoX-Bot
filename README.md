# 🤖 DistritoX Bot

Bot oficial de [Discord](https://discord.com) para el servidor **DistritoX** — construido con [Discord.js v14](https://discord.js.org/) y [MongoDB](https://www.mongodb.com/).

---

## 📦 Stack Tecnológico

| Tecnología | Uso |
|-----------|-----|
| `discord.js v14` | Interfaz con la API de Discord |
| `mongoose` | Modelos y persistencia en MongoDB |
| `node-cron` | Tareas programadas (renovaciones, postulaciones) |
| `canvas` | Generación de imágenes de bienvenida |
| `discord-html-transcripts` | Transcripciones HTML de tickets cerrados |
| `express` | Dashboard web (opcional) |
| `dotenv` | Gestión de variables de entorno |
| `glob` | Carga dinámica de comandos y eventos |

---

## 🗂️ Estructura del Proyecto

```
DistritoX-Bot/
├── Commands/               # Comandos slash (auto-cargados)
│   └── finanzas/           # Subgrupo de comandos de finanzas
├── Tickets/                # Handlers de botones de tickets y acciones
├── Events/
│   ├── Client/             # Eventos generales del cliente (ready, voiceState)
│   ├── Bienvenida/         # Evento guildMemberAdd (imagen de bienvenida)
│   └── Interactions/       # Despacho de slash commands y botones
├── Handlers/               # Cargadores de comandos, eventos y botones
├── Functions/
│   ├── permisos.js         # Sistema centralizado de acceso por roles
│   ├── logger.js           # Logs de comandos en canal de Discord
│   └── postulacionesDiarias.js  # Ciclo diario de postulaciones
├── Models/
│   └── transaccion.js      # Esquema Mongoose de transacciones financieras
├── PostulacionesData/       # Contenido editable de postulaciones diarias
│   ├── lspd/
│   │   ├── banner.png      ← Agregar imagen aquí
│   │   └── mensaje.txt     ← Editar texto aquí
│   ├── sams/
│   │   ├── banner.png
│   │   └── mensaje.txt
│   └── ilegales/
│       ├── banner.png
│       └── mensaje.txt
├── Static/                 # Archivos estáticos (fuentes, imágenes de fondo)
├── Dashboard/              # Dashboard web Express (opcional)
├── .env                    # Variables de entorno (NO subir a git)
├── .gitignore
├── index.js                # Punto de entrada del bot
└── package.json
```

---

## ⚙️ Instalación y Configuración

### 1. Requisitos
- Node.js **≥ 18.0.0**
- Una cuenta de MongoDB (Atlas o local)
- Un bot de Discord con los intents activados: `Guilds`, `GuildMembers`, `GuildMessages`, `GuildVoiceStates`

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar el `.env`

Copia el `.env` de ejemplo y completa todos los valores:

```env
# ─── BOT ───────────────────────────────────────────────────────
DISCORD_TOKEN=tu_token_aqui
MONGO_URL=mongodb+srv://usuario:pass@cluster.mongodb.net/

# ─── JERARQUÍA DE RANGOS STAFF (Mayor → Menor) ─────────────────
ROL_OWNER=
ROL_JEFESTAFF=
ROL_DEVELOPER=
ROL_ENCARGADO_AREA=
ROL_ADMIN=
ROL_MOD_AREA=
ROL_MOD=
ROL_STAFF=

# ─── RANGOS SIN ACCESO (solo referencia) ───────────────────────
ROL_SOPORTE=
ROL_SOPORTE_PRUEBAS=

# ─── ENCARGADOS DE ÁREA ────────────────────────────────────────
ENC_STREAMERS=
ENC_SS=
ENC_DISCORD=
ENC_VIP=
ENC_ILEGALES=
ENC_LSPD=
ENC_SAMS=
ENC_GM=
ENC_NEGOCIOS=

# ─── ROLES ROLEPLAY ────────────────────────────────────────────
ROL_LSPD=
ROL_JEFEBANDA=
ROL_YAKUZA=

# ─── CANALES DE TEXTO ──────────────────────────────────────────
CANAL_ANUNCIOS=
CANAL_SANCIONES=
CANAL_DONACIONES=
CANAL_BIENVENIDA=
CANAL_YAKUZA=
CANAL_LSPD=

# ─── CANALES DE VOZ ────────────────────────────────────────────
CANAL_CREADOR_VOZ=

# ─── CANALES DE LOGS ───────────────────────────────────────────
LOGS_DISTRITOX=
LOGS_TICKETS_CANAL=
LOGS_REPORTE_STAFF=
LOGS_COMANDOS=

# ─── CANALES DE POSTULACIONES DIARIAS ──────────────────────────
CANAL_POSTULACION_LSPD=
CANAL_POSTULACION_SAMS=
CANAL_POSTULACION_ILEGALES=

# ─── CANALES DE VOZ ────────────────────────────────────────────
CANAL_CREADOR_VOZ=

# ─── CATEGORÍAS ────────────────────────────────────────────────
BOT_CATEGORIA=
DONACIONES_CATEGORIA=
SOPORTE_CATEGORIA=
REPORTES_CATEGORIA=
REPORTES_STAFF_CATEGORIA=
POSTULACIONES_CATEGORIA=
POSTULACION_STAFF=
LOCALES_CATEGORIA=
```

### 4. Iniciar el bot

```bash
# Producción
npm start

# Desarrollo (auto-restart con Node.js --watch, no requiere nodemon)
npm run dev
```

---

## 🔐 Sistema de Permisos (`Functions/permisos.js`)

El sistema de permisos es centralizado. Cada comando usa uno de estos checkers:

| Checker | Acceso |
|---------|--------|
| `checkDeveloperAccess` | OWNER · JEFESTAFF · DEVELOPER |
| `checkSancionesAccess` | OWNER · JEFESTAFF · DEVELOPER · ADMIN |
| `checkFinanzasAccess`  | OWNER · JEFESTAFF · ENC_VIP |
| `checkBotAccess` | MOD+ · todos los ENC_* |
| `checkStaffAccess` | STAFF+ · todos los ENC_* (más permisivo) |
| `checkLSPDAccess` | Solo `ROL_LSPD` |
| `checkJefeBandaAccess` | Solo `ROL_JEFEBANDA` |

Los checkers son **async**. Siempre usar con `await`:

```js
if (!await checkBotAccess(interaction)) return;
```

---

## 📋 Logs de Comandos (`Functions/logger.js`)

Cada ejecución de un slash command genera un embed en el canal `LOGS_COMANDOS`.

| Estado | Color | Cuándo |
|--------|-------|--------|
| ✅ Ejecutado | Verde | Sin errores |
| ❌ Error | Rojo | Excepción durante la ejecución |
| 🚫 Sin permisos | Amarillo | Rango insuficiente |

El log incluye: usuario + ID, canal, top 3 roles, argumentos usados y nota de error.

---

## 📢 Postulaciones Diarias (`Functions/postulacionesDiarias.js`)

Todos los días a las **17:30 (hora Chile / America/Santiago)** el bot:

1. **Limpia** todos los mensajes de cada canal de postulación.
2. **Envía la imagen** del banner (si existe).
3. **Envía el texto** del `mensaje.txt`.

### Editar el contenido

Cada organización tiene su carpeta en `PostulacionesData/`:

| Carpeta | Canal configurado en `.env` |
|---------|---------------------------|
| `lspd/` | `CANAL_POSTULACION_LSPD` |
| `sams/` | `CANAL_POSTULACION_SAMS` |
| `ilegales/` | `CANAL_POSTULACION_ILEGALES` |

**Para editar:**
1. Abre `PostulacionesData/<organización>/mensaje.txt` y edita el texto.
2. Reemplaza el archivo de imagen (cualquier nombre `.png/.jpg/.gif/.webp`).
3. Guarda — el bot lo tomará en el próximo ciclo automáticamente.

**Emojis custom:** usa `:nombre_del_emoji:` — el bot los reemplaza por el emoji real del servidor.

---

## 🎟️ Sistema de Tickets

Los tickets se crean desde el panel (`/ticket-panel`) y se manejan en la carpeta `Tickets/`.

| Tipo | Handler |
|------|---------|
| Soporte | `ticket_soporte.js` |
| Donación | `ticket_donacion.js` |
| Reporte | `ticket_reporte.js` |
| Reporte Staff | `ticket_reporte_staff.js` |
| Postulación Staff | `ticket_staff.js` |
| Postulación Streamer | `ticket_streamer.js` |
| Banda/Org Ilegal | `ticket_banda.js` |
| Local/Negocio | `ticket_local.js` |

Al cerrar un ticket con el botón **Cerrar**, el bot:
1. Genera una transcripción HTML del canal.
2. Envía el log al canal correspondiente (`LOGS_TICKETS_CANAL` o `LOGS_REPORTE_STAFF`).
3. Elimina el canal tras 5 segundos.



## ⏰ Cron Jobs

| Cron | Frecuencia | Acción |
|------|-----------|--------|
| Recordatorios de renovación | Cada minuto | Busca suscripciones próximas a vencer (≤3 días) y avisa al usuario por canal o DM |
| Postulaciones diarias | 17:30 America/Santiago | Limpia y reenvía contenido en canales de postulación |

---

## 🧱 Principios de Arquitectura

- **SRP** — Cada archivo tiene una única responsabilidad (permisos, logs, postulaciones, etc.)
- **OCP** — Agregar nuevos comandos/tickets/eventos no requiere modificar el core
- **Fail-safe** — Ningún error detiene el bot gracias a los handlers globales y try/catch locales
- **Centralización** — Permisos, logs y configuración siempre desde un único punto de verdad

---

## 🚫 .gitignore recomendado

```gitignore
node_modules/
.env
*.log
```
