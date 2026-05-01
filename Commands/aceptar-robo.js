const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require("discord.js");
const config = require("../Config/config");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("aceptar-robo")
        .setDescription("Acepta una solicitud de robo (Solo LSPD)")
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
        if (!interaction.member.roles.cache.has(config.roles.lspd)) {
            return interaction.reply({
                content: "❌ Solo miembros de la LSPD pueden usar este comando.",
                flags: MessageFlags.Ephemeral
            });
        }

        const hora = interaction.options.getString("hora");
        const disponibles = interaction.options.getInteger("disponibles");

        const embed = new EmbedBuilder()
            .setTitle("✅ Robo Aceptado")
            .setColor("#00ff00")
            .setDescription(`La LSPD ha aceptado una solicitud de robo.`)
            .addFields(
                { name: "Hora Confirmada", value: hora, inline: true },
                { name: "LSPD Disponibles", value: disponibles.toString(), inline: true },
                { name: "Oficial Responsable", value: `<@${interaction.user.id}>`, inline: true }
            )
            .setTimestamp();

        // Enviamos al canal actual (que debería ser el de LSPD)
        await interaction.channel.send({ embeds: [embed] });
        
        await interaction.reply({
            content: "✅ Has registrado la aceptación del robo.",
            flags: MessageFlags.Ephemeral
        });
    }
};
