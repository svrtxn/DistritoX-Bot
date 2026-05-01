'use strict';
require('dotenv').config();

// ─── SEGURIDAD GLOBAL ────────────────────────────────────────────────────────
// Evita que el bot se caiga por errores no capturados en cualquier módulo.
process.on('uncaughtException',  err => console.error('[FATAL] UncaughtException:', err));
process.on('unhandledRejection', err => console.error('[FATAL] UnhandledRejection:', err));

// ─── DEPENDENCIAS ────────────────────────────────────────────────────────────
const cron      = require('node-cron');
const mongoose  = require('mongoose');
const { Client, GatewayIntentBits, Partials, Collection, ActivityType } = require('discord.js');

const { loadEvents }   = require('./Handlers/eventHandler');
const { loadCommands } = require('./Handlers/commandHandler');
const { loadButtons }  = require('./Handlers/buttonHandler');
const { ejecutarPostulacionesDiarias } = require('./Functions/postulacionesDiarias');
const Transaccion = require('./Models/transaccion');

// ─── DASHBOARD (opcional) ────────────────────────────────────────────────────
let startDashboard = null;
try {
    startDashboard = require('./Dashboard/server');
} catch {
    console.warn('[Dashboard] Carpeta Dashboard no encontrada — omitiendo.');
}

// ─── CLIENTE DISCORD ─────────────────────────────────────────────────────────
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates,
    ],
    partials: [
        Partials.User,
        Partials.Message,
        Partials.GuildMember,
        Partials.ThreadMember,
    ],
});

client.events   = new Collection();
client.commands = new Collection();
client.buttons  = new Collection();

// ─── CRON: RECORDATORIOS DE RENOVACIÓN ──────────────────────────────────────
/**
 * Busca transacciones mensuales próximas a vencer y avisa al usuario
 * por el canal del ticket o por DM como respaldo.
 */
function iniciarCronRenovaciones() {
    cron.schedule('* * * * *', async () => {
        const ahora      = new Date();
        const fechaLimite = new Date(ahora.getTime() + 3 * 24 * 60 * 60 * 1000);

        let porVencer;
        try {
            porVencer = await Transaccion.find({
                tipo: 'INGRESO',
                esMensual: true,
                recordatorioEnviado: false,
                fechaRenovacion: { $gte: ahora, $lte: fechaLimite },
            }).lean();  // .lean() → objetos JS simples, más rápido que documentos Mongoose
        } catch (err) {
            console.error('[Cron:Renovaciones] Error consultando DB:', err.message);
            return;
        }

        if (!porVencer.length) return;
        console.log(`[Cron:Renovaciones] ${porVencer.length} renovación(es) próxima(s).`);

        for (const pago of porVencer) {
            await enviarRecordatorio(pago);
        }
    });
}

/**
 * @param {object} pago — documento de transacción (lean)
 */
async function enviarRecordatorio(pago) {
    const fechaStr = new Date(pago.fechaRenovacion).toLocaleDateString('es-ES');
    let enviado = false;

    if (pago.canalId) {
        try {
            const canal = await client.channels.fetch(pago.canalId);
            await canal.send({
                content: `📢 <@${pago.usuarioId}> **¡Recordatorio de Renovación!**\n\nTu suscripción (**${pago.categoria}**) vence el **${fechaStr}**.\nPor favor, gestiona tu pago para evitar cortes en el servicio. 🗓️`,
            });
            enviado = true;
        } catch {
            console.warn(`[Cron:Renovaciones] Canal ${pago.canalId} no accesible. Intentando DM...`);
        }
    }

    if (!enviado) {
        try {
            const usuario = await client.users.fetch(pago.usuarioId);
            await usuario.send({
                content: `👋 Hola **${usuario.username}**, recordatorio de **Distrito X**.\n\n⚠️ Tu suscripción vence el **${fechaStr}**.`,
            });
            enviado = true;
        } catch (err) {
            console.error(`[Cron:Renovaciones] No se pudo enviar DM a ${pago.usuarioId}:`, err.message);
        }
    }

    if (enviado) {
        // Actualizar solo el campo necesario — más eficiente que pago.save()
        await Transaccion.updateOne({ _id: pago._id }, { $set: { recordatorioEnviado: true } });
    }
}

// ─── CRON: POSTULACIONES DIARIAS ────────────────────────────────────────────
/**
 * Todos los días a las 17:30 Chile limpia los canales de postulación
 * y reenvía banner + texto predefinido.
 */
function iniciarCronPostulaciones() {
    cron.schedule('30 17 * * *', () => {
        ejecutarPostulacionesDiarias(client).catch(err =>
            console.error('[Cron:Postulaciones] Error:', err.message)
        );
    }, { timezone: 'America/Santiago' });

    console.log('[Postulaciones] ⏰ Cron configurado — se ejecuta a las 17:30 (America/Santiago).');
}

// ─── ARRANQUE ────────────────────────────────────────────────────────────────
(async () => {
    // 1. Base de datos
    try {
        mongoose.set('bufferCommands', false);
        await mongoose.connect(process.env.MONGO_URL, { serverSelectionTimeoutMS: 5000 });
        console.log('[DB] ✅ Conectado a MongoDB.');
    } catch (err) {
        console.error('[DB] ❌ No se pudo conectar a MongoDB:', err.message);
        // Continuar — el bot puede operar sin DB en modo degradado
    }

    // 2. Cargar manejadores
    await loadEvents(client);
    await loadButtons(client);

    // 3. Login
    await client.login(process.env.DISCORD_TOKEN);

    // 4. Ready
    client.once('ready', async () => {
        await loadCommands(client);
        console.log(`[Bot] ✅ Iniciado como ${client.user.tag}`);

        client.user.setActivity('DistritoX', { type: ActivityType.Watching });

        // Dashboard
        if (startDashboard) {
            try { startDashboard(client); }
            catch (err) { console.warn('[Dashboard] No se pudo iniciar:', err.message); }
        }

        // Cron jobs
        iniciarCronRenovaciones();
        iniciarCronPostulaciones();
    });
})();