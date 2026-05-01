'use strict';
const fs   = require('fs');
const path = require('path');
const { AttachmentBuilder } = require('discord.js');

// ─────────────────────────────────────────────────────────────────────────────
// 📢 SISTEMA DE POSTULACIONES DIARIAS
//
//  Cada postulación lee su contenido desde PostulacionesData/<key>/
//    • banner.(png|jpg|gif|webp) → imagen enviada primero
//    • mensaje.txt               → texto enviado después
//
//  Los emojis :nombre: se reemplazan por el emoji real del servidor.
//  Canal leído desde process.env[envVar].
// ─────────────────────────────────────────────────────────────────────────────

const DATA_DIR   = path.join(process.cwd(), 'PostulacionesData');
const IMG_EXTS   = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp']);
const DELAY_MS   = 1_500; // pausa entre limpiar y enviar, y entre canales
const BATCH_SIZE = 100;   // máximo por bulkDelete

/** @typedef {{ key: string, envVar: string, label: string }} PostulacionConfig */

/** @type {PostulacionConfig[]} */
const POSTULACIONES = [
    { key: 'lspd',     envVar: 'CANAL_POSTULACION_LSPD',     label: 'LSPD'     },
    { key: 'sams',     envVar: 'CANAL_POSTULACION_SAMS',     label: 'SAMS'     },
    { key: 'ilegales', envVar: 'CANAL_POSTULACION_ILEGALES', label: 'Ilegales' },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────

/** @param {number} ms */
const sleep = ms => new Promise(r => setTimeout(r, ms));

/**
 * Devuelve la ruta al primer archivo de imagen encontrado, o null.
 * @param {string} carpeta
 * @returns {string|null}
 */
function buscarImagen(carpeta) {
    try {
        const archivo = fs.readdirSync(carpeta)
            .find(f => IMG_EXTS.has(path.extname(f).toLowerCase()));
        return archivo ? path.join(carpeta, archivo) : null;
    } catch {
        return null;
    }
}

/**
 * Lee mensaje.txt y devuelve su contenido, o null si no existe.
 * @param {string} carpeta
 * @returns {string|null}
 */
function leerMensaje(carpeta) {
    const ruta = path.join(carpeta, 'mensaje.txt');
    try {
        return fs.existsSync(ruta) ? fs.readFileSync(ruta, 'utf8').trim() : null;
    } catch {
        return null;
    }
}

/**
 * Reemplaza :nombre: por el emoji real del servidor.
 * @param {string} texto
 * @param {import('discord.js').Client} client
 * @returns {string}
 */
function reemplazarEmojis(texto, client) {
    return texto.replace(/:([a-zA-Z0-9_]+):/g, (_match, name) => {
        const emoji = client.emojis.cache.find(
            e => e.name.toLowerCase() === name.toLowerCase()
        );
        return emoji ? emoji.toString() : _match;
    });
}

// ─── LIMPIEZA DE CANAL ───────────────────────────────────────────────────────

/**
 * Elimina todos los mensajes de un canal de forma paginada.
 * Separa recientes (<14d, bulkDelete) de antiguos (delete individual).
 * @param {import('discord.js').TextChannel} canal
 * @param {string} label
 */
async function limpiarCanal(canal, label) {
    const LIMITE_14D = Date.now() - 14 * 24 * 60 * 60 * 1000;
    let total = 0;

    for (let i = 0; i < 20; i++) {           // máximo 20 pasadas como guardia
        const msgs = await canal.messages.fetch({ limit: BATCH_SIZE });
        if (!msgs.size) break;

        const recientes = msgs.filter(m => m.createdTimestamp > LIMITE_14D);
        const antiguos  = msgs.filter(m => m.createdTimestamp <= LIMITE_14D);

        if (recientes.size > 1) {
            await canal.bulkDelete(recientes, true).catch(() => {});
            total += recientes.size;
        } else if (recientes.size === 1) {
            await recientes.first().delete().catch(() => {});
            total += 1;
        }

        for (const [, msg] of antiguos) {
            await msg.delete().catch(() => {});
            total++;
            await sleep(300);
        }

        if (msgs.size < BATCH_SIZE) break;
        await sleep(1_000);
    }

    console.log(`[Postulaciones] 🗑️  ${label}: ${total} mensajes eliminados.`);
}

// ─── PROCESAMIENTO INDIVIDUAL ────────────────────────────────────────────────

/**
 * Limpia el canal y envía banner + texto para una postulación.
 * @param {import('discord.js').Client} client
 * @param {PostulacionConfig} config
 */
async function procesarPostulacion(client, config) {
    const { key, envVar, label } = config;

    const canalId = process.env[envVar];
    if (!canalId) {
        console.warn(`[Postulaciones] ⚠️  ${envVar} no configurado — omitiendo ${label}.`);
        return;
    }

    const canal = await client.channels.fetch(canalId).catch(() => null);
    if (!canal) {
        console.error(`[Postulaciones] ❌ Canal de ${label} no accesible (ID: ${canalId}).`);
        return;
    }

    console.log(`[Postulaciones] 🔄 Procesando ${label}...`);
    await limpiarCanal(canal, label);
    await sleep(DELAY_MS);

    const carpeta = path.join(DATA_DIR, key);

    // Imagen
    const rutaImg = buscarImagen(carpeta);
    if (rutaImg) {
        await canal.send({ files: [new AttachmentBuilder(rutaImg)] }).catch(err =>
            console.error(`[Postulaciones] ❌ Error enviando imagen de ${label}:`, err.message)
        );
    } else {
        console.warn(`[Postulaciones] ⚠️  Sin imagen para ${label} — agrega un archivo en PostulacionesData/${key}/`);
    }

    // Texto
    const textoRaw = leerMensaje(carpeta);
    if (textoRaw) {
        const texto = reemplazarEmojis(textoRaw, client);
        await canal.send({ content: texto }).catch(err =>
            console.error(`[Postulaciones] ❌ Error enviando texto de ${label}:`, err.message)
        );
    } else {
        console.warn(`[Postulaciones] ⚠️  Sin mensaje.txt para ${label}.`);
    }
}

// ─── PUNTO DE ENTRADA ────────────────────────────────────────────────────────

/**
 * Ejecuta el ciclo completo de postulaciones (llamado por el cron en index.js).
 * @param {import('discord.js').Client} client
 */
async function ejecutarPostulacionesDiarias(client) {
    console.log('[Postulaciones] ━━━ Iniciando ciclo diario ━━━');

    for (const config of POSTULACIONES) {
        await procesarPostulacion(client, config);
        await sleep(DELAY_MS);
    }

    console.log('[Postulaciones] ✅ Ciclo diario completado.');
}

module.exports = { ejecutarPostulacionesDiarias };
