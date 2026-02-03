const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("mensaje")
        .setDescription("Envía un mensaje como el bot")
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages) // Solo gente con permisos de gestionar mensajes
        .addStringOption(option =>
            option
                .setName("contenido")
                .setDescription("Cuerpo del mensaje")
                .setRequired(true)
        )
        .addAttachmentOption(option =>
            option
                .setName("imagen")
                .setDescription("Imagen del anuncio (opcional)")
                .setRequired(false)
        )
        .addStringOption(option =>
            option
                .setName("titulo")
                .setDescription("Título del mensaje (opcional)")
                .setRequired(false)
        ),

    async execute(interaction) {

        if (!interaction.guild) {
            return interaction.reply({
                content: "❌ Este comando solo puede usarse en un servidor.",
                flags: MessageFlags.Ephemeral
            });
        }

        // Check Permissions
        const { checkBotAccess } = require("../Functions/permisos");
        if (!checkBotAccess(interaction)) return;

        const contenidoTexto = interaction.options.getString("contenido");
        const imagen = interaction.options.getAttachment("imagen");
        const titulo = interaction.options.getString("titulo");

        const canal = interaction.channel;

        let mensajeFinal = contenidoTexto;
        if (titulo) {
            mensajeFinal = `# ${titulo}\n\n${contenidoTexto}`;
        }

        try {
            await canal.send({
                content: mensajeFinal,
                files: imagen ? [imagen] : []
            });

            await interaction.reply({
                content: "✅ Mensaje enviado correctamente.",
                flags: MessageFlags.Ephemeral
            });
        } catch (error) {
            console.error(error);
            await interaction.reply({
                content: "❌ Hubo un error al enviar el mensaje.",
                flags: MessageFlags.Ephemeral
            });
        }
    }
};
