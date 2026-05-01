const path = require('path');
const fs = require('fs');
const { MessageFlags } = require('discord.js');

// ─────────────────────────────────────────────────────────────
// 🚀 CACHÉ DE TICKETS/BOTONES — Cargado UNA SOLA VEZ al inicio
//    Evita llamar a fs.readdirSync() en cada interacción,
//    lo cual bloqueaba el event loop causando "missed execution"
//    en node-cron y errores 10062 en cascada.
// ─────────────────────────────────────────────────────────────
const ticketsFolder = path.join(__dirname, '../Tickets');

/** @type {Map<string, string>} nombre_sin_extension → ruta_absoluta */
const ticketCache = new Map();

function recargarTicketCache() {
    ticketCache.clear();
    try {
        const archivos = fs.readdirSync(ticketsFolder);
        for (const archivo of archivos) {
            if (archivo.endsWith('.js')) {
                const clave = archivo.slice(0, -3).toLowerCase(); // nombre sin .js, en minúsculas
                ticketCache.set(clave, path.join(ticketsFolder, archivo));
            }
        }
        console.log(`[Tickets] Caché cargada: ${ticketCache.size} archivo(s).`);
    } catch (err) {
        console.error('[Tickets] Error al cargar caché de tickets:', err);
    }
}

// Carga inicial
recargarTicketCache();

// ─────────────────────────────────────────────────────────────

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {

        // ────────── MENÚ DE SELECCIÓN DE TICKET ──────────
        if (interaction.isStringSelectMenu()) {
            if (interaction.customId !== 'ticket_select') return;

            const selectedValue = interaction.values[0];

            // Verificar que la interacción no haya expirado (límite Discord: 3 seg)
            if (interaction.createdTimestamp < Date.now() - 2500) {
                console.warn(`[WARN] Interacción de menú '${selectedValue}' expirada, descartando.`);
                return;
            }

            // Buscar en caché (sin I/O síncrona)
            const ticketPath = ticketCache.get(selectedValue.toLowerCase());

            if (!ticketPath) {
                console.warn(`[WARN] Ticket '${selectedValue}' no encontrado en caché. Se recargará la caché.`);
                recargarTicketCache();
                return interaction.reply({ content: '❌ Este ticket no está disponible.', flags: MessageFlags.Ephemeral }).catch(() => {});
            }

            let ticket;
            try {
                delete require.cache[require.resolve(ticketPath)];
                ticket = require(ticketPath);
            } catch (loadErr) {
                console.error(`[Tickets] Error cargando módulo '${ticketPath}':`, loadErr);
                return interaction.reply({ content: '❌ Error interno al cargar el ticket.', flags: MessageFlags.Ephemeral }).catch(() => {});
            }

            try {
                await ticket.execute(interaction);
            } catch (err) {
                if (err?.code === 10062) {
                    console.warn(`[WARN] Interacción de menú '${selectedValue}' expiró antes de responder (10062).`);
                    return;
                }
                console.error(`[Tickets] Error ejecutando menú '${selectedValue}':`, err);
                try {
                    if (interaction.replied || interaction.deferred) {
                        await interaction.followUp({ content: '❌ Ocurrió un error al abrir el ticket.', flags: MessageFlags.Ephemeral });
                    } else {
                        await interaction.reply({ content: '❌ Ocurrió un error al abrir el ticket.', flags: MessageFlags.Ephemeral });
                    }
                } catch (_) { /* interacción ya expirada al intentar reportar */ }
            }
        }

        // ────────── BOTONES ──────────
        if (interaction.isButton()) {
            const buttonId = interaction.customId;

            // Verificar que la interacción no haya expirado (límite Discord: 3 seg)
            if (interaction.createdTimestamp < Date.now() - 2500) {
                console.warn(`[WARN] Interacción de botón '${buttonId}' expirada, descartando.`);
                return;
            }

            // Buscar en caché (sin I/O síncrona)
            const buttonPath = ticketCache.get(buttonId.trim().toLowerCase());

            if (!buttonPath) {
                // Puede ser un botón manejado en otro lugar (ej: SlashCommands.js), no crashear
                return;
            }

            let buttonModule;
            try {
                delete require.cache[require.resolve(buttonPath)];
                buttonModule = require(buttonPath);
            } catch (loadErr) {
                console.error(`[Tickets] Error cargando módulo de botón '${buttonPath}':`, loadErr);
                return interaction.reply({ content: '❌ Error interno al cargar el botón.', flags: MessageFlags.Ephemeral }).catch(() => {});
            }

            try {
                await buttonModule.execute(interaction);
            } catch (err) {
                if (err?.code === 10062) {
                    console.warn(`[WARN] Botón '${buttonId}' expiró antes de responder (10062).`);
                    return;
                }
                console.error(`[Tickets] Error ejecutando botón '${buttonId}':`, err);
                try {
                    if (interaction.replied || interaction.deferred) {
                        await interaction.followUp({ content: '❌ Ocurrió un error al ejecutar el botón.', flags: MessageFlags.Ephemeral });
                    } else {
                        await interaction.reply({ content: '❌ Ocurrió un error al ejecutar el botón.', flags: MessageFlags.Ephemeral });
                    }
                } catch (_) { /* interacción ya expirada al intentar reportar */ }
            }
        }
        // ────────── MODALS ──────────
        if (interaction.isModalSubmit()) {
            const modalId = interaction.customId;

            // Para el modal de aceptar robo específicamente (o generalizar)
            if (modalId === 'modal_aceptar_robo') {
                const hora = interaction.fields.getTextInputValue('hora_confirmada');
                const disponibles = interaction.fields.getTextInputValue('lspd_disponibles');

                const { EmbedBuilder } = require('discord.js');
                const config = require('../Config/config');

                const embedOriginal = interaction.message.embeds[0];
                const embedAceptado = EmbedBuilder.from(embedOriginal)
                    .setColor("#00ff00")
                    .setTitle("✅ Robo Aceptado")
                    .addFields(
                        { name: "Hora Confirmada", value: hora, inline: true },
                        { name: "LSPD Disponibles", value: disponibles, inline: true },
                        { name: "Aceptado por", value: `<@${interaction.user.id}>`, inline: true }
                    )
                    .setTimestamp();

                await interaction.update({
                    embeds: [embedAceptado],
                    components: []
                });
            }
        }
    }
};

