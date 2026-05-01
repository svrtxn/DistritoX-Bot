const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require("discord.js");
const { checkBotAccess } = require("../Functions/permisos");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("mensaje")
        .setDescription("Envía un mensaje como el bot")
        .setDMPermission(false)
        .addStringOption(option =>
            option
                .setName("contenido")
                .setDescription("Cuerpo del mensaje (opcional si subes imagen)")
                .setRequired(false)
        )
        .addAttachmentOption(option =>
            option
                .setName("imagen")
                .setDescription("Imagen o archivo (opcional)")
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

        if (!await checkBotAccess(interaction)) return;

        const contenidoTexto = interaction.options.getString("contenido");
        const imagen = interaction.options.getAttachment("imagen");
        const titulo = interaction.options.getString("titulo");

        // Validación: Debemos enviar AL MENOS una cosa
        if (!contenidoTexto && !imagen && !titulo) {
            return interaction.reply({
                content: "❌ Debes proporcionar al menos texto, un título o una imagen para enviar.",
                flags: MessageFlags.Ephemeral
            });
        }

        const canal = interaction.channel;

        let mensajeFinal = contenidoTexto || "";
        if (titulo) {
            mensajeFinal = `# ${titulo}${contenidoTexto ? `\n\n${contenidoTexto}` : ""}`;
        }

        try {
            await canal.send({
                content: mensajeFinal.length > 0 ? mensajeFinal : undefined,
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
