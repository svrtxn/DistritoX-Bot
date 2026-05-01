const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, MessageFlags } = require("discord.js");
const config = require("../Config/config");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("agregar-persona")
        .setDescription("Agrega a un usuario al canal actual (Solo Staff)")
        .addUserOption(option =>
            option.setName("usuario")
                .setDescription("El usuario que deseas agregar")
                .setRequired(true)
        ),

    async execute(interaction) {
        // Verificar si el usuario tiene alguno de los roles permitidos
        const hasPermission = config.roles.staffAdmin.some(roleId => interaction.member.roles.cache.has(roleId));

        if (!hasPermission) {
            return interaction.reply({
                content: "❌ No tienes los permisos necesarios para usar este comando.",
                flags: MessageFlags.Ephemeral
            });
        }

        const targetUser = interaction.options.getUser("usuario");
        const channel = interaction.channel;

        try {
            // Editar permisos del canal para el usuario seleccionado
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
