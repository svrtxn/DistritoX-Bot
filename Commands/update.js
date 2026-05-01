const { SlashCommandBuilder, AttachmentBuilder, MessageFlags } = require('discord.js');
const path = require('path');
const { checkStaffAccess } = require("../Functions/permisos");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('update')
        .setDescription('Envía el mensaje de actualización del servidor')
        .setDMPermission(false),

    async execute(interaction) {
        if (!interaction.guild) {
            return interaction.reply({
                content: "❌ Este comando solo puede usarse en un servidor.",
                flags: MessageFlags.Ephemeral
            });
        }

        // Usar el checker de rango que incluye a STAFF
        if (!checkStaffAccess(interaction)) return;

        // Diferir la respuesta inmediatamente para evitar el error 10062 (Unknown Interaction)
        // La subida del banner (7MB) puede tardar más de los 3 segundos permitidos.
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        try {
            // Función para detectar y reemplazar emojis personalizados por nombre (:nombre:)
            const replaceEmojis = (text) => {
                return text.replace(/:([a-zA-Z0-9_]+):/g, (match, name) => {
                    const emoji = interaction.client.emojis.cache.find(e => e.name.toLowerCase() === name.toLowerCase());
                    return emoji ? emoji.toString() : match;
                });
            };

            // Ruta de la imagen del banner
            const imagePath = path.join(process.cwd(), "Static", "banner_fivem.gif");
            const file = new AttachmentBuilder(imagePath);

            const textoBase = 
`# ¡DISTRITO :1_distritoX: YA ESTÁ ON!  

*📖 IMPORTANTE – LEE LAS NORMATIVAS*
🔹 Evita problemas revisando las reglas actualizadas.
🔹 Respeta la inmersión y contribuye a una experiencia de rol de calidad.

*⚠️ RECUERDA:*
> Cada acto delictual DEBE ir acompañado de su entorno /entorno
> Para asistencia médica enviando /auxilio
> Sé creativo, respeta a los demás jugadores y haz que tu historia cuente.

🚀 DistritoX no espera a nadie: la aventura comienza AHORA.
@everyone`;

            const mensajeFinal = replaceEmojis(textoBase);

            // 1. Enviar la imagen sola primero
            await interaction.channel.send({
                files: [file]
            });

            // 2. Enviar el mensaje de texto después
            await interaction.channel.send({
                content: mensajeFinal
            });

            // Confirmar al staff editando la respuesta diferida
            await interaction.editReply({
                content: '✅ Mensaje de actualización enviado correctamente.'
            });

        } catch (error) {
            console.error(error);
            await interaction.editReply({
                content: '❌ Hubo un error al enviar el mensaje de actualización.'
            });
        }
    }
};
