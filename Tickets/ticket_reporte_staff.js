const {
    ChannelType,
    EmbedBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder,
    PermissionFlagsBits,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');

module.exports = {
    id: 'ticket_reporte_staff',

    async execute(interaction) {
        // --- 🔒 VERIFICACIÓN DE SEGURIDAD ---
        const categoriaId = process.env.REPORTES_STAFF_CATEGORIA;
        const ownerRolId = process.env.OWNER_ROL;

        if (!categoriaId || !ownerRolId) {
            console.error("❌ ERROR: Faltan IDs en .env (REPORTES_STAFF_CATEGORIA o OWNER_ROL)");
            return interaction.reply({ 
                content: "❌ Error de configuración. Contacta a un administrador.", 
                ephemeral: true 
            });
        }
        // -------------------------------------

        const modal = new ModalBuilder()
            .setCustomId('formularioReporteStaff')
            .setTitle('Formulario de Reporte a un Staff');

        const tipoReporte = new TextInputBuilder()
            .setCustomId('tipoReporte')
            .setLabel('Explicame brevemente lo sucedido')
            .setStyle(TextInputStyle.Paragraph)
            .setMaxLength(500) 
            .setRequired(true);

        const staff = new TextInputBuilder()
            .setCustomId('staff')
            .setLabel('Indica el nombre del STAFF a reportar')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        modal.addComponents(
            new ActionRowBuilder().addComponents(tipoReporte),
            new ActionRowBuilder().addComponents(staff)
        );

        await interaction.showModal(modal);

        const submitted = await interaction.awaitModalSubmit({
            time: 5 * 60 * 1000,
            filter: i => i.user.id === interaction.user.id && i.customId === 'formularioReporteStaff',
        }).catch(() => null);

        if (!submitted) return;

        let tipoReporteValue = submitted.fields.getTextInputValue('tipoReporte');
        let staffValue = submitted.fields.getTextInputValue('staff');

        if (tipoReporteValue.length > 800) tipoReporteValue = tipoReporteValue.slice(0, 800) + '...';

        const username = interaction.user.username.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20);
        let ticketName = `reporte-staff-${username}`;
        let counter = 1;

        while (interaction.guild.channels.cache.find(c => c.name === ticketName)) {
            counter++;
            ticketName = `reporte-staff-${username}-${counter}`;
        }

        try {
            const ticketChannel = await interaction.guild.channels.create({
                name: ticketName,
                type: ChannelType.GuildText,
                parent: categoriaId,
                permissionOverwrites: [
                    {
                        id: interaction.guild.roles.everyone.id,
                        deny: [PermissionFlagsBits.ViewChannel],
                    },
                    {
                        id: interaction.user.id,
                        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
                    },
                    {
                        id: ownerRolId,
                        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
                    }
                ],
            });

            const embed = new EmbedBuilder()
                .setColor('#1E90FF') 
                .setTitle('📣 Reporte a un STAFF | DistritoX')
                .setDescription(`
¡Bienvenido al Sistema de Reportes de DistritoX!
– Adjunta pruebas (imágenes, videos o descripciones claras) cuando se genere el ticket.
– El equipo revisará el caso y tomará las medidas correspondientes.

━━━━━━━━━━━━━━━━━━
**👤 STAFF reportado**
${staffValue}
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

            await ticketChannel.send({
                content: `<@${interaction.user.id}> <@&${ownerRolId}>`,
                embeds: [embed],
                components: [cerrarButton],
            });

            await submitted.reply({
                content: `✅ Tu ticket de **Reporte Staff** fue creado correctamente: <#${ticketChannel.id}>`,
                ephemeral: true,
            });

        } catch (error) {
            console.error("❌ Error creando canal:", error);
            await submitted.reply({ content: "❌ Error al crear el ticket.", ephemeral: true });
        }
    },
};