const {
    SlashCommandBuilder,
    EmbedBuilder,
    PermissionFlagsBits,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    MessageFlags // ✅ Importante para quitar el warning
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket-panel')
        .setDescription('Crear panel de tickets')
        .setDMPermission(false) // Evita que el comando se ejecute en DMs
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        // Validación de servidor
        if (!interaction.guild) {
            return interaction.reply({
                content: "❌ Este comando solo puede usarse en un servidor.",
                flags: MessageFlags.Ephemeral
            });
        }

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('ticket_select') // Este ID lo maneja el interactionCreate
            .setPlaceholder('🎫 Selecciona el tipo de ticket')
            .addOptions([
                { label: 'Soporte | Dudas', value: 'ticket_soporte', description: 'Responde dudas y reporta bugs', emoji: '🔎' },

                // 👇 CAMBIO: Lo puse en SINGULAR ('ticket_reporte') para que coincida con tu archivo
                { label: 'Reportes', value: 'ticket_reporte', description: 'Reporte general', emoji: '🚩' },

                { label: 'Reporte a STAFF', value: 'ticket_reporte_staff', description: '🚨 Reporta a un miembro del staff', emoji: '🚨' },
                { label: 'Donación', value: 'ticket_donacion', description: 'Dudas sobre compras y beneficios', emoji: '💎' },
                { label: 'Postulación Banda', value: 'ticket_banda', description: 'Postulación de Organización Delictiva', emoji: '🔫' },
                { label: 'Interés Local', value: 'ticket_local', description: 'Consultas sobre Locales Disponibles', emoji: '🏪' },
                { label: 'Streamer', value: 'ticket_streamer', description: 'Postulación a Creador de Contenido / Streamer', emoji: '🎥' },
                { label: 'Postulación STAFF', value: 'ticket_staff', description: 'Postulación a Staff', emoji: '🛡️' },
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);

        const embed = new EmbedBuilder()
            .setColor('#2f3136')
            .setTitle('🧰 SISTEMA DE TICKETS | DistritoX')
            .setDescription(`
¡Bienvenido al sistema de soporte! Actualmente, el servidor se encuentra en un período de WIPE y preparación para el lanzamiento de la V2. Sin embargo, puedes comunicarte con el STAFF para asuntos urgentes o específicos a través de las siguientes categorías de tickets:

🔎 **Soporte o Dudas:** Para responder dudas, reportar bugs y solicitar roles para creadores de contenido.

🚩 **Reportes:**
Reporte general o a STAFF.  

💎 **Donación:**
Para resolver dudas sobre compras, donaciones y beneficios exclusivos del servidor.  

🔫 **Postulaciones Banda:**
Postulación de Organización Delictiva.  

🏪 **Locales:**
Consultas sobre locales disponibles.

🎥 **Streamer:** Postulación a Creador de Contenido / Streamer.  

🛡️ **Postulación STAFF:** Postulación a Staff.

**Cómo abrir un ticket:**
1. Selecciona la categoría que mejor describa tu necesidad en el menú.
2. Abre tu ticket y proporciona la información necesaria.


¡Gracias por mantener la comunidad segura, organizada y activa! 
`);
        await interaction.channel.send({ embeds: [embed], components: [row] });
        await interaction.reply({
            content: '✅ Panel de tickets creado correctamente.',
            flags: MessageFlags.Ephemeral
        });
    },
};