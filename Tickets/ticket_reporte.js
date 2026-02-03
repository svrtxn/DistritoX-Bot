const {
    ChannelType,
    EmbedBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder,
    PermissionFlagsBits,
    ButtonBuilder,
    ButtonStyle,
    MessageFlags
} = require('discord.js');

module.exports = {
    id: 'ticket_reportes',

    async execute(interaction) {
        const categoriaId = process.env.REPORTES_CATEGORIA;

        // Roles de staff (Rango 1 a 6) que verán el reporte
        // Se excluye Soporte (Rango 7/8) según indicaciones implícitas de jerarquía alta para reportes
        const rolesStaffReviewers = [
            process.env.RANGO_OWNER,
            process.env.RANGO_JEFE_STAFF,
            process.env.RANGO_DEVELOPER,
            process.env.RANGO_ENCARGADO_AREA,
            process.env.RANGO_MOD_AREA,
            process.env.RANGO_MOD
        ].filter(id => id);

        if (!categoriaId) {
            console.error("❌ ERROR CRÍTICO: Faltan IDs en .env (REPORTES_CATEGORIA)");
            return interaction.reply({
                content: "❌ Error de configuración interna.",
                flags: MessageFlags.Ephemeral
            });
        }
        const modal = new ModalBuilder()
            .setCustomId('formularioReporte')
            .setTitle('Formulario de Reporte');

        const tipoReporte = new TextInputBuilder()
            .setCustomId('tipoReporte')
            .setLabel('Explicame brevemente lo sucedido')
            .setStyle(TextInputStyle.Paragraph)
            .setMaxLength(500)
            .setRequired(true);

        modal.addComponents(new ActionRowBuilder().addComponents(tipoReporte));

        await interaction.showModal(modal);

        const submitted = await interaction.awaitModalSubmit({
            time: 5 * 60 * 1000,
            filter: i => i.user.id === interaction.user.id && i.customId === 'formularioReporte',
        }).catch(() => null);

        if (!submitted) return;

        let tipoReporteValue = submitted.fields.getTextInputValue('tipoReporte');
        if (tipoReporteValue.length > 800) tipoReporteValue = tipoReporteValue.slice(0, 800) + '...';

        const username = interaction.user.username.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20);
        let ticketName = `reporte-${username}`;
        let counter = 1;

        while (interaction.guild.channels.cache.find(c => c.name === ticketName)) {
            counter++;
            ticketName = `reporte-${username}-${counter}`;
        }

        try {
            const permissions = [
                {
                    id: interaction.guild.roles.everyone.id,
                    deny: [PermissionFlagsBits.ViewChannel],
                },
                {
                    id: interaction.user.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
                }
            ];

            rolesStaffReviewers.forEach(rolId => {
                permissions.push({
                    id: rolId,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
                });
            });

            const ticketChannel = await interaction.guild.channels.create({
                name: ticketName,
                type: ChannelType.GuildText,
                parent: categoriaId,
                permissionOverwrites: permissions,
            });

            const embed = new EmbedBuilder()
                .setColor('#1E90FF')
                .setTitle('📣 Reporte | DistritoX')
                .setDescription(`
¡Bienvenido al Sistema de Reportes Generales de DistritoX!

– Adjunta pruebas (imágenes, videos o descripciones claras) cuando se genere el ticket.
– El equipo revisará el caso y tomará las medidas correspondientes.

━━━━━━━━━━━━━━━━━━
**📌 Lo que se reporta:**
${tipoReporteValue}

━━━━━━━━━━━━━━━━━━
ℹ️  **NOTA:** Todos los reportes son confidenciales y tratados con seriedad. El tiempo de revisión estimado es de 24 a 72 horas.
                `)
                .setFooter({
                    text: 'DistritoX • Sistema de Reporte',
                    iconURL: interaction.guild.iconURL({ dynamic: true }),
                });

            const cerrarButton = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('cerrar-ticket')
                    .setLabel('Cerrar Ticket')
                    .setStyle(ButtonStyle.Danger)
            );

            // Mention string
            const mentions = [`<@${interaction.user.id}>`, ...rolesStaffReviewers.map(r => `<@&${r}>`)];

            await ticketChannel.send({
                content: mentions.join(' '),
                embeds: [embed],
                components: [cerrarButton],
            });

            await submitted.reply({
                content: `✅ Tu ticket de **Reporte** fue creado correctamente: <#${ticketChannel.id}>`,
                flags: MessageFlags.Ephemeral
            });

        } catch (error) {
            console.error("❌ Error creando canal:", error);
            if (!submitted.replied) {
                await submitted.reply({
                    content: "❌ Ocurrió un error al crear el ticket.",
                    flags: MessageFlags.Ephemeral
                });
            }
        }
    },
};