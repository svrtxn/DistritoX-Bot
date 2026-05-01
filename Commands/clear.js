const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder,
    MessageFlags
} = require('discord.js');
const { checkBotAccess } = require("../Functions/permisos");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Eliminar mensajes del canal')
        .setDMPermission(false) // Evita que el comando se ejecute en DMs
        .addIntegerOption(option =>
            option.setName('cantidad')
                .setDescription('Cantidad de mensajes a eliminar')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(99)
        )
        .addUserOption(option =>
            option.setName('usuario')
                .setDescription('Usuario del que se eliminarán los mensajes')
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    async execute(interaction) {
        // Validación de servidor
        if (!interaction.guild) {
            return interaction.reply({
                content: "❌ Este comando solo puede usarse en un servidor.",
                flags: MessageFlags.Ephemeral
            });
        }

        // Verificación de permiso STAFF
        if (!await checkBotAccess(interaction)) return;

        const cantidad = interaction.options.getInteger('cantidad');
        const usuario = interaction.options.getUser('usuario');

        try {
            // Limitar el fetch a lo necesario: si se filtra por usuario traemos más para tener margen
            const fetchLimit = usuario ? Math.min(cantidad * 3, 100) : Math.min(cantidad + 1, 100);
            const mensajes = await interaction.channel.messages.fetch({ limit: fetchLimit });
            let mensajesEliminados;

            if (usuario) {
                let i = 0;
                mensajesEliminados = mensajes.filter((message) => {
                    if (message.author.id === usuario.id && i < cantidad) {
                        i++;
                        return true;
                    }
                    return false;
                });
            } else {
                mensajesEliminados = mensajes.first(cantidad);
            }

            const eliminados = await interaction.channel.bulkDelete(mensajesEliminados, true);


            await interaction.reply({
                content: usuario
                    ? `✅ Se han eliminado ${eliminados.size} mensajes del usuario **${usuario.tag}**.`
                    : `✅ Se han eliminado ${eliminados.size} mensajes.`,
                flags: MessageFlags.Ephemeral
            });

            const logChannel = await interaction.guild.channels.fetch('1402480570604453930').catch(() => null);

            if (logChannel) {
                const embed = new EmbedBuilder()
                    .setColor('Red')
                    .setTitle('🗑️ Mensajes eliminados')
                    .addFields(
                        { name: 'Canal', value: `<#${interaction.channel.id}>`, inline: true },
                        { name: 'Ejecutor', value: `<@${interaction.user.id}>`, inline: true },
                        { name: 'Cantidad eliminada', value: `${eliminados.size}`, inline: true },
                        { name: 'Objetivo', value: usuario ? usuario.tag : 'Todos', inline: true }
                    )
                    .setTimestamp();

                await logChannel.send({ embeds: [embed] });
            }

        } catch (err) {
            console.error(err);

            if (!interaction.replied) {
                await interaction.reply({
                    content: '❌ Hubo un error al eliminar los mensajes.',
                    flags: MessageFlags.Ephemeral
                });
            } else {
                await interaction.followUp({
                    content: '❌ Hubo un error al eliminar los mensajes.',
                    flags: MessageFlags.Ephemeral
                });
            }
        }
    }
};
