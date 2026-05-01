const { ChatInputCommandInteraction, MessageFlags } = require('discord.js');
const { logComando } = require('../../Functions/logger');

module.exports = {
    name: 'interactionCreate',

    /**
     * @param {ChatInputCommandInteraction} interaction
     * @param {*} client
     */
    async execute(interaction, client) {
        const developerIds = ["321441044384186369", "373679434584031232"];

        // ────────── SLASH COMMANDS ──────────
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);

            if (!command) {
                await logComando(interaction, 'error', 'Comando no registrado en el cliente.');
                return interaction.reply({
                    content: '❌ Comando no encontrado.',
                    flags: MessageFlags.Ephemeral
                });
            }

            // Restricción para desarrollador
            if (command.developer && !developerIds.includes(interaction.user.id)) {
                await logComando(interaction, 'denied', 'Intento de usar comando exclusivo de Developer.');
                return interaction.reply({
                    content: '❌ Solo los desarrolladores pueden usar este comando.',
                    flags: MessageFlags.Ephemeral
                });
            }

            try {
                await command.execute(interaction, client);
                // Log exitoso — se envía después de que el comando termine sin error
                await logComando(interaction, 'success');
            } catch (err) {
                // Ignorar error 10062 (interacción expirada)
                if (err?.code === 10062) {
                    console.warn(`[WARN] Comando '${interaction.commandName}' expiró antes de responder (10062).`);
                    return;
                }

                console.error(`❌ Error al ejecutar comando '${interaction.commandName}':`, err);
                await logComando(interaction, 'error', err.message ?? String(err));

                try {
                    if (interaction.replied || interaction.deferred) {
                        await interaction.followUp({ content: '❌ Ocurrió un error al ejecutar el comando.', flags: MessageFlags.Ephemeral });
                    } else {
                        await interaction.reply({ content: '❌ Ocurrió un error al ejecutar el comando.', flags: MessageFlags.Ephemeral });
                    }
                } catch (_) { /* interacción ya no disponible al reportar error */ }
            }
        }

        // ────────── BOTONES ──────────
        else if (interaction.isButton()) {
            const button = client.buttons.get(interaction.customId);
            if (!button) {
                // Silenciar error — los tickets se manejan en interactionCreate.js separado
                return;
            }

            try {
                await button.execute(interaction, client);
            } catch (err) {
                if (err?.code === 10062) {
                    console.warn(`[WARN] Botón '${interaction.customId}' expiró antes de responder (10062).`);
                    return;
                }
                console.error(`❌ Error al ejecutar botón '${interaction.customId}':`, err);
                try {
                    if (interaction.replied || interaction.deferred) {
                        await interaction.followUp({ content: '❌ Ocurrió un error al ejecutar la acción del botón.', flags: MessageFlags.Ephemeral });
                    } else {
                        await interaction.reply({ content: '❌ Ocurrió un error al ejecutar la acción del botón.', flags: MessageFlags.Ephemeral });
                    }
                } catch (_) { /* interacción ya no disponible al reportar error */ }
            }
        }
    }
};
