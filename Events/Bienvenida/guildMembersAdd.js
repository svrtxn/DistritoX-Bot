const { AttachmentBuilder } = require('discord.js');
const Canvas = require('canvas');
const { registerFont } = require('canvas');
const path = require('path');

module.exports = {
    name: "guildMemberAdd",
    once: false,

    async execute(member, client) {
        const bgPath = path.join(process.cwd(), 'Static', 'IDENTIFICACION.png');

        registerFont(
            path.join(process.cwd(), 'Static', 'PublicSans-Regular.ttf'),
            { family: 'Public Sans' }
        );

        const canvas = Canvas.createCanvas(1800, 1144);
        const ctx = canvas.getContext('2d');

        try {
           
            const background = await Canvas.loadImage(bgPath);
            ctx.drawImage(background, 0, 0, canvas.width, canvas.height);


            ctx.fillStyle = '#501f3c';
            ctx.font = '48px "Public Sans"';

            
            const nameText = member.user.username.toUpperCase();
            let nameX = 450; 
            let nameY = 635;
            ctx.fillText(nameText, nameX, nameY);
            const origenText = 'DESCONOCIDO';
            let origenX = 420;
            let origenY = 720;

            ctx.fillText(origenText, origenX, origenY);

            const date = new Date();
            const dateText = date.toLocaleDateString('es-ES'); 
            let dateX = 690;
            let dateY = 812; 

            ctx.fillText(dateText, dateX, dateY);

     
            const avatarSize = 400; 
            const avatarX = 1375; 
            const avatarY = 755; 
            
            const avatar = await Canvas.loadImage(member.user.displayAvatarURL({ extension: 'png', size: 512 }));


            ctx.drawImage(
                avatar, 
                avatarX - avatarSize / 2, 
                avatarY - avatarSize / 2, 
                avatarSize, 
                avatarSize
            );

            ctx.restore();
            
            const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: 'bienvenida.png' });
            const canalBienvenidaId = process.env.CANAL_BIENVENIDA;
            const canal = await client.channels.fetch(canalBienvenidaId);

            await canal.send({
                content: `¡Bienvenido/a al servidor, <@${member.id}>! 🎉`,
                files: [attachment]
            });

        } catch (error) {
            console.error(error);
            const errorMessage = 'Hubo un error al generar la imagen.';
            const canal = await client.channels.fetch(process.env.CANAL_BIENVENIDA);
            await canal.send({ content: errorMessage });
        }
    }
};
