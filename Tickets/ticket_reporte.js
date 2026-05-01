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

        // Roles Reporte: Admin + Staff DistritoX
        const rolesStaffReviewers = [
            process.env.ADMINISTRADOR_ROL,
            process.env.STAFF_ROL
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
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles],
                }
            ];

            rolesStaffReviewers.forEach(rolId => {
                if (interaction.guild.roles.cache.has(rolId)) {
                    permissions.push({
                        id: rolId,
                        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles],
                    });
                } else {
                    console.warn(`[WARN] El rol reviewer de reporte (${rolId}) no existe en el servidor. Saltando...`);
                }
            });

            const categoryObj = interaction.guild.channels.cache.get(categoriaId);
            const validCategoryId = categoryObj && categoryObj.type === ChannelType.GuildCategory ? categoriaId : null;

            if (!validCategoryId) {
                console.warn(`[WARN] La categoría (${categoriaId}) no existe o no es válida. Creando en la raíz...`);
            }

            const ticketChannel = await interaction.guild.channels.create({
                name: ticketName,
                type: ChannelType.GuildText,
                parent: validCategoryId,
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