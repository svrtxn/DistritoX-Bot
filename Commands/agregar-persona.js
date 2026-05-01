const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require("discord.js");
const { checkStaffAccess } = require("../Functions/permisos");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("agregar-persona")
        .setDescription("Agrega a un usuario al canal actual (Solo Staff Mod+)")
        .setDMPermission(false)
        .addUserOption(option =>
            option.setName("usuario")
                .setDescription("El usuario que deseas agregar")
                .setRequired(true)
        ),

    async execute(interaction) {
        if (!interaction.guild) {
            return interaction.reply({
                content: "❌ Este comando solo puede usarse en un servidor.",
                flags: MessageFlags.Ephemeral
            });
        }

        if (!await checkStaffAccess(interaction)) return;

        const targetUser = interaction.options.getUser("usuario");
        const channel = interaction.channel;

        try {
            await channel.permissionOverwrites.edit(targetUser.id, {
                ViewChannel: true,
                SendMessages: true,
                ReadMessageHistory: true
            });

            const embed = new EmbedBuilder()
                .setTitle("✅ Usuario Agregado")
                .setColor("#00ff00")
                .setDescription(`El usuario ${targetUser} ha sido agregado correctamente a este canal.`)
                .addFields(
                    { name: "Agregado por", value: `<@${interaction.user.id}>`, inline: true },
                    { name: "Canal", value: `${channel}`, inline: true }
                )
                .setTimestamp()
                .setFooter({ text: "Distrito Bot - Control de Acceso" });

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error("Error al agregar usuario al canal:", error);
            await interaction.reply({
                content: "❌ Hubo un error al intentar agregar al usuario al canal. Asegúrate de que el bot tenga permisos de 'Administrar Canal'.",
                flags: MessageFlags.Ephemeral
            });
        }
    }
};
