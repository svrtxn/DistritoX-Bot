const { EmbedBuilder, MessageFlags } = require("discord.js");
const config = require("../Config/config");

module.exports = {
    async execute(interaction) {
        if (!interaction.member.roles.cache.has(config.roles.lspd)) {
            return interaction.reply({
                content: "❌ Solo miembros de la LSPD pueden responder a esta solicitud.",
                flags: MessageFlags.Ephemeral
            });
        }

        const embedOriginal = interaction.message.embeds[0];
        if (!embedOriginal) return;

        const embedRechazado = EmbedBuilder.from(embedOriginal)
            .setColor("#ff0000")
            .setTitle("❌ Robo Rechazado")
            .addFields({ name: "Rechazado por", value: `<@${interaction.user.id}>`, inline: true })
            .setTimestamp();

        await interaction.update({
            embeds: [embedRechazado],
            components: []
        });
    }
};
