const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require("discord.js");
const { checkLSPDAccess } = require("../Functions/permisos");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("aceptar-robo")
        .setDescription("Acepta una solicitud de robo (Solo LSPD)")
        .setDMPermission(false)
        .addStringOption(option =>
            option.setName("hora")
                .setDescription("Hora confirmada para el robo")
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option.setName("disponibles")
                .setDescription("Cantidad de LSPD disponibles")
                .setRequired(true)
        ),

    async execute(interaction) {
        if (!interaction.guild) {
            return interaction.reply({
                content: "❌ Este comando solo puede usarse en un servidor.",
                flags: MessageFlags.Ephemeral
            });
        }

        if (!await checkLSPDAccess(interaction)) return;

        const hora = interaction.options.getString("hora");
        const disponibles = interaction.options.getInteger("disponibles");

        const embed = new EmbedBuilder()
            .setTitle("✅ Robo Aceptado")
            .setColor("#00ff00")
            .setDescription("La LSPD ha aceptado una solicitud de robo.")
            .addFields(
                { name: "Hora Confirmada", value: hora, inline: true },
                { name: "LSPD Disponibles", value: disponibles.toString(), inline: true },
                { name: "Oficial Responsable", value: `<@${interaction.user.id}>`, inline: true }
            )
            .setTimestamp();

        await interaction.channel.send({ embeds: [embed] });

        await interaction.reply({
            content: "✅ Has registrado la aceptación del robo.",
            flags: MessageFlags.Ephemeral
        });
    }
};
