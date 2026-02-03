const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { checkBotAccess } = require("../Functions/permisos");

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

        // Usar el checker de rango
        if (!checkBotAccess(interaction)) return;

        // Texto del anuncio
        const mensajeUpdate = `
# ¡DISTRITO<:1_distritoX:1403568810220585110> YA ESTÁ ON!  

*📖 IMPORTANTE – LEE LAS NORMATIVAS*
🔹 Evita problemas revisando las reglas actualizadas.
🔹 Respeta la inmersión y contribuye a una experiencia de rol de calidad.

*⚠️ RECUERDA:*
> Cada acto delictual DEBE ir acompañado de su entorno /911
> Para asistencia médica enviando /auxilio
> Sé creativo, respeta a los demás jugadores y haz que tu historia cuente.

🚀 DistritoX no espera a nadie: la aventura comienza AHORA.
|| @everyone || 
`;

        try {
            // Enviar el mensaje al mismo canal donde se ejecuta
            await interaction.channel.send(mensajeUpdate);

            // Confirmar al staff
            await interaction.reply({
                content: '✅ Mensaje de actualización enviado correctamente.',
                flags: MessageFlags.Ephemeral
            });

        } catch (error) {
            console.error(error);
            await interaction.reply({
                content: '❌ Hubo un error al enviar el mensaje.',
                flags: MessageFlags.Ephemeral
            });
        }
    }
};
