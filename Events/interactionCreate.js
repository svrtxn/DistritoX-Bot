const fs = require('fs');
const path = require('path');
const { MessageFlags } = require('discord.js');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {

        // ────────── MENÚ DE SELECCIÓN DE TICKET ──────────
        if (interaction.isStringSelectMenu()) {
            if (interaction.customId !== 'ticket_select') return;

            const selectedValue = interaction.values[0];
            const ticketsFolder = path.join(__dirname, '../Tickets');

            const ticketFile = fs.readdirSync(ticketsFolder)
                .find(file => file === `${selectedValue}.js`);

            if (!ticketFile) {
                return interaction.reply({ content: '❌ Este ticket no está disponible.', flags: MessageFlags.Ephemeral });
            }

            const ticketPath = path.join(ticketsFolder, ticketFile);
            delete require.cache[require.resolve(ticketPath)];
            const ticket = require(ticketPath);

            try {
                await ticket.execute(interaction);
            } catch (err) {
                console.error(err);
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: '❌ Ocurrió un error al abrir el ticket.', flags: MessageFlags.Ephemeral });
                } else {
                    await interaction.reply({ content: '❌ Ocurrió un error al abrir el ticket.', flags: MessageFlags.Ephemeral });
                }
            }
        }

        if (interaction.isButton()) {
            const buttonId = interaction.customId;
            const buttonsFolder = path.join(__dirname, '../Tickets');
            const files = fs.readdirSync(buttonsFolder);

            console.log(`[DEBUG] Buscando botón: '${buttonId}'`);

            // Búsqueda insensible a mayúsculas y espacios
            const buttonFile = files.find(file => file.toLowerCase() === `${buttonId.trim().toLowerCase()}.js`);

            if (!buttonFile) {
                console.error(`❌ Botón no encontrado en disco: ${buttonId}.js`);
                // Si ya se respondió antes (raro en este punto), evitar crash
                if (!interaction.replied && !interaction.deferred) {
                    return interaction.reply({ content: `❌ Botón no encontrado: ${buttonId}`, flags: MessageFlags.Ephemeral });
                }
                return;
            }

            const buttonPath = path.join(buttonsFolder, buttonFile);
            delete require.cache[require.resolve(buttonPath)];
            const buttonModule = require(buttonPath);

            try {
                await buttonModule.execute(interaction);
            } catch (err) {
                console.error(`Error ejecutando botón ${buttonId}:`, err);
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: '❌ Ocurrió un error al ejecutar el botón.', flags: MessageFlags.Ephemeral });
                } else {
                    await interaction.reply({ content: '❌ Ocurrió un error al ejecutar el botón.', flags: MessageFlags.Ephemeral });
                }
            }
        }
    }
};
