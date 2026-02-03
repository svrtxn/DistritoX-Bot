const { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, Client } = require('discord.js');
const { loadCommands } = require('../../Handlers/commandHandler');
const { loadEvents } = require('../../Handlers/eventHandler');
const { execute } = require('../sancion');

module.exports = {
    developer: true,
    data: new SlashCommandBuilder()
        .setName('reload')
        .setDescription('Recarga los comandos y eventos del bot.')
        .setDMPermission(false) // Evita que el comando se ejecute en DMs
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand((option) => option.setName('commands').setDescription('Recargar los comandos del bot.'))
        .addSubcommand((option) => option.setName('events').setDescription('Recargar los eventos del bot.')),

    /**
     * 
     * @param {ChatInputCommandInteraction} interaction
     * @param {Client} client
     */

    execute: async (interaction, client) => {
        const subCommand = interaction.options.getSubcommand();

        switch (subCommand) {
            case 'events':
                for (const [key, value] of client.events) {
                    client.removeListener(`${key}`, value, true);
                    loadEvents(client);
                    interaction.reply({
                        content: '✅ Eventos recargados correctamente.',
                        ephemeral: true
                    });
                }
                break;

            case 'commands':
                loadCommands(client);
                interaction.reply({
                    content: '✅ Comandos recargados correctamente.',
                    ephemeral: true
                });
                break;
        }
    }
};
