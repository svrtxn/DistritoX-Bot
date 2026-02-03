const {
    ChannelType,
    EmbedBuilder,
    ActionRowBuilder,
    PermissionFlagsBits,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');

module.exports = {
    id: 'ticket_streamer',

    async execute(interaction) {
        await interaction.reply({ content: '⏳ Creando tu ticket...', ephemeral: true });

        const categoriaId = process.env.POSTULACIONES_CATEGORIA;
        const staffRolId = process.env.STAFF_ROL;
        const streamerRolId = process.env.STREAMER_ROL;

        if (!categoriaId || !staffRolId || !streamerRolId) {
            console.error("❌ ERROR: Faltan IDs en .env (POSTULACIONES, STAFF o STREAMER)");
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
                        id: staffRolId,
                        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
                    },
                    {
                        id: streamerRolId,
                        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
                    }
                ],
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
                content: `<@${interaction.user.id}> <@&${staffRolId}> <@&${streamerRolId}>`,
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