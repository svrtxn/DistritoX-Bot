const { MessageFlags } = require('discord.js');

/**
 * Verifica si el usuario tiene acceso general a los comandos del bot.
 * @param {import('discord.js').Interaction} interaction 
 * @returns {boolean} True si tiene acceso, False si no (y responde automáticamente)
 */
const checkBotAccess = (interaction) => {
    const rolesPermitidos = [
        process.env.RANGO_OWNER,
        process.env.RANGO_JEFE_STAFF,
        process.env.RANGO_DEVELOPER,
        process.env.RANGO_ENCARGADO_AREA,
        process.env.RANGO_MOD_AREA,
        process.env.RANGO_MOD
    ];

    // Filtrar undefined por si falta algo en el .env
    const rolesValidos = rolesPermitidos.filter(r => r);

    if (!rolesValidos.some(role => interaction.member.roles.cache.has(role))) {
        interaction.reply({
            content: "❌ No tienes permisos (Rango insuficiente) para usar este comando.",
            flags: MessageFlags.Ephemeral
        });
        return false;
    }
    return true;
};

/**
 * Verifica si el usuario tiene acceso al comando de sanciones.
 * @param {import('discord.js').Interaction} interaction 
 * @returns {boolean} True si tiene acceso, False si no (y responde automáticamente)
 */
const checkSancionesAccess = (interaction) => {
    const rolesPermitidos = [
        process.env.RANGO_OWNER,
        process.env.RANGO_JEFE_STAFF,
        process.env.RANGO_ENCARGADO_AREA,
        process.env.RANGO_MOD_AREA
    ];

    const rolesValidos = rolesPermitidos.filter(r => r);

    if (!rolesValidos.some(role => interaction.member.roles.cache.has(role))) {
        interaction.reply({
            content: "❌ No tienes permisos para gestionar Sanciones.",
            flags: MessageFlags.Ephemeral
        });
        return false;
    }
    return true;
};

module.exports = { checkBotAccess, checkSancionesAccess };
