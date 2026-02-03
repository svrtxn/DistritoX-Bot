const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const Transaccion = require("../../Models/transaccion");
const { checkBotAccess } = require("../../Functions/permisos");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("registrar-gasto")
        .setDescription("Registrar una salida de dinero (Gasto)")
        .setDMPermission(false) // Evita que el comando se ejecute en DMs
        .addNumberOption(opt =>
            opt.setName("monto")
                .setDescription("Monto del gasto")
                .setRequired(true))
        .addStringOption(opt =>
            opt.setName("descripcion")
                .setDescription("Descripción del gasto (ej: Pago Host)")
                .setRequired(true))
        .addStringOption(opt =>
            opt.setName("metodo")
                .setDescription("Método de pago usado")
                .setRequired(true))
        .addStringOption(opt =>
            opt.setName("comentario")
                .setDescription("Detalles adicionales")
                .setRequired(true)),

    async execute(interaction) {
        // Validación de servidor
        if (!interaction.guild) {
            return interaction.reply({ content: "❌ Este comando solo puede usarse en un servidor.", ephemeral: true });
        }

        // Verificar Staff
        // Verificar Staff
        if (!checkBotAccess(interaction)) return;

        const monto = interaction.options.getNumber("monto");
        const descripcion = interaction.options.getString("descripcion");
        const metodo = interaction.options.getString("metodo");
        const comentario = interaction.options.getString("comentario");
        const canalEjecutado = interaction.channel;

        const fecha = new Date();
        const fechaFormateada = fecha.toLocaleString('es-ES', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
        });

        try {
            const nuevoGasto = new Transaccion({
                tipo: 'GASTO',
                monto: monto,
                categoria: descripcion,
                metodo: metodo,
                comentario: comentario,
                staffId: interaction.user.id,
                canalId: canalEjecutado.id,
                canalNombre: canalEjecutado.name,
                usuarioId: null,
                esMensual: false
            });

            await nuevoGasto.save();

            const logChannel = interaction.guild.channels.cache.get(process.env.CANAL_DONACIONES);

            const embed = new EmbedBuilder()
                .setColor("#FF0000")
                .setTitle("📉 Nuevo Gasto Registrado")
                .addFields(
                    { name: "Registrado por", value: `<@${interaction.user.id}>`, inline: true },
                    { name: "Monto", value: `$${monto}`, inline: true },
                    { name: "Descripción", value: descripcion, inline: true },
                    { name: "Método", value: metodo, inline: true },
                    { name: "Canal vinculado", value: `<#${canalEjecutado.id}>`, inline: true },
                    { name: "Fecha", value: fechaFormateada, inline: true },
                    { name: "Comentario", value: comentario, inline: false }
                )
                .setFooter({ text: "Registro de Gastos • Distrito X" });

            if (logChannel) await logChannel.send({ embeds: [embed] });

            return interaction.reply({ content: "✅ Gasto registrado correctamente en la base de datos.", ephemeral: true });

        } catch (error) {
            console.error(error);
            return interaction.reply({ content: `❌ Error: ${error.message}`, ephemeral: true });
        }
    }
};