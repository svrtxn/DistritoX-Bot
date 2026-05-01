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

        const embedAceptado = EmbedBuilder.from(embedOriginal)
            .setColor("#00ff00")
            .setTitle("✅ Solicitud Aceptada")
            .addFields({ name: "Aceptado por", value: `<@${interaction.user.id}>`, inline: true })
            .setTimestamp();

        // Actualizar el mensaje eliminando los botones
        await interaction.update({
            embeds: [embedAceptado],
            components: []
        });

        // Opcional: Notificar al solicitante (si quieres enviarle un DM o algo, pero por ahora solo actualizamos el embed)
    }
};
