'use strict';
const { AttachmentBuilder }   = require('discord.js');
const Canvas                  = require('canvas');
const path                    = require('path');

// Registrar fuente UNA SOLA VEZ al cargar el módulo (no en cada evento)
Canvas.registerFont(
    path.join(process.cwd(), 'Static', 'PublicSans-Regular.ttf'),
    { family: 'Public Sans' }
);

const BG_PATH     = path.join(process.cwd(), 'Static', 'IDENTIFICACION.png');
const FONT_STYLE  = '48px Public Sans';
const TEXT_COLOR  = '#501f3c';

module.exports = {
    name: 'guildMemberAdd',
    once: false,

    /**
     * @param {import('discord.js').GuildMember} member
     * @param {import('discord.js').Client} client
     */
    async execute(member, client) {
        const canalId = process.env.CANAL_BIENVENIDA;
        if (!canalId) {
            console.warn('[Bienvenida] CANAL_BIENVENIDA no configurado.');
            return;
        }

        try {
            const canvas = Canvas.createCanvas(1800, 1144);
            const ctx    = canvas.getContext('2d');

            // Fondo
            const background = await Canvas.loadImage(BG_PATH);
            ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

            // Texto
            ctx.fillStyle = TEXT_COLOR;
            ctx.font      = FONT_STYLE;

            ctx.fillText(member.user.username.toUpperCase(), 450, 635);
            ctx.fillText('DESCONOCIDO', 420, 720);
            ctx.fillText(new Date().toLocaleDateString('es-ES'), 690, 812);

            // Avatar
            const avatar = await Canvas.loadImage(
                member.user.displayAvatarURL({ extension: 'png', size: 512 })
            );
            ctx.drawImage(avatar, 1375 - 200, 755 - 200, 400, 400);

            const canal = await client.channels.fetch(canalId);
            await canal.send({
                content: `¡Bienvenido/a al servidor, <@${member.id}>! 🎉`,
                files: [new AttachmentBuilder(canvas.toBuffer(), { name: 'bienvenida.png' })],
            });

        } catch (err) {
            console.error('[Bienvenida] Error generando imagen:', err.message);
            // Intento de fallback sin imagen
            try {
                const canal = await client.channels.fetch(canalId);
                await canal.send(`¡Bienvenido/a al servidor, <@${member.id}>! 🎉`);
            } catch {
                console.error('[Bienvenida] No se pudo enviar el mensaje de bienvenida.');
            }
        }
    },
};
