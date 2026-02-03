const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const Transaccion = require("../../Models/transaccion");
const { checkBotAccess } = require("../../Functions/permisos");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("registrar-donacion")
        .setDescription("Registrar un ingreso de dinero")
        .setDMPermission(false) // Evita que el comando se ejecute en DMs
        .addUserOption(opt => opt.setName("usuario").setDescription("Donante").setRequired(true))
        .addNumberOption(opt => opt.setName("monto").setDescription("Monto").setRequired(true))
        .addStringOption(opt => opt.setName("tipo").setDescription("Tipo (VIP, Casa, etc)").setRequired(true))
        .addStringOption(opt => opt.setName("metodo").setDescription("Método de pago").setRequired(true))
        .addBooleanOption(opt => opt.setName("mensual").setDescription("¿Es pago mensual?").setRequired(true))
        .addStringOption(opt => opt.setName("comentario").setDescription("Comentario adicional")),



    async execute(interaction) {
        // Validación de servidor
        if (!interaction.guild) {
            return interaction.reply({ content: "❌ Este comando solo puede usarse en un servidor.", ephemeral: true });
        }

        if (!checkBotAccess(interaction)) return;

        const usuario = interaction.options.getUser("usuario");
        const monto = interaction.options.getNumber("monto");
        const tipo = interaction.options.getString("tipo");
        const metodo = interaction.options.getString("metodo");
        const esMensual = interaction.options.getBoolean("mensual");
        const comentario = interaction.options.getString("comentario") || "Sin comentarios";

        const canalEjecutado = interaction.channel;

        const fecha = new Date();
        const fechaFormateada = fecha.toLocaleString('es-ES', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
        });

        let fechaRenovacion = null;
        if (esMensual) {
            const fRenov = new Date();
            fRenov.setDate(fRenov.getDate() + 30);
            fechaRenovacion = fRenov;
        }

        try {
            const nuevaTransaccion = new Transaccion({
                tipo: 'INGRESO',
                monto: monto,
                categoria: tipo,
                metodo: metodo,
                comentario: comentario,
                staffId: interaction.user.id,
                usuarioId: usuario.id,

                canalId: canalEjecutado.id,
                canalNombre: canalEjecutado.name,

                esMensual: esMensual,
                fechaRenovacion: fechaRenovacion
            });

            await nuevaTransaccion.save();

            // Mensaje de agradecimiento en el ticket
            await canalEjecutado.send({
                content: `¡Gracias por tu generosa donación, <@${usuario.id}>! 🎉 ¡Te agradecemos mucho por tu apoyo! 🙌`
            });

            //  Log Privado en el canal de registros
            const logChannel = interaction.guild.channels.cache.get(process.env.CANAL_DONACIONES);
            const embed = new EmbedBuilder()
                .setColor("#00FF00")
                .setTitle("💸 Nueva Donación Registrada")
                .addFields(
                    { name: "Donante", value: `<@${usuario.id}>`, inline: true },
                    { name: "Registrado por", value: `<@${interaction.user.id}>`, inline: true },
                    { name: "Monto", value: `$${monto}`, inline: true },
                    { name: "Tipo", value: tipo, inline: true },
                    { name: "Método", value: metodo, inline: true },
                    { name: "Canal vinculado", value: `<#${canalEjecutado.id}>`, inline: true },
                    { name: "Pago mensual", value: esMensual ? "Sí" : "No", inline: true },
                    { name: "Fecha", value: fechaFormateada, inline: true },
                    { name: "Comentario", value: comentario, inline: false }
                )
                .setFooter({ text: "Registro de Donaciones • Distrito X" });

            if (logChannel) await logChannel.send({ embeds: [embed] });

            // Confirmación  ¿para el Staff
            return interaction.reply({ content: "✅ Donación registrada y mensaje enviado.", ephemeral: true });

        } catch (error) {
            console.error(error);
            return interaction.reply({ content: "❌ Error guardando en la base de datos.", ephemeral: true });
        }
    }
};