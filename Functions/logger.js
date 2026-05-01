const { EmbedBuilder } = require('discord.js');

// ─────────────────────────────────────────────────────────────────────────────
// 📋 SISTEMA DE LOGS DE COMANDOS — DistritoX
//
//  Registra cada ejecución de un slash command en el canal LOGS_COMANDOS.
//  Incluye: usuario, comando, argumentos, canal, estado y timestamp.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extrae los opciones de una interacción de forma legible.
 * @param {import('discord.js').CommandInteraction} interaction
 * @returns {string}
 */
function formatOptions(interaction) {
    try {
        const opts = interaction.options?.data;
        if (!opts || opts.length === 0) return '`Sin argumentos`';

        return opts.map(opt => {
            let val = opt.value ?? '—';
            // Si es usuario, canal o rol, mostrarlo con mención
            if (opt.user) val = `@${opt.user.username}`;
            if (opt.channel) val = `#${opt.channel.name}`;
            if (opt.role) val = `@${opt.role.name}`;
            return `\`${opt.name}\`: **${val}**`;
        }).join('\n');
    } catch {
        return '`No se pudieron leer los argumentos`';
    }
}

/**
 * Determina el color del embed según el estado de la ejecución.
 * @param {'success'|'error'|'denied'} status
 * @returns {number}
 */
function getColor(status) {
    switch (status) {
        case 'success': return 0x57F287; // Verde
        case 'error':   return 0xED4245; // Rojo
        case 'denied':  return 0xFEE75C; // Amarillo
        default:        return 0x5865F2; // Blanco Discord
    }
}

/**
 * Determina el emoji según el estado.
 * @param {'success'|'error'|'denied'} status
 * @returns {string}
 */
function getStatusLabel(status) {
    switch (status) {
        case 'success': return '✅ Ejecutado';
        case 'error':   return '❌ Error';
        case 'denied':  return '🚫 Sin permisos';
        default:        return '🔵 Procesando';
    }
}

/**
 * Envía un log al canal de comandos configurado en LOGS_COMANDOS.
 *
 * @param {import('discord.js').CommandInteraction} interaction - La interacción del comando
 * @param {'success'|'error'|'denied'} status - Estado de la ejecución
 * @param {string} [nota] - Nota adicional opcional (ej: mensaje de error)
 */
async function logComando(interaction, status = 'success', nota = null) {
    const canalLogId = process.env.LOGS_COMANDOS;
    if (!canalLogId) return; // Si no está configurado, no hace nada

    try {
        const canalLog = await interaction.client.channels.fetch(canalLogId).catch(() => null);
        if (!canalLog) return;

        const miembro = interaction.member;
        const rolesFormateados = miembro?.roles?.cache
            .filter(r => r.id !== interaction.guild?.id) // excluir @everyone
            .sort((a, b) => b.position - a.position)
            .first(3) // Mostrar los 3 roles más altos
            .map(r => `<@&${r.id}>`)
            .join(', ') || '`Sin roles`';

        const embed = new EmbedBuilder()
            .setColor(getColor(status))
            .setAuthor({
                name: `/${interaction.commandName}`,
                iconURL: interaction.user.displayAvatarURL({ size: 64 })
            })
            .setTitle(`📋 Log de Comando`)
            .addFields(
                {
                    name: '👤 Usuario',
                    value: `<@${interaction.user.id}> \`(${interaction.user.id})\``,
                    inline: true
                },
                {
                    name: '📊 Estado',
                    value: getStatusLabel(status),
                    inline: true
                },
                {
                    name: '💬 Canal',
                    value: `<#${interaction.channelId}> \`(${interaction.channelId})\``,
                    inline: true
                },
                {
                    name: '🏷️ Roles (top 3)',
                    value: rolesFormateados,
                    inline: false
                },
                {
                    name: '⚙️ Argumentos',
                    value: formatOptions(interaction),
                    inline: false
                }
            )
            .setFooter({
                text: `Servidor: ${interaction.guild?.name ?? 'Desconocido'} • ID: ${interaction.id}`
            })
            .setTimestamp();

        // Si hay nota extra (error, motivo de denegación, etc.)
        if (nota) {
            embed.addFields({
                name: '📝 Nota',
                value: `\`\`\`${nota.slice(0, 900)}\`\`\``,
                inline: false
            });
        }

        await canalLog.send({ embeds: [embed] });

    } catch (err) {
        // El log nunca debe romper el flujo del comando
        console.error(`[LOGS] Error al enviar log del comando /${interaction.commandName}:`, err.message);
    }
}

module.exports = { logComando };
