const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require("discord.js");
const config = require("../Config/config");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("rechazar-robo")
        .setDescription("Rechaza una solicitud de robo (Solo LSPD)")
        .addStringOption(option =>
            option.setName("motivo")
                .setDescription("Motivo del rechazo (opcional)")
                .setRequired(false)
        ),

    async execute(interaction) {
        if (!interaction.member.roles.cache.has(config.roles.lspd)) {
            return interaction.reply({
                content: "❌ Solo miembros de la LSPD pueden usar este comando.",
                flags: MessageFlags.Ephemeral
            });
        }

        const motivo = interaction.options.getString("motivo") || "No especificado";

        const embed = new EmbedBuilder()
            .setTitle("❌ Robo Rechazado")
            .setColor("#ff0000")
            .setDescription(`La LSPD ha rechazado la solicitud de robo.`)
            .addFields(
                { name: "Motivo", value: motivo },
                { name: "Oficial Responsable", value: `<@${interaction.user.id}>` }
            )
            .setTimestamp();

        await interaction.channel.send({ embeds: [embed] });
        
        await interaction.reply({
            content: "✅ Has registrado el rechazo del robo.",
            flags: MessageFlags.Ephemeral
        });
    }
};
