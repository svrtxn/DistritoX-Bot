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
    id: 'ticket_soporte',

    async execute(interaction) {
        const categoriaId = process.env.SOPORTE_CATEGORIA;

        // Roles de Soporte: Staff DistritoX
        const rolesSoporte = [
            process.env.STAFF_ROL
        ].filter(id => id);

        if (!categoriaId) {
            console.error("❌ ERROR: Faltan IDs en .env (SOPORTE_CATEGORIA)");
            return interaction.reply({ content: "❌ Error de configuración.", flags: MessageFlags.Ephemeral });
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

        // Diferir respuesta para evitar timeout de 3 segundos
        await submitted.deferReply({ flags: MessageFlags.Ephemeral });

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
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles],
                }
            ];

            rolesSoporte.forEach(rolId => {
                if (interaction.guild.roles.cache.has(rolId)) {
                    permissions.push({
                        id: rolId,
                        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles],
                    });
                } else {
                    console.warn(`[WARN] El rol soporte (${rolId}) no existe en el servidor. Saltando...`);
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

            await submitted.editReply({
                content: `✅ Tu ticket de **SOPORTE** fue creado correctamente: <#${ticketChannel.id}>`,
            });

        } catch (error) {
            console.error("❌ Error creando canal:", error);
            await submitted.editReply({ content: "❌ Error al crear el ticket de soporte." });
        }
    },
};