const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require("discord.js");
const { checkLSPDAccess } = require("../Functions/permisos");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("rechazar-robo")
        .setDescription("Rechaza una solicitud de robo (Solo LSPD)")
        .setDMPermission(false)
        .addStringOption(option =>
            option.setName("motivo")
                .setDescription("Motivo del rechazo (opcional)")
                .setRequired(false)
        ),

    async execute(interaction) {
        if (!interaction.guild) {
            return interaction.reply({
                content: "❌ Este comando solo puede usarse en un servidor.",
                flags: MessageFlags.Ephemeral
            });
        }

        if (!await checkLSPDAccess(interaction)) return;

        const motivo = interaction.options.getString("motivo") || "No especificado";

        const embed = new EmbedBuilder()
            .setTitle("❌ Robo Rechazado")
            .setColor("#ff0000")
            .setDescription("La LSPD ha rechazado la solicitud de robo.")
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

