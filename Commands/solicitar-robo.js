const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require("discord.js");
const config = require("../Config/config");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("solicitar-robo")
        .setDescription("Solicita un robo a la LSPD (Solo Jefes de Banda)")
        .addStringOption(option =>
            option.setName("tipo")
                .setDescription("Tipo de robo (Ej: Fleeca, Joyería, etc.)")
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option.setName("personas")
                .setDescription("Cantidad de personas involucradas")
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName("hora")
                .setDescription("Hora en la que desean realizarlo (Ej: 18:30)")
                .setRequired(true)
        ),

    async execute(interaction) {
        if (!interaction.member.roles.cache.has(config.roles.jefeBanda)) {
            return interaction.reply({
                content: "❌ Solo los Jefes de Banda pueden usar este comando.",
                flags: MessageFlags.Ephemeral
            });
        }

        const tipo = interaction.options.getString("tipo");
        const personas = interaction.options.getInteger("personas");
        const hora = interaction.options.getString("hora");
        const canalLSPDId = config.canales.lspd;
        const canalLSPD = interaction.guild.channels.cache.get(canalLSPDId);

        if (!canalLSPD) {
            return interaction.reply({
                content: "❌ El canal de LSPD no está configurado correctamente.",
                flags: MessageFlags.Ephemeral
            });
        }

        const embed = new EmbedBuilder()
            .setTitle("🚨 Solicitud de Robo Entrante")
            .setColor("#0000ff") // Azul LSPD
            .addFields(
                { name: "Solicitante", value: `<@${interaction.user.id}>`, inline: true },
                { name: "Tipo de Robo", value: tipo, inline: true },
                { name: "Personas", value: personas.toString(), inline: true },
                { name: "Hora Propuesta", value: hora, inline: true }
            )
            .setTimestamp()
            .setFooter({ text: "Sistema de Alertas LSPD" });

        // Para LSPD el usuario pidió comandos /aceptar y /rechazar, pero pondré botones para facilidad.
        // Igualmente crearé los comandos slash como pidió.
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId("aceptar_robo_btn")
                    .setLabel("Aceptar Robo")
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId("rechazar_robo_btn")
                    .setLabel("Rechazar Robo")
                    .setStyle(ButtonStyle.Danger)
            );

        await canalLSPD.send({
            content: `<@&${config.roles.lspd}> hay una nueva solicitud de robo.`,
            embeds: [embed],
            components: [row]
        });

        await interaction.reply({
            content: `✅ Solicitud de robo enviada a la LSPD (<#${canalLSPDId}>).`,
            flags: MessageFlags.Ephemeral
        });
    }
};
