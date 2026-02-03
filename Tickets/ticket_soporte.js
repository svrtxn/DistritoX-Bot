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
    id: 'ticket_soporte',

    async execute(interaction) {
        const categoriaId = process.env.SOPORTE_CATEGORIA;

        // Roles de Soporte (Todos los rangos + Soporte)
        const rolesSoporte = [
            process.env.RANGO_OWNER,
            process.env.RANGO_JEFE_STAFF,
            process.env.RANGO_DEVELOPER,
            process.env.RANGO_ENCARGADO_AREA,
            process.env.RANGO_MOD_AREA,
            process.env.RANGO_MOD,
            process.env.RANGO_SOPORTE,
            process.env.RANGO_SOPORTE_PRUEBA
        ].filter(id => id);

        if (!categoriaId) {
            console.error("❌ ERROR: Faltan IDs en .env (SOPORTE_CATEGORIA)");
            return interaction.reply({ content: "❌ Error de configuración.", ephemeral: true });
        }
        const modal = new ModalBuilder()
            .setCustomId('formularioSoporte')
            .setTitle('Formulario de Soporte');

        const tipoSoporte = new TextInputBuilder()
            .setCustomId('tipoSoporte')
            .setLabel('Describe tu duda o problema')
            .setStyle(TextInputStyle.Paragraph)
            .setMaxLength(500)
            .setRequired(true);

        modal.addComponents(new ActionRowBuilder().addComponents(tipoSoporte));

        await interaction.showModal(modal);

        const submitted = await interaction.awaitModalSubmit({
            time: 5 * 60 * 1000,
            filter: i => i.user.id === interaction.user.id && i.customId === 'formularioSoporte',
        }).catch(() => null);

        if (!submitted) return;

        let tipoSoporteValue = submitted.fields.getTextInputValue('tipoSoporte');
        if (tipoSoporteValue.length > 800) tipoSoporteValue = tipoSoporteValue.slice(0, 800) + '...';

        const username = interaction.user.username.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20);
        let ticketName = `soporte-${username}`;
        let counter = 1;

        while (interaction.guild.channels.cache.find(c => c.name === ticketName)) {
            counter++;
            ticketName = `soporte-${username}-${counter}`;
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

            rolesSoporte.forEach(rolId => {
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
                .setTitle('📣 Soporte y Dudas | DistritoX')
                .setDescription(`
¡Bienvenido al **Soporte de DistritoX**!
Este espacio está diseñado para ayudarte con cualquier duda o inconveniente relacionado con nuestro servidor.

━━━━━━━━━━━━━━━━━━
**📌 Tipo de soporte solicitado:**
${tipoSoporteValue}

━━━━━━━━━━━━━━━━━━
ℹ️  **NOTA:** Un miembro del staff se comunicará contigo a la brevedad. El tiempo de revisión estimado es de 24 a 72 horas.
                `)
                .setFooter({
                    text: 'DistritoX • Sistema de Soporte y Dudas',
                    iconURL: interaction.guild.iconURL({ dynamic: true }),
                });

            const cerrarButton = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('cerrar-ticket')
                    .setLabel('Cerrar Ticket')
                    .setStyle(ButtonStyle.Danger)
            );

            const mentions = [`<@${interaction.user.id}>`, ...rolesSoporte.map(r => `<@&${r}>`)];

            await ticketChannel.send({
                content: mentions.join(' '),
                embeds: [embed],
                components: [cerrarButton],
            });

            await submitted.reply({
                content: `✅ Tu ticket de **SOPORTE** fue creado correctamente: <#${ticketChannel.id}>`,
                ephemeral: true,
            });

        } catch (error) {
            console.error("❌ Error creando canal:", error);
            await submitted.reply({ content: "❌ Error al crear el ticket.", ephemeral: true });
        }
    },
};