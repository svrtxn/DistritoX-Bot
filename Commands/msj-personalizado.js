const { SlashCommandBuilder, MessageFlags, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require("discord.js");
const { checkBotAccess } = require("../Functions/permisos");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("msj-personalizado")
        .setDescription("Abre una ventana para pegar un mensaje largo con formato")
        .setDMPermission(false)
        .addAttachmentOption(option =>
            option
                .setName("adjunto")
                .setDescription("Sube una imagen o video (opcional)")
                .setRequired(false)
        ),

    async execute(interaction) {
        if (!checkBotAccess(interaction)) return;

        // 1. Crear el Modal
        const modal = new ModalBuilder()
            .setCustomId(`modal_msj_${interaction.user.id}`)
            .setTitle("Enviar Mensaje Personalizado");

        const textInput = new TextInputBuilder()
            .setCustomId("msj_contenido")
            .setLabel("Pega aquí tu mensaje (soporta @ciudadano)")
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder("Copia y pega tu guía o anuncio aquí...")
            .setRequired(true);

        const row = new ActionRowBuilder().addComponents(textInput);
        modal.addComponents(row);

        // 2. Mostrar el Modal
        await interaction.showModal(modal);

        // 3. Esperar la respuesta del Modal
        try {
            const filter = (i) => i.customId === `modal_msj_${interaction.user.id}`;
            const submission = await interaction.awaitModalSubmit({ filter, time: 300_000 }); // 5 minutos para redactar

            await submission.deferReply({ flags: MessageFlags.Ephemeral });

            const contenidoRaw = submission.fields.getTextInputValue("msj_contenido");
            const adjunto = interaction.options.getAttachment("adjunto");
            const canal = interaction.channel;

            // --- TRANSFORMACIÓN DEL TEXTO ---
            let mensajeFinal = contenidoRaw;

            // Reemplazar Emojis :nombre:
            const emojiRegex = /:([a-zA-Z0-9_]+):/g;
            mensajeFinal = mensajeFinal.replace(emojiRegex, (match, name) => {
                const emoji = interaction.client.emojis.cache.find(e => e.name.toLowerCase() === name.toLowerCase());
                return emoji ? emoji.toString() : match;
            });

            // Reemplazar Menciones @ciudadano
            mensajeFinal = mensajeFinal.replace(/@ciudadano/gi, (match) => {
                const role = interaction.guild.roles.cache.find(r => r.name.toLowerCase() === "ciudadano");
                return role ? `<@&${role.id}>` : match;
            });

            // --- LÓGICA DE DIVISIÓN ---
            const chunks = [];
            const maxLength = 1900;

            if (mensajeFinal.length <= maxLength) {
                chunks.push(mensajeFinal);
            } else {
                let currentChunk = "";
                const lines = mensajeFinal.split("\n");
                
                for (const line of lines) {
                    if ((currentChunk.length + line.length + 1) > maxLength) {
                        if (currentChunk.trim().length > 0) chunks.push(currentChunk.trim());
                        currentChunk = line + "\n";
                    } else {
                        currentChunk += line + "\n";
                    }
                }
                if (currentChunk.trim().length > 0) chunks.push(currentChunk.trim());
            }

            // --- ENVÍO ---
            for (let i = 0; i < chunks.length; i++) {
                const options = { content: chunks[i] };
                if (i === 0 && adjunto) options.files = [adjunto];
                await canal.send(options);
            }

            await submission.editReply({
                content: `✅ ¡Mensaje enviado con éxito! (${chunks.length} partes)`,
            });

        } catch (error) {
            if (error.code === 'InteractionCollectorError') {
                // El usuario cerró el modal o tardó demasiado
                return;
            }
            console.error("❌ Error en modal msj-personalizado:", error.message || error);
            
            let errorMsg = "❌ Error al enviar el mensaje. Es posible que la interacción haya expirado debido a lentitud temporal en el servidor.";
            if (error.code === 40005) errorMsg = "❌ El archivo adjunto es demasiado pesado.";
            if (error.code === 50013) errorMsg = "❌ El bot no tiene permisos suficientes en este canal.";

            try {
                await interaction.followUp({ content: errorMsg, flags: MessageFlags.Ephemeral });
            } catch (err) {
                // Si la interacción original expiró (ya pasaron 15 min), enviarlo al canal como último recurso.
                await interaction.channel.send({ content: `<@${interaction.user.id}>, ${errorMsg}` }).catch(() => {});
            }
        }
    }
};
