const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { checkBotAccess } = require("../Functions/permisos");
const { ejecutarPostulacionesDiarias } = require("../Functions/postulacionesDiarias");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('limpiar-postulaciones')
        .setDescription('Limpia manualmente los canales de postulaciones y reenvía los mensajes.')
        .setDMPermission(false),

    async execute(interaction) {
        if (!interaction.guild) {
            return interaction.reply({
                content: "❌ Este comando solo puede usarse en un servidor.",
                flags: MessageFlags.Ephemeral
            });
        }

        if (!await checkBotAccess(interaction)) return;

        // Diferir respuesta porque la limpieza y reenvío toma tiempo por los delays configurados
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        try {
            await ejecutarPostulacionesDiarias(interaction.client);

            await interaction.editReply({
                content: '✅ Canales de postulación limpiados y actualizados correctamente.'
            });
        } catch (error) {
            console.error("[limpiar-postulaciones] Error:", error);
            await interaction.editReply({
                content: '❌ Hubo un error al ejecutar la limpieza de postulaciones.'
            });
        }
    }
};
