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
    id: 'ticket_local',

    async execute(interaction) {
        // Usaremos la categoría de postulación staff o una genérica si no existe una específica para locales
        const categoriaId = process.env.POSTULACION_STAFF; 
        const rolesStaffReviewers = [
            process.env.RANGO_OWNER,
            process.env.RANGO_JEFE_STAFF
        ].filter(id => id);

        if (!categoriaId || rolesStaffReviewers.length === 0) {
            // Fallback si no hay config
            console.error("Faltan configuraciones para ticket local");
            return interaction.reply({ content: "❌ Error de configuración.", flags: MessageFlags.Ephemeral });
        }

        const modal = new ModalBuilder()
            .setCustomId('formularioLocal')
            .setTitle('Postulación / Interés Local');

        const localInput = new TextInputBuilder()
            .setCustomId('localInteres')
            .setLabel('¿Qué local te interesa?')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const bandaInput = new TextInputBuilder()
            .setCustomId('banda')
            .setLabel('¿Perteneces a una banda? (Cuál)')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const cantidadInput = new TextInputBuilder()
            .setCustomId('cantidad')
            .setLabel('¿Cuánta gente tienes?')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        modal.addComponents(
            new ActionRowBuilder().addComponents(localInput),
            new ActionRowBuilder().addComponents(bandaInput),
            new ActionRowBuilder().addComponents(cantidadInput)
        );

        await interaction.showModal(modal);

        const submitted = await interaction.awaitModalSubmit({
            time: 5 * 60 * 1000,
            filter: i => i.user.id === interaction.user.id && i.customId === 'formularioLocal',
        }).catch(() => null);

        if (!submitted) return;

        await submitted.deferReply({ flags: MessageFlags.Ephemeral });

        const local = submitted.fields.getTextInputValue('localInteres');
        const banda = submitted.fields.getTextInputValue('banda');
        const cantidad = submitted.fields.getTextInputValue('cantidad');

        const usernameClean = interaction.user.username.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20);
        let ticketName = `local-${usernameClean}`;
        let counter = 1;

        while (interaction.guild.channels.cache.find(c => c.name === ticketName)) {
            counter++;
            ticketName = `local-${usernameClean}-${counter}`;
        }

        try {
            const permissionOverwrites = [
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
                permissionOverwrites.push({
                    id: rolId,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
                });
            });

            const ticketChannel = await interaction.guild.channels.create({
                name: ticketName,
                type: ChannelType.GuildText,
                parent: categoriaId,
                permissionOverwrites: permissionOverwrites,
            });

            const embed = new EmbedBuilder()
                .setColor('#00fa9a')
                .setTitle('🏪 Interés en Local | DistritoX')
                .setDescription(`¡Hola ${interaction.user.tag}!\n\nSe ha registrado tu interés por un local.`)
                .addFields(
                    { name: '🏪 Local Interesado', value: local, inline: true },
                    { name: '🏴 Banda/Org', value: banda, inline: true },
                    { name: '👥 Cantidad de gente', value: cantidad, inline: true }
                )
                .setFooter({ text: 'DistritoX • Gestión de Locales', iconURL: interaction.guild.iconURL({ dynamic: true }) })
                .setTimestamp();

            const cerrarButton = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('cerrar-ticket').setLabel('Cerrar Ticket').setStyle(ButtonStyle.Danger)
            );

            const mentions = [`<@${interaction.user.id}>`, ...rolesStaffReviewers.map(r => `<@&${r}>`)];

            await ticketChannel.send({
                content: mentions.join(' '),
                embeds: [embed],
                components: [cerrarButton],
            });

            await submitted.editReply({
                content: `✅ Tu ticket de **Local** fue creado correctamente: <#${ticketChannel.id}>`
            });

        } catch (error) {
            console.error("❌ Error creando canal local:", error);
            await submitted.editReply({ content: "❌ Error al crear el ticket de local." });
        }
    }
};
