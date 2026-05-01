const {
    ChannelType,
    EmbedBuilder,
    ActionRowBuilder,
    PermissionFlagsBits,
    ButtonBuilder,
    ButtonStyle,
    MessageFlags
} = require('discord.js');

module.exports = {
    id: 'ticket_streamer',

    async execute(interaction) {
        await interaction.reply({ content: '⏳ Creando tu ticket...', flags: MessageFlags.Ephemeral });

        const categoriaId = process.env.POSTULACIONES_CATEGORIA;
        const streamerRolId = process.env.STREAMER_ROL;

        if (!categoriaId || !streamerRolId) {
            console.error("❌ ERROR: Faltan IDs en .env (POSTULACIONES o STREAMER)");
            return interaction.editReply({ content: "❌ Error de configuración del bot." });
        }

        const usernameClean = interaction.user.username.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20);
        let ticketName = `Streamer-${usernameClean}`;
        let counter = 1;

        while (interaction.guild.channels.cache.find(c => c.name === ticketName)) {
            counter++;
            ticketName = `Streamer-${usernameClean}-${counter}`;
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

            if (interaction.guild.roles.cache.has(streamerRolId)) {
                permissionOverwrites.push({
                    id: streamerRolId,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles],
                });
            } else {
                console.warn(`[WARN] El rol streamerRolId (${streamerRolId}) no se encuentra en el servidor. Ocultando errores...`);
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
                .setColor('#1E90FF')
                .setTitle('💎 Sistema de Postulación | DistritoX')
                .setDescription(`¡Bienvenido al **Sistema de postulaciones para Streamer**!`)
                .setFooter({ text: 'DistritoX • Streamers', iconURL: interaction.guild.iconURL({ dynamic: true }) });

            const cerrarButton = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('cerrar-ticket').setLabel('Cerrar Ticket').setStyle(ButtonStyle.Danger)
            );

            await ticketChannel.send({
                content: `<@${interaction.user.id}> <@&${streamerRolId}>`,
                embeds: [embed],
                components: [cerrarButton]
            });

            await ticketChannel.send(`**Nombre del postulante:** ${interaction.user.tag}\n\n`);

            const formMessages = [
                `Responde las siguientes preguntas:\n**\n📌 Información General**\n1️⃣ Plataforma(s)\n2️⃣ Videos\n3️⃣ Link del canal`,
                `**\n🎮 Contenido y Frecuencia**\n4️⃣ Frecuencia streams\n5️⃣ Frecuencia videos`,
                `**\n👥 Audiencia**\n6️⃣ Promedio viewers\n7️⃣ Seguidores\n8️⃣ ¿Seguirás las reglas?`,
                `**\n🏆 Motivación**\n9️⃣ ¿Por qué colaborar?\n🔟 ¿Beneficios?`
            ];

            for (const msg of formMessages) {
                await ticketChannel.send(msg);
            }

            await interaction.editReply({
                content: `✅ Tu ticket de **Postulación** fue creado correctamente: <#${ticketChannel.id}>`
            });

        } catch (error) {
            console.error("❌ Error creando canal streamer:", error);
            await interaction.editReply({ content: "❌ Error al crear el ticket de streamer." });
        }
    },
};