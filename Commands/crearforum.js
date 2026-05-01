const {
    SlashCommandBuilder,
    ChannelType,
    PermissionFlagsBits,
    MessageFlags
} = require('discord.js');
const { checkBotAccess } = require('../Functions/permisos');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('crearforum')
        .setDescription('Crea un canal de tipo foro.')
        .setDMPermission(false)
        .addStringOption(option =>
            option.setName('nombre')
                .setDescription('Nombre del canal de foro')
                .setRequired(true)
        )
        .addChannelOption(option =>
            option.setName('categoria')
                .setDescription('Categoría donde se creará el canal')
                .addChannelTypes(ChannelType.GuildCategory)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    async execute(interaction) {
        if (!await checkBotAccess(interaction)) return;

        const nombre = interaction.options.getString('nombre');
        const categoria = interaction.options.getChannel('categoria');

        try {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            const channel = await interaction.guild.channels.create({
                name: nombre,
                type: ChannelType.GuildForum, // Tipo Foro
                parent: categoria ? categoria.id : null,
                reason: `Comando ejecutado por ${interaction.user.tag}`
            });

            await interaction.editReply({
                content: `✅ Canal de foro <#${channel.id}> creado correctamente en la categoría **${categoria ? categoria.name : 'Ninguna'}**.`
            });

        } catch (error) {
            console.error(error);
            await interaction.editReply({
                content: `❌ Hubo un error al crear el foro: ${error.message}`
            });
        }
    }
};
