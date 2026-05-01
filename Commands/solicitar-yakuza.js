const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require("discord.js");
const config = require("../Config/config");
const { checkJefeBandaAccess } = require("../Functions/permisos");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("solicitar-yakuza")
        .setDescription("Solicita una compra a los Yakuza (Solo Jefes de Banda)")
        .setDMPermission(false)
        .addStringOption(option =>
            option.setName("pedido")
                .setDescription("Lo que deseas comprar")
                .setRequired(true)
        ),

    async execute(interaction) {
        if (!interaction.guild) {
            return interaction.reply({
                content: "❌ Este comando solo puede usarse en un servidor.",
                flags: MessageFlags.Ephemeral
            });
        }

        if (!await checkJefeBandaAccess(interaction)) return;

        const pedido = interaction.options.getString("pedido");
        const canalYakuzaId = config.canales.yakuza;
        const canalYakuza = interaction.guild.channels.cache.get(canalYakuzaId);

        if (!canalYakuza) {
            return interaction.reply({
                content: "❌ El canal de Yakuza no está configurado o no es accesible.",
                flags: MessageFlags.Ephemeral
            });
        }

        const embed = new EmbedBuilder()
            .setTitle("🏮 Nueva Solicitud de Compra")
            .setColor("#ff0000")
            .addFields(
                { name: "Solicitante", value: `<@${interaction.user.id}>`, inline: true },
                { name: "Pedido", value: pedido }
            )
            .setTimestamp()
            .setFooter({ text: "Sistema de Pedidos Yakuza" });

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId("aceptar_yakuza")
                    .setLabel("Aceptar Pedido")
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId("rechazar_yakuza")
                    .setLabel("Rechazar Pedido")
                    .setStyle(ButtonStyle.Danger)
            );

        await canalYakuza.send({
            content: `<@&${config.roles.yakuza}> hay un nuevo pedido.`,
            embeds: [embed],
            components: [row]
        });

        await interaction.reply({
            content: `✅ Tu solicitud ha sido enviada al canal de Yakuza (<#${canalYakuzaId}>).`,
            flags: MessageFlags.Ephemeral
        });
    }
};
