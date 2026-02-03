const {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    AttachmentBuilder,
    MessageFlags
} = require('discord.js');

const Canvas = require('canvas');
const { registerFont } = require('canvas');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bienvenida')
        .setDescription('Envía una imagen de bienvenida personalizada.')
        .setDMPermission(false), // Evita que el comando se ejecute en DMs

    async execute(interaction) {
        // Asegúrate de que estas rutas sean correctas en tu proyecto
        const fontPath = path.join(process.cwd(), 'static', 'PublicSans-Regular.ttf');
        const bgPath = path.join(process.cwd(), 'static', 'IDENTIFICACION.png'); // Usa el nombre de archivo real de tu imagen de fondo

        registerFont(fontPath, { family: 'Public Sans' });

        const canvas = Canvas.createCanvas(1800, 1144);
        const ctx = canvas.getContext('2d');

        try {
            const background = await Canvas.loadImage(bgPath);
            ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

            // --- ESTILOS DE TEXTO ---
            // Color de texto blanco para que contraste con el fondo magenta
            ctx.fillStyle = '#000000ff';
            // Fuente más grande para el texto de la ID
            ctx.font = '48px "Public Sans"';

            // --- TEXTOS (Ajustado a la imagen) ---

            // 1. Nombre (Centrado en la línea "NOMBRE: ")
            const nameText = interaction.user.username.toUpperCase();
            // Coordenadas aproximadas para la posición del nombre
            let nameX = 450;
            let nameY = 635; // Se subió la posición Y

            ctx.fillText(nameText, nameX, nameY);

            // 2. Origen (Centrado en la línea "ORIGEN: ")
            const origenText = 'DESCONOCIDO';
            let origenX = 420;
            let origenY = 720; // Separación de 69 píxeles (igual que antes)

            ctx.fillText(origenText, origenX, origenY);

            // 3. Fecha (Centrado en la línea "FECHA DE: ")
            const date = new Date();
            // Formato 'dd/mm/yyyy' (ej: 18/05/2024)
            const dateText = date.toLocaleDateString('es-ES');
            let dateX = 690;
            let dateY = 812; // Separación de 69 píxeles

            ctx.fillText(dateText, dateX, dateY);

            // --- AVATAR (Círculo) ---
            const avatarSize = 400; // Tamaño del avatar
            const avatarX = 1375; // Posición X del centro del círculo
            const avatarY = 755; // Posición Y del centro del círculo

            const avatar = await Canvas.loadImage(interaction.user.displayAvatarURL({ extension: 'png', size: 512 }));



            // Dibuja el avatar dentro del círculo
            ctx.drawImage(
                avatar,
                avatarX - avatarSize / 2, // Posición X donde empieza a dibujar (borde izquierdo)
                avatarY - avatarSize / 2, // Posición Y donde empieza a dibujar (borde superior)
                avatarSize,
                avatarSize
            );

            // Restaura el estado del canvas
            ctx.restore();


            const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: 'bienvenida.png' });
            await interaction.reply({ files: [attachment] });

        } catch (error) {
            console.error(error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: 'Hubo un error al generar la imagen.', flags: MessageFlags.Ephemeral });
            } else {
                await interaction.reply({ content: 'Hubo un error al generar la imagen.', flags: MessageFlags.Ephemeral });
            }
        }
    }
};