const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require("discord.js");
const { checkFinanzasAccess } = require("../Functions/permisos");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("donacion")
        .setDescription("Muestra el formulario oficial de donación de DistritoX.")
        .setDMPermission(false)
        .addStringOption(option =>
            option
                .setName("monto")
                .setDescription("Monto de la donación (ej: 20 USD, 5000 CLP)")
                .setRequired(true)
        ),

    async execute(interaction) {
        // Verificar que se ejecuta en un servidor
        if (!interaction.guild) {
            return interaction.reply({
                content: "❌ Este comando solo puede usarse en un servidor.",
                flags: MessageFlags.Ephemeral
            });
        }

        // Verificar permisos de staff
        if (!await checkFinanzasAccess(interaction)) return;

        // Obtener el monto ingresado por el usuario
        const monto = interaction.options.getString("monto");

        // ── Embed principal ──────────────────────────────────────────────────
        const embed = new EmbedBuilder()
            .setTitle("💰 Formulario de Donación - DistritoX")
            .setColor(0xFFD700) // Dorado
            .setDescription(
                "> Recuerda que esta donación es completamente **voluntaria**\n" +
                "> y no otorga ventajas injustas dentro del servidor, respetando las\n" +
                "> **Normativas de Rockstar**."
            )
            .addFields(
                {
                    name: "💵 Monto de la Donación",
                    value: `\`\`\`\n${monto}\n\`\`\``,
                    inline: false
                },
                {
                    name: "📋 Requisitos para donar",
                    value:
                        "▸ Colocar tu **Nombre de Discord** en el comprobante.\n" +
                        "▸ Enviar el comprobante en un **ticket** dentro de este mismo canal.\n" +
                        "▸ Aceptar nuestros **Términos y Condiciones**.",
                    inline: false
                },
                {
                    name: "✅ Confirmación",
                    value: "*Al realizar tu donación confirmas que entiendes y aceptas las condiciones.*",
                    inline: false
                },
                {
                    name: "─────────────────────────",
                    value: "🙏 **Gracias por apoyar el crecimiento de DistritoX**",
                    inline: false
                },
                // ── Cuenta Chilena ──
                {
                    name: "🇨🇱 CUENTA CHILENA",
                    value:
                        "```\n" +
                        "Titular : Ulises Pérez\n" +
                        "RUT     : 20.396.057-3\n" +
                        "Banco   : Mercado Pago (Cuenta Vista)\n" +
                        "N° Cta  : 1008958186\n" +
                        "Correo  : ulisesalbertoperez15@gmail.com\n" +
                        "```",
                    inline: false
                },
                // ── Cuenta Americana ──
                {
                    name: "🇺🇸 CUENTA AMERICANA",
                    value:
                        "```\n" +
                        "Titular : Luis Julian Andres Paz Munoz\n" +
                        "Método  : PayPal\n" +
                        "```\n" +
                        "🔗 [Link de PayPal — Click Aquí](https://paypal.me/Julianpaz07)",
                    inline: false
                }
            )
            .setFooter({ text: "DistritoX • Donaciones" })
            .setTimestamp();

        // Enviar el embed en el canal actual
        await interaction.channel.send({ embeds: [embed] });

        // Confirmar al que ejecutó el comando (efímero)
        await interaction.reply({
            content: "✅ Formulario de donación enviado correctamente.",
            flags: MessageFlags.Ephemeral
        });
    }
};
