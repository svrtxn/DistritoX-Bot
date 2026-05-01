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
    id: 'ticket_staff',

    async execute(interaction) {
        const categoriaId = process.env.POSTULACION_STAFF;

        // Roles que pueden ver el ticket de postulación (Owner y Jefe Staff)
        const rolesStaffReviewers = [
            process.env.RANGO_OWNER,
            process.env.RANGO_JEFE_STAFF
        ].filter(id => id); // Filtrar si alguno es undefined

        if (!categoriaId || rolesStaffReviewers.length === 0) {
            console.error("❌ ERROR: Faltan IDs en .env (POSTULACION_STAFF o Rangos administrativos)");
            return interaction.reply({ content: "❌ Error de configuración.", flags: MessageFlags.Ephemeral });
        }

        const modal = new ModalBuilder()
            .setCustomId('formularioStaffPrincipal')
            .setTitle('Postulación a Staff | DistritoX');

        const nombreInput = new TextInputBuilder().setCustomId('nombre').setLabel('Nombre completo').setStyle(TextInputStyle.Short).setRequired(true);
        const edadInput = new TextInputBuilder().setCustomId('edad').setLabel('Edad').setStyle(TextInputStyle.Short).setRequired(true);
        const experienciaInput = new TextInputBuilder().setCustomId('experiencia').setLabel('Experiencia en el rol').setStyle(TextInputStyle.Paragraph).setRequired(true);
        const motivacionInput = new TextInputBuilder().setCustomId('motivacion').setLabel('Motivación para postular').setStyle(TextInputStyle.Paragraph).setRequired(true);

        modal.addComponents(
            new ActionRowBuilder().addComponents(nombreInput),
            new ActionRowBuilder().addComponents(edadInput),
            new ActionRowBuilder().addComponents(experienciaInput),
            new ActionRowBuilder().addComponents(motivacionInput)
        );

        await interaction.showModal(modal);

        const submitted = await interaction.awaitModalSubmit({
            time: 5 * 60 * 1000,
            filter: i => i.user.id === interaction.user.id && i.customId === 'formularioStaffPrincipal',
        }).catch(() => null);

        if (!submitted) return;

        await submitted.deferReply({ flags: MessageFlags.Ephemeral });

        const nombre = submitted.fields.getTextInputValue('nombre');
        const edad = submitted.fields.getTextInputValue('edad');
        const experiencia = submitted.fields.getTextInputValue('experiencia');
        const motivacion = submitted.fields.getTextInputValue('motivacion');

        const usernameClean = interaction.user.username.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20);
        let ticketName = `Staff-${usernameClean}`;
        let counter = 1;

        while (interaction.guild.channels.cache.find(c => c.name === ticketName)) {
            counter++;
            ticketName = `Staff-${usernameClean}-${counter}`;
        }

        try {
            // Construir permisos dinámicamente
            const permissionOverwrites = [
                {
                    id: interaction.guild.roles.everyone.id,
                    deny: [PermissionFlagsBits.ViewChannel],
                },
                {
                    id: interaction.user.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles],
                }
            ];

            // Agregar permisos para cada rol de reviewer si existe en el guild
            rolesStaffReviewers.forEach(rolId => {
                if (interaction.guild.roles.cache.has(rolId)) {
                    permissionOverwrites.push({
                        id: rolId,
                        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles],
                    });
                } else {
                    console.warn(`[WARN] El rol reviewer (${rolId}) no existe en el servidor. Saltando...`);
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
                permissionOverwrites: permissionOverwrites,
            });

            const embed = new EmbedBuilder()
                .setColor('#1E90FF')
                .setTitle('🛡️ Postulación a Staff | DistritoX')
                .setDescription(`¡Hola ${interaction.user.tag}!\n\nTu postulación ha sido recibida.`)
                .addFields(
                    { name: '👤 Nombre completo', value: nombre, inline: true },
                    { name: '🎂 Edad', value: edad, inline: true },
                    { name: '💼 Experiencia en el rol', value: experiencia },
                    { name: '✨ Motivación', value: motivacion }
                )
                .setFooter({ text: 'DistritoX • Sistema de Postulaciones Staff', iconURL: interaction.guild.iconURL({ dynamic: true }) })
                .setTimestamp();

            const cerrarButton = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('cerrar-ticket').setLabel('Cerrar Ticket').setStyle(ButtonStyle.Danger)
            );

            await ticketChannel.send({
                content: `<@${interaction.user.id}> ${rolesStaffReviewers.map(r => `<@&${r}>`).join(' ')}`,
                embeds: [embed],
                components: [cerrarButton],
            });

            await submitted.editReply({
                content: `✅ Tu ticket de **Postulación a Staff** fue creado correctamente: <#${ticketChannel.id}>`
            });

        } catch (error) {
            console.error("❌ Error creando canal staff:", error);
            await submitted.editReply({ content: "❌ Error al crear el ticket de staff." });
        }
    }
};