const { ButtonInteraction, ChannelType, EmbedBuilder, MessageFlags } = require('discord.js');
const { createTranscript } = require('discord-html-transcripts');

module.exports = {
    id: 'cerrar-ticket',
    /**
     * @param {ButtonInteraction} interaction
     */
    async execute(interaction) {
        if (!interaction.channel || interaction.channel.type !== ChannelType.GuildText) {
            return interaction.reply({ content: '❌ Este botón solo funciona dentro de un canal de texto.', flags: MessageFlags.Ephemeral });
        }

        let logsChannelId;
        // Check for null channel name
        const channelName = interaction.channel.name || 'ticket-sin-nombre';

        if (channelName.startsWith('reporte-staff-')) {
            logsChannelId = process.env.LOGS_REPORTE_STAFF;
        } else {
            logsChannelId = process.env.LOGS_TICKETS_CANAL;
        }

        const logsChannel = interaction.guild.channels.cache.get(logsChannelId);
        if (!logsChannel) {
            return interaction.reply({ content: '❌ No se pudo encontrar el canal de logs.', flags: MessageFlags.Ephemeral });
        }

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        let transcript;
        try {
            transcript = await createTranscript(interaction.channel, {
                limit: -1,
                returnBuffer: false,
                fileName: `${channelName}.html`,
            });
        } catch (error) {
            console.error("Error creando transcript:", error);
        }

        const fechaCierre = new Date();
        const fechaLegible = `<t:${Math.floor(fechaCierre.getTime() / 1000)}:F>`;

        let ticketOwner = null;
        try {
            // Fetch some messages correctly
            const messages = await interaction.channel.messages.fetch({ limit: 50 });
            // Find the first non-bot message or rely on channel logic if we had stored it in topic
            // Simple heuristic to find first user mention in first few messages if it's the bot opening message
            // Usually the bot tags the user in the first message
            const firstMsg = Array.from(messages.values()).sort((a, b) => a.createdTimestamp - b.createdTimestamp)[0];
            if (firstMsg) {
                const userMention = firstMsg.mentions.users.first();
                if (userMention && !userMention.bot) {
                    ticketOwner = userMention;
                } else if (!firstMsg.author.bot) {
                    ticketOwner = firstMsg.author;
                }
            }
        } catch (err) {
            console.error("Error fetching messages for owner:", err);
        }

        const participants = new Set();
        try {
            const allMessages = await interaction.channel.messages.fetch({ limit: 100 });
            allMessages.forEach(msg => {
                if (!msg.author.bot && msg.author.id !== interaction.user.id) {
                    participants.add(`<@${msg.author.id}>`);
                }
            });
        } catch (e) { }

        // Embed de cierre
        const embed = new EmbedBuilder()
            .setColor('#ff4d4d')
            .setTitle('📁 Ticket Cerrado')
            .setDescription(`El ticket **${channelName}** fue cerrado.`)
            .addFields(
                { name: '👤 Abrió el ticket', value: ticketOwner ? `<@${ticketOwner.id}>` : 'Desconocido', inline: true },
                { name: '🛑 Cerrado por', value: `<@${interaction.user.id}>`, inline: true },
                { name: '💬 Participantes', value: participants.size > 0 ? Array.from(participants).join(', ') : 'Nadie más', inline: false },
                { name: '🕒 Fecha de cierre', value: fechaLegible, inline: true },
            )
            .setFooter({ text: `ID del canal: ${interaction.channel.id}` });

        // Enviar logs al canal correspondiente
        if (logsChannel) {
            try {
                const payload = { embeds: [embed] };
                if (transcript) payload.files = [transcript];
                await logsChannel.send(payload);
            } catch (err) {
                console.error("Error enviando log:", err);
            }
        }

        await interaction.editReply({ content: '✅ El ticket fue cerrado correctamente. El canal se eliminará en 5 segundos.' });

        setTimeout(() => {
            if (interaction.channel) {
                interaction.channel.delete().catch(console.error);
            }
        }, 5000);
    },
};
