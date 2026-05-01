const { EmbedBuilder, MessageFlags } = require("discord.js");
const config = require("../Config/config");

module.exports = {
    async execute(interaction) {
        // Verificar si el usuario tiene el rol de Yakuza
        if (!interaction.member.roles.cache.has(config.roles.yakuza)) {
            return interaction.reply({
                content: "❌ Solo los miembros de Yakuza pueden responder a esta solicitud.",
                flags: MessageFlags.Ephemeral
            });
        }

        const embedOriginal = interaction.message.embeds[0];
        if (!embedOriginal) return;

        const embedRechazado = EmbedBuilder.from(embedOriginal)
            .setColor("#ff0000")
            .setTitle("❌ Solicitud Rechazada")
            .addFields({ name: "Rechazado por", value: `<@${interaction.user.id}>`, inline: true })
            .setTimestamp();

        // Actualizar el mensaje eliminando los botones
        await interaction.update({
            embeds: [embedRechazado],
            components: []
        });
    }
};
