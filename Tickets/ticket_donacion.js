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
    id: 'ticket_donacion',

    async execute(interaction) {
        const categoriaId = process.env.DONACIONES_CATEGORIA;
        const donacionesRolId = process.env.DONACIONES_ROL;

        // Roles de jerarquía a incluir (Owner y Jefe Staff)
        const jerarquiaRoles = [
            process.env.RANGO_OWNER,
            process.env.RANGO_JEFE_STAFF
        ].filter(id => id);

        if (!categoriaId) {
            console.error("❌ ERROR: Faltan IDs en .env (DONACIONES_CATEGORIA)");
            return interaction.reply({ content: "❌ Error de configuración.", ephemeral: true });
        }

        const modal = new ModalBuilder()
            .setCustomId('formularioDonacion')
            .setTitle('Formulario de Donación');

        const tipoDonacion = new TextInputBuilder()
            .setCustomId('tipoDonacion')
            .setLabel('¿Qué tipo de donación deseas realizar?')
            .setStyle(TextInputStyle.Paragraph)
            .setMaxLength(500)
            .setRequired(true);

        modal.addComponents(new ActionRowBuilder().addComponents(tipoDonacion));

        await interaction.showModal(modal);

        const submitted = await interaction.awaitModalSubmit({
            time: 5 * 60 * 1000,
            filter: i => i.user.id === interaction.user.id && i.customId === 'formularioDonacion',
        }).catch(() => null);

        if (!submitted) return;

        let tipoDonacionValue = submitted.fields.getTextInputValue('tipoDonacion');
        if (tipoDonacionValue.length > 800) tipoDonacionValue = tipoDonacionValue.slice(0, 800) + '...';

        const username = interaction.user.username.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20);
        let ticketName = `donacion-${username}`;
        let counter = 1;

        while (interaction.guild.channels.cache.find(c => c.name === ticketName)) {
            counter++;
            ticketName = `donacion-${username}-${counter}`;
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

            // Agregar rol de donaciones
            if (donacionesRolId) {
                permissions.push({
                    id: donacionesRolId,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
                });
            }

            // Agregar jerarquía
            jerarquiaRoles.forEach(rolId => {
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
                .setTitle('💎 Sistema de Donación | DistritoX')
                .setDescription(`
¡Bienvenido al **Sistema de Donación de DistritoX**!

━━━━━━━━━━━━━━━━━━
**📌 Tipo de donación solicitada:**
${tipoDonacionValue}

━━━━━━━━━━━━━━━━━━
ℹ️ **NOTA:** Todas las donaciones son completamente **voluntarias**.
                `)
                .setFooter({
                    text: 'DistritoX • Sistema de Donaciones',
                    iconURL: interaction.guild.iconURL({ dynamic: true }),
                });

            const cerrarButton = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('cerrar-ticket')
                    .setLabel('Cerrar Ticket')
                    .setStyle(ButtonStyle.Danger)
            );

            // Construir menciones
            let mentions = [`<@${interaction.user.id}>`];
            if (donacionesRolId) mentions.push(`<@&${donacionesRolId}>`);
            jerarquiaRoles.forEach(r => mentions.push(`<@&${r}>`));

            await ticketChannel.send({
                content: mentions.join(' '),
                embeds: [embed],
                components: [cerrarButton],
            });

            await submitted.reply({
                content: `✅ Tu ticket de **Donación** fue creado correctamente: <#${ticketChannel.id}>`,
                ephemeral: true,
            });

        } catch (error) {
            console.error("❌ Error creando canal:", error);
            await submitted.reply({ content: "❌ Error al crear el ticket.", ephemeral: true });
        }
    },
};