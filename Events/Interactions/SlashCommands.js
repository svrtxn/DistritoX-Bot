const { ChatInputCommandInteraction, MessageFlags } = require('discord.js');

module.exports = {
    name: 'interactionCreate',

    /**
     * @param {*} interaction 
     * @param {*} client 
     */
    async execute(interaction, client) {
        const developerIds = ["321441044384186369", "373679434584031232"];

        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) {
                return interaction.reply({
                    content: '❌ Comando no encontrado.',
                    flags: MessageFlags.Ephemeral
                });
            }

            // Restricción para desarrollador
            if (command.developer && !developerIds.includes(interaction.user.id)) {
                return interaction.reply({
                    content: '❌ Solo los desarrolladores pueden usar este comando.',
                    flags: MessageFlags.Ephemeral
                });
            }

            try {
                await command.execute(interaction, client);
            } catch (err) {
                // Ignorar error 10062 (interacción expirada)
                if (err?.code === 10062) {
                    console.warn(`[WARN] Comando '${interaction.commandName}' expiró antes de responder (10062).`);
                    return;
                }
                console.error(`❌ Error al ejecutar comando '${interaction.commandName}':`, err);
                try {
                    if (interaction.replied || interaction.deferred) {
                        await interaction.followUp({ content: '❌ Ocurrió un error al ejecutar el comando.', flags: MessageFlags.Ephemeral });
                    } else {
                        await interaction.reply({ content: '❌ Ocurrió un error al ejecutar el comando.', flags: MessageFlags.Ephemeral });
                    }
                } catch (_) { /* interacción ya no disponible al reportar error */ }
            }
        }

        else if (interaction.isButton()) {
            const button = client.buttons.get(interaction.customId);
            if (!button) {
                // Silenciar error ya que los tickets se manejan en otro archivo
                return;
            }

            try {
                await button.execute(interaction, client);
            } catch (err) {
                // Ignorar error 10062 (interacción expirada)
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
