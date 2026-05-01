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
                {
                    label: 'Soporte',
                    value: 'ticket_soporte',
                    description: 'Consultas generales, bugs y problemas técnicos',
                    emoji: { id: '1427457867862118522', animated: true }
                },
                {
                    label: 'Reportes',
                    value: 'ticket_reporte',
                    description: 'Reportar usuarios, roles o bugs de juego',
                    emoji: { id: '1398032552203128984', animated: true }
                },
                {
                    label: 'Reporte a STAFF',
                    value: 'ticket_reporte_staff',
                    description: 'Reportar a un integrante del Staff',
                    emoji: { id: '1398032552203128984', animated: true }
                },
                {
                    label: 'Donaciones',
                    value: 'ticket_donacion',
                    description: 'Dudas sobre compras y beneficios exclusivos',
                    emoji: { id: '1411393357699219637', animated: true }
                },
                {
                    label: 'Postulación Org. Delictiva',
                    value: 'ticket_banda',
                    description: 'Registro de organización delictiva',
                    emoji: { id: '1427457881992859818', animated: true }
                },
                {
                    label: 'Negocios & Locales',
                    value: 'ticket_local',
                    description: 'Postular para administrar un negocio',
                    emoji: { id: '1427457888494026752', animated: true }
                },
                {
                    label: 'Creador de Contenido | Streamer',
                    value: 'ticket_streamer',
                    description: 'Colaboraciones y roles de contenido',
                    emoji: { id: '1398031498367467661', animated: false }
                },
                {
                    label: 'Postulación a Staff',
                    value: 'ticket_staff',
                    description: 'Formar parte del equipo de STAFF',
                    emoji: { id: '1406836520715030548', animated: true }
                },
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);

        const embed = new EmbedBuilder()
            .setColor('#2f3136')
            // .setTitle('🧰 SISTEMA DE TICKETS | DistritoX') // Comentado para usar el header en la descripción
            .setDescription(`# SISTEMA DE TICKETS  |  Distrito<:1_distritoX:1403568810220585110> 

*Bienvenido/a al sistema de tickets del servidor.*
Aquí podrás encontrar la categoría exacta para recibir el soporte que necesitas. ¡Nuestro equipo está para ayudarte!


*<a:announcement:1427457867862118522>Soporte*
Para consultas generales, bugs, problemas técnicos o solicitar un rol para los creadores de contenido.

*<a:alerta_roja_distritoX:1398032552203128984> Reportes*
<a:purplearrow:1416565195538432131> Para reportar usuarios o roles que incumplan la normativa o bugs que afecten la experiencia de juego.
<a:purplearrow:1416565195538432131> Para reportar a un integrante del Staff que incumpla la normativa o que afecte la experiencia de juego.

*<a:1_distritox_coins:1411393357699219637> Donaciones*
Para resolver dudas sobre compras, donaciones y beneficios exclusivos del servidor.

*<a:purpleuzi:1427457881992859818>Postulación de Organización Delictiva*
Para comenzar el proceso de registrar una organización delictiva dentro del servidor.

*<a:computercodin:1427457888494026752>  Negocios & Locales*
Para consultar o postular para administrar un negocio disponible en la ciudad.

*<:distritoX_pepe:1398031498367467661> Creador de Contenido | Streamer*
Para creadores de contenido, streamers y medios interesados en colaborar con el servidor.

*<a:purplestar:1406836520715030548> Postulación a Staff*
Para formar parte del equipo de STAFF y apoyar la moderación y crecimiento de la comunidad.


## ¿Cómo abrir un ticket?
1️⃣ Selecciona la categoría que mejor se ajuste a tu solicitud
2️⃣ Abre el ticket y entrega la información necesaria que se te solicita
3️⃣ *Ten paciencia:* un integrante del equipo te atenderá lo antes posible.


## ¡Gracias por mantener la comunidad segura, organizada y con buen rol!`);
        await interaction.channel.send({ embeds: [embed], components: [row] });
        await interaction.reply({
            content: '✅ Panel de tickets creado correctamente.',
            flags: MessageFlags.Ephemeral
        });
    },
};