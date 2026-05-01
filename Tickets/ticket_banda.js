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
    id: 'ticket_banda',

    async execute(interaction) {
        const categoriaId = process.env.POSTULACIONES_CATEGORIA;
        const ilegalesRolId = process.env.ILEGALES_ROL;

        if (!categoriaId || !ilegalesRolId) {
            console.error("❌ ERROR: Faltan IDs en .env (POSTULACIONES o ILEGALES)");
            return interaction.reply({ content: "❌ Error de configuración del bot.", flags: MessageFlags.Ephemeral });
        }
        const modal = new ModalBuilder()
            .setCustomId('formularioBandaPrincipal')
            .setTitle('Postulación de OD | DistritoX');

        const bandaNombre = new TextInputBuilder()
            .setCustomId('bandaNombre')
            .setLabel('Nombre de la banda')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const bandaColor = new TextInputBuilder()
            .setCustomId('bandaColor')
            .setLabel('Color representativo')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const bandaPersonas = new TextInputBuilder()
            .setCustomId('bandaPersonas')
            .setLabel('Cantidad de personas')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        modal.addComponents(
            new ActionRowBuilder().addComponents(bandaNombre),
            new ActionRowBuilder().addComponents(bandaColor),
            new ActionRowBuilder().addComponents(bandaPersonas)
        );

        await interaction.showModal(modal);

        const submitted = await interaction.awaitModalSubmit({
            time: 5 * 60 * 1000,
            filter: i => i.user.id === interaction.user.id && i.customId === 'formularioBandaPrincipal',
        }).catch(() => null);

        if (!submitted) return;

        await submitted.deferReply({ flags: MessageFlags.Ephemeral });

        const nombreBanda = submitted.fields.getTextInputValue('bandaNombre');
        const colorBanda = submitted.fields.getTextInputValue('bandaColor');
        const personasBanda = submitted.fields.getTextInputValue('bandaPersonas');

        const usernameClean = interaction.user.username.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20);
        let ticketName = `Banda-${usernameClean}`;
        let counter = 1;

        while (interaction.guild.channels.cache.find(c => c.name === ticketName)) {
            counter++;
            ticketName = `Banda-${usernameClean}-${counter}`;
        }

        try {
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

            // Comprobar si los roles existen en el servidor antes de asignarlos, para evitar crasheos (InvalidType)
            if (interaction.guild.roles.cache.has(ilegalesRolId)) {
                permissionOverwrites.push({
                    id: ilegalesRolId,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles],
                });
            } else {
                console.warn(`[WARN] El rol ilegalesRolId (${ilegalesRolId}) no se encuentra en el servidor. Ocultando errores...`);
            }

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
                .setColor('#FF4C4C')
                .setTitle('☠️ Postulación de Organización Delictiva | DistritoX')
                .setDescription(`¡Hola ${interaction.user.tag}! Tu postulación ha sido recibida.`)
                .addFields(
                    { name: '💀 Nombre de la Banda', value: nombreBanda, inline: true },
                    { name: '🎨 Color Representativo', value: colorBanda, inline: true },
                    { name: '👥 Cantidad de Personas', value: personasBanda, inline: true },
                    { name: '\u200B', value: '⚠️ Recuerda: Mientras más detallada sea tu solicitud, mayores serán tus posibilidades.' }
                )
                .setFooter({
                    text: 'DistritoX • Sistema de Bandas',
                    iconURL: interaction.guild.iconURL({ dynamic: true })
                })
                .setTimestamp();

            const cerrarButton = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('cerrar-ticket')
                    .setLabel('Cerrar Ticket')
                    .setStyle(ButtonStyle.Danger)
            );

            await ticketChannel.send({
                content: `<@${interaction.user.id}> <@&${ilegalesRolId}>`,
                embeds: [embed],
                components: [cerrarButton],
            });

            await submitted.editReply({
                content: `✅ Tu ticket de **Postulación de Banda** fue creado correctamente: <#${ticketChannel.id}>`
            });

        } catch (error) {
            console.error("❌ Error creando canal banda:", error);
            await submitted.editReply({ content: "❌ Error al crear el ticket de banda." });
        }
    }
};