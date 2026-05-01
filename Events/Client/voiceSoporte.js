'use strict';
const { Events, ChannelType, PermissionFlagsBits } = require('discord.js');

const PERMS_STAFF    = [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.ManageChannels];
const PERMS_EVERYONE = [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect];

module.exports = {
    name: Events.VoiceStateUpdate,

    /**
     * @param {import('discord.js').VoiceState} oldState
     * @param {import('discord.js').VoiceState} newState
     */
    async execute(oldState, newState) {
        const generatorId = process.env.CANAL_CREADOR_VOZ;
        const categoryId  = process.env.BOT_CATEGORIA;
        const staffRoleId = process.env.ROL_STAFF;

        const { guild, member } = newState;

        // ── CREACIÓN: miembro entra al canal generador ────────────────────────
        if (newState.channelId === generatorId) {
            if (!member.roles.cache.has(staffRoleId)) {
                await member.voice.disconnect().catch(() =>
                    console.warn(`[VoiceSoporte] No se pudo desconectar a ${member.user.tag}.`)
                );
                return;
            }

            const category = guild.channels.cache.get(categoryId);
            if (!category) {
                console.error('[VoiceSoporte] BOT_CATEGORIA no encontrada — verifica el .env.');
                return;
            }

            // Encuentra el primer número disponible (sin huecos)
            const usados = category.children.cache
                .filter(c => c.name.startsWith('Soporte '))
                .map(c => parseInt(c.name.split(' ')[1], 10))
                .filter(n => !isNaN(n));

            let num = 1;
            while (usados.includes(num)) num++;

            try {
                const nuevoCanal = await guild.channels.create({
                    name: `Soporte ${num}`,
                    type: ChannelType.GuildVoice,
                    parent: categoryId,
                    permissionOverwrites: [
                        { id: staffRoleId,  allow: PERMS_STAFF    },
                        { id: guild.id,     allow: PERMS_EVERYONE },
                    ],
                });
                await member.voice.setChannel(nuevoCanal);
            } catch (err) {
                console.error('[VoiceSoporte] Error al crear canal:', err.message);
            }
        }

        // ── ELIMINACIÓN: canal de soporte queda vacío ─────────────────────────
        if (
            oldState.channel &&
            oldState.channel.members.size === 0 &&
            oldState.channel.parentId === categoryId &&
            oldState.channel.name.startsWith('Soporte ')
        ) {
            await oldState.channel.delete().catch(err =>
                console.error('[VoiceSoporte] No se pudo eliminar el canal vacío:', err.message)
            );
        }
    },
};