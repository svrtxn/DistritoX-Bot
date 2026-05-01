const { EmbedBuilder, MessageFlags, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require("discord.js");
const config = require("../Config/config");

module.exports = {
    async execute(interaction) {
        if (!interaction.member.roles.cache.has(config.roles.lspd)) {
            return interaction.reply({
                content: "❌ Solo miembros de la LSPD pueden responder a esta solicitud.",
                flags: MessageFlags.Ephemeral
            });
        }

        // Para aceptar, necesitamos los datos que el usuario pidió: Hora y Cantidad LSPD.
        // Usaremos un Modal para pedir estos datos.
        const modal = new ModalBuilder()
            .setCustomId('modal_aceptar_robo')
            .setTitle('Aceptar Solicitud de Robo');

        const horaInput = new TextInputBuilder()
            .setCustomId('hora_confirmada')
            .setLabel("Hora confirmada")
            .setPlaceholder("Ej: 19:00")
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const lspdInput = new TextInputBuilder()
            .setCustomId('lspd_disponibles')
            .setLabel("LSPD Disponibles")
            .setPlaceholder("Ej: 5")
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        modal.addComponents(
            new ActionRowBuilder().addComponents(horaInput),
            new ActionRowBuilder().addComponents(lspdInput)
        );

        await interaction.showModal(modal);
    }
};
