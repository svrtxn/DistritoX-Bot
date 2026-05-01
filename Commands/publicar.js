const { 
    SlashCommandBuilder, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle, 
    ActionRowBuilder, 
    MessageFlags, 
    ChannelType 
} = require("discord.js");
const { checkBotAccess } = require("../Functions/permisos");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("publicar")
        .setDescription("Crea una publicación en un foro usando una ventana emergente.")
        .setDMPermission(false)
        .addStringOption(option =>
            option.setName("foro")
                .setDescription("Selecciona el foro de destino")
                .setRequired(true)
                .addChoices(
                    { name: 'Card Delictual', value: '1467027659476304063' },
                    { name: 'X-Card', value: '1467027258832322807' },
                    { name: 'Vehículos', value: '1467026388585418893' },
                    { name: 'Negocios', value: '1404972776435220680' }
                )
        )
        .addAttachmentOption(option =>
            option.setName("imagen")
                .setDescription("Imagen opcional para la publicación")
                .setRequired(false)
        ),

    async execute(interaction) {
        if (!await checkBotAccess(interaction)) return;

        const forumId = interaction.options.getString("foro");
        const imagen = interaction.options.getAttachment("imagen");

        // CREAR EL MODAL
        const modal = new ModalBuilder()
            .setCustomId(`modal_publicar_${interaction.id}`)
            .setTitle('Nueva Publicación en Foro');

        const inputTitulo = new TextInputBuilder()
            .setCustomId('titulo')
            .setLabel("Título de la publicación")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("Escribe el título aquí...")
            .setRequired(true);

        const inputContenido = new TextInputBuilder()
            .setCustomId('contenido')
            .setLabel("Cuerpo del mensaje")
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder("Copia y pega el contenido aquí...")
            .setRequired(true);

        const row1 = new ActionRowBuilder().addComponents(inputTitulo);
        const row2 = new ActionRowBuilder().addComponents(inputContenido);

        modal.addComponents(row1, row2);

        // MOSTRAR EL MODAL
        await interaction.showModal(modal);

        // ESPERAR LA RESPUESTA
        try {
            const filter = (i) => i.customId === `modal_publicar_${interaction.id}`;
            const submission = await interaction.awaitModalSubmit({
                filter,
                time: 600000 // 10 minutos
            });

            await submission.deferReply({ flags: MessageFlags.Ephemeral });

            const titulo = submission.fields.getTextInputValue('titulo');
            const contenido = submission.fields.getTextInputValue('contenido');

            const forumChannel = await interaction.guild.channels.fetch(forumId);

            if (!forumChannel || forumChannel.type !== ChannelType.GuildForum) {
                return submission.editReply({ content: "❌ Canal de foro no encontrado o no es válido." });
            }

            const post = await forumChannel.threads.create({
                name: titulo,
                message: {
                    content: contenido,
                    files: imagen ? [imagen] : []
                }
            });

            await submission.editReply({
                content: `✅ Publicación creada correctamente en <#${forumId}>: <#${post.id}>`
            });

        } catch (error) {
            if (error.code === 'InteractionCollectorError') {
                console.log("Tiempo agotado para el modal de publicación.");
            } else {
                console.error(error);
            }
        }
    }
};
