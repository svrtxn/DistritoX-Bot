const { SlashCommandBuilder, AttachmentBuilder, MessageFlags } = require("discord.js");
const path = require("path");
const { checkStaffAccess } = require("../Functions/permisos");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("mantenimiento")
        .setDescription("Envía el mensaje oficial de mantenimiento"),

    async execute(interaction) {
        // Verificar permisos usando la función que incluye a STAFF
        if (!checkStaffAccess(interaction)) return;

        // Diferir la respuesta inmediatamente para evitar el error 10062 (Unknown Interaction)
        // Esto le da al bot más tiempo (15 minutos) para procesar la subida del archivo pesado
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        try {
            // Función para detectar y reemplazar emojis personalizados por nombre (:nombre:)
            const replaceEmojis = (text) => {
                return text.replace(/:([a-zA-Z0-9_]+):/g, (match, name) => {
                    const emoji = interaction.client.emojis.cache.find(e => e.name.toLowerCase() === name.toLowerCase());
                    return emoji ? emoji.toString() : match;
                });
            };

            // Ruta de la imagen solicitada
            const imagePath = path.join(process.cwd(), "Static", "banner_fivem.gif");
            const file = new AttachmentBuilder(imagePath);

            const textoBase =
                `# :construction: ¡DISTRITO :1_distritoX: EN MANTENIMIENTO! :1_distritoxTool: 
:whitearrow: El servidor se encuentra actualmente en mantenimiento para mejorar tu experiencia.

:announcement:  Volveremos pronto... más estables, más rápidos y mejor que nunca.
:3602exclamationmarkbubble: Mantente atento a los anuncios para saber cuándo reabrimos.

:rocket: DistritoX no se detiene, solo se prepara para algo mejor.
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
                content: "✅ El mensaje de mantenimiento ha sido enviado correctamente."
            });

        } catch (error) {
            console.error(error);
            await interaction.editReply({
                content: "❌ Hubo un error al enviar el mensaje de mantenimiento."
            });
        }
    }
};
