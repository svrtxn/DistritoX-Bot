const { ChatInputCommandInteraction } = require('discord.js');

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
                    ephemeral: true
                });
            }

            // Restricción para desarrollador
            if (command.developer && !developerIds.includes(interaction.user.id)) {
                return interaction.reply({
                    content: '❌ Solo los desarrolladores pueden usar este comando.',
                    ephemeral: true
                });
            }

            try {
                await command.execute(interaction, client);
            } catch (err) {
                console.error(`❌ Error al ejecutar comando: ${err}`);
                return interaction.reply({
                    content: '❌ Ocurrió un error al ejecutar el comando.',
                    ephemeral: true
                });
            }
        }

        else if (interaction.isButton()) {
            const button = client.buttons.get(interaction.customId);
            if (!button) {
                console.error(`❌ Botón no encontrado: ${interaction.customId}`);
                return;
            }

            try {
                await button.execute(interaction, client);
            } catch (err) {
                console.error(`❌ Error al ejecutar botón: ${err}`);
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({
                        content: '❌ Ocurrió un error al ejecutar la acción del botón.',
                        ephemeral: true
                    });
                } else {
                    await interaction.reply({
                        content: '❌ Ocurrió un error al ejecutar la acción del botón.',
                        ephemeral: true
                    });
                }
            }
        }
    }
};
