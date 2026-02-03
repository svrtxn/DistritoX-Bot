const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require("discord.js");
const { checkSancionesAccess } = require("../Functions/permisos");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("sancion")
        .setDescription("Registro formal de sanción administrativa.")
        .setDMPermission(false)
        .addUserOption(option =>
            option.setName("usuario").setDescription("Ciudadano a sancionar").setRequired(true)
        )
        .addStringOption(option =>
            option.setName("tipo").setDescription("Tipo de sanción (Ej: Ban, Advertencia)").setRequired(true)
        )
        .addStringOption(option =>
            option.setName("motivos").setDescription("Separa los motivos con un |").setRequired(true)
        ),

    async execute(interaction) {
        const CANAL_ANUNCIOS = process.env.CANAL_SANCIONES;
        const ROL_A_MENCIONAR = "1072389181843722250";

        if (!interaction.guild) return;

        // Verificación de permisos (Sistema de Rangos)
        if (!checkSancionesAccess(interaction)) return;

        const usuario = interaction.options.getUser("usuario");
        const tipo = interaction.options.getString("tipo");
        const motivosRaw = interaction.options.getString("motivos");
        const canal = interaction.guild.channels.cache.get(CANAL_ANUNCIOS);

        if (!canal) {
            return interaction.reply({
                content: "❌ **Error:** Canal de registros no configurado correctamente.",
                flags: [MessageFlags.Ephemeral]
            });
        }

        const motivosFormateados = motivosRaw
            .split("|")
            .map(m => `• ${m.trim()}`)
            .join("\n");

        const embedSancion = new EmbedBuilder()
            .setTitle(`REGISTRO DE SANCIÓN`)
            .setColor(0x2b2d31)
            .addFields(
                { name: "Usuario", value: `<@${usuario.id}>`, inline: true },
                { name: "Sanción", value: `\`${tipo}\``, inline: true },
                { name: "Motivo", value: `\`\`\`\n${motivosFormateados}\n\`\`\``, inline: false }
            )
            .setFooter({
                text: 'DistritoX',
                iconURL: interaction.guild.iconURL()
            })
            .setTimestamp();

        try {
            await canal.send({
                content: `|| <@&${ROL_A_MENCIONAR}> ||`,
                embeds: [embedSancion]
            });

            await interaction.reply({
                content: "✅ **Expediente registrado con éxito.**",
                flags: [MessageFlags.Ephemeral]
            });
        } catch (error) {
            console.error("Error al enviar el log:", error);
            await interaction.reply({
                content: "❌ No se pudo enviar la ficha. Revisa los permisos del bot en el canal.",
                flags: [MessageFlags.Ephemeral]
            });
        }
    }
};