const { SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("anuncio")
        .setDescription("Envía un anuncio al canal de anuncios (solo staff)")
        .setDMPermission(false) // Evita que el comando se ejecute en DMs
        .addStringOption(option =>
            option
                .setName("titulo")
                .setDescription("Título del anuncio")
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName("mensaje")
                .setDescription("Cuerpo del anuncio")
                .setRequired(true)
        )
        .addAttachmentOption(option =>
            option
                .setName("imagen")
                .setDescription("Imagen del anuncio (opcional)")
                .setRequired(false)
        ),

    async execute(interaction) {
        // Validación de servidor
        if (!interaction.guild) {
            return interaction.reply({
                content: "❌ Este comando solo puede usarse en un servidor.",
                ephemeral: true
            });
        }

        // Verificar permisos
        const { checkBotAccess } = require("../Functions/permisos");
        if (!checkBotAccess(interaction)) return;

        const titulo = interaction.options.getString("titulo");
        const mensaje = interaction.options.getString("mensaje");
        const imagen = interaction.options.getAttachment("imagen");

        const canal = interaction.channel;

        /* 
        // Eliminado restricción de canal de anuncios
        const CANAL_ANUNCIOS = process.env.CANAL_ANUNCIOS;
        const canalAntiguo = interaction.guild.channels.cache.get(CANAL_ANUNCIOS); // Renombrado para evitar conflicto en comentario o simplemente borrar
        if (!canalAntiguo) ...
        */

        let contenido = `# ${titulo}\n\n${mensaje}\n\n|| @everyone ||`;

        await canal.send({
            content: contenido,
            files: imagen ? [imagen] : []
        });

        await interaction.reply({
            content: "✅ Anuncio enviado correctamente.",
            ephemeral: true
        });
    }
};
