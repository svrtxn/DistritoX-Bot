const { MessageFlags } = require('discord.js');

// ─────────────────────────────────────────────────────────────────────────────
// 🏆 JERARQUÍA DE RANGOS — DistritoX
//
//  ROL_OWNER            — Acceso total
//  ROL_JEFESTAFF        — Acceso total (gestión de staff)
//  ROL_DEVELOPER        — Acceso técnico completo
//  ROL_ENCARGADO_AREA   — Gestión avanzada
//  ROL_ADMIN            — Administración general
//  ROL_MOD_AREA         — Moderación avanzada
//  ROL_MOD              — Moderación básica
//  ROL_STAFF            — Acceso base (update, mantenimiento, bienvenida — NO)
//  ROL_SOPORTE          — Sin acceso al bot
//  ROL_SOPORTE_PRUEBAS  — Sin acceso al bot
//
//  Encargados (ENC_*):
//  ENC_STREAMERS · ENC_SS · ENC_DISCORD · ENC_VIP
//  ENC_ILEGALES · ENC_LSPD · ENC_SAMS · ENC_GM · ENC_NEGOCIOS
//
//  ROLES ROLEPLAY:
//  ROL_LSPD        — /aceptar-robo, /rechazar-robo
//  ROL_JEFEBANDA   — /solicitar-robo, /solicitar-yakuza
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Retorna los IDs de rol leídos del .env, filtrando vacíos/undefined.
 * @param {...string} keys — Nombres de variable de entorno
 * @returns {string[]}
 */
const getRoles = (...keys) =>
    keys.map(k => process.env[k]).filter(r => r && r.trim()).map(r => r.trim());

/**
 * Verifica si el miembro tiene AL MENOS uno de los roles indicados.
 * @param {import('discord.js').GuildMember} member
 * @param {string[]} roleIds
 * @returns {boolean}
 */
const hasAnyRole = (member, roleIds) =>
    roleIds.some(id => member.roles.cache.has(id));

/**
 * Responde con error de permisos (efímero) y retorna false.
 * @param {import('discord.js').Interaction} interaction
 * @param {string} mensaje
 * @returns {Promise<false>}
 */
const denyAccess = async (interaction, mensaje) => {
    const payload = { content: mensaje, flags: MessageFlags.Ephemeral };
    try {
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp(payload);
        } else {
            await interaction.reply(payload);
        }
    } catch (_) { /* interacción ya expirada */ }
    return false;
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS — Grupos de roles reutilizables
// ─────────────────────────────────────────────────────────────────────────────

/** Todos los Encargados de área */
const ENCARGADOS = () => getRoles(
    'ENC_STREAMERS', 'ENC_SS', 'ENC_DISCORD', 'ENC_VIP',
    'ENC_ILEGALES', 'ENC_LSPD', 'ENC_SAMS', 'ENC_GM', 'ENC_NEGOCIOS'
);

/** Rangos Staff desde MOD hacia arriba (sin STAFF base ni Encargados) */
const STAFF_MOD_PLUS = () => getRoles(
    'ROL_OWNER', 'ROL_JEFESTAFF', 'ROL_DEVELOPER',
    'ROL_ENCARGADO_AREA', 'ROL_ADMIN', 'ROL_MOD_AREA', 'ROL_MOD'
);

/** Todos los rangos Staff incluyendo el base */
const STAFF_ALL = () => [
    ...getRoles(
        'ROL_OWNER', 'ROL_JEFESTAFF', 'ROL_DEVELOPER',
        'ROL_ENCARGADO_AREA', 'ROL_ADMIN', 'ROL_MOD_AREA', 'ROL_MOD', 'ROL_STAFF'
    ),
    ...ENCARGADOS()
];

// ─────────────────────────────────────────────────────────────────────────────
// CHECKERS PÚBLICOS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * ✅ ACCESO GENERAL STAFF (MOD en adelante + Encargados)
 * Comandos: /anuncio, /clear, /donacion, /mensaje, /msj-personalizado,
 *           /publicar, /crearforum, /agregar-persona,
 *           /registrar-donacion, /registrar-gasto
 * Requiere: MOD o superior (no incluye ROL_STAFF base)
 */
const checkBotAccess = async (interaction) => {
    const roles = [...STAFF_MOD_PLUS(), ...ENCARGADOS()];

    if (!hasAnyRole(interaction.member, roles)) {
        console.log(`[PERMISOS] ❌ ${interaction.user.tag} → /${interaction.commandName} (requiere: Mod+)`);
        return denyAccess(interaction, '❌ No tienes permisos suficientes. (Requiere: Mod o superior)');
    }
    return true;
};

/**
 * ✅ ACCESO STAFF BASE (incluye ROL_STAFF y Encargados)
 * Comandos: /update, /mantenimiento
 * Requiere: STAFF o superior
 */
const checkStaffAccess = async (interaction) => {
    const roles = STAFF_ALL();

    if (!hasAnyRole(interaction.member, roles)) {
        console.log(`[PERMISOS] ❌ ${interaction.user.tag} → /${interaction.commandName} (requiere: Staff+)`);
        return denyAccess(interaction, '❌ No tienes permisos suficientes. (Requiere: Staff o superior)');
    }
    return true;
};

/**
 * ✅ ACCESO EXCLUSIVO DEVELOPER
 * Comandos: /bienvenida
 * Requiere: ROL_DEVELOPER, ROL_JEFESTAFF o ROL_OWNER únicamente
 */
const checkDeveloperAccess = async (interaction) => {
    const roles = getRoles('ROL_OWNER', 'ROL_JEFESTAFF', 'ROL_DEVELOPER');

    if (!hasAnyRole(interaction.member, roles)) {
        console.log(`[PERMISOS] ❌ ${interaction.user.tag} → /${interaction.commandName} (requiere: Developer)`);
        return denyAccess(interaction, '❌ Este comando es de uso exclusivo para Developers.');
    }
    return true;
};

/**
 * ✅ ACCESO SANCIONES (MOD_AREA o superior + Encargados)
 * Comandos: /sancion
 * Requiere: MOD_AREA, ENCARGADO_AREA, ADMIN, JEFESTAFF u OWNER
 */
const checkSancionesAccess = async (interaction) => {
    const roles = [
        ...getRoles('ROL_OWNER', 'ROL_JEFESTAFF', 'ROL_ADMIN', 'ROL_ENCARGADO_AREA', 'ROL_MOD_AREA'),
        ...ENCARGADOS()
    ];

    if (!hasAnyRole(interaction.member, roles)) {
        console.log(`[PERMISOS] ❌ ${interaction.user.tag} → /${interaction.commandName} (requiere: Mod Area+)`);
        return denyAccess(interaction, '❌ No tienes permisos para gestionar sanciones. (Requiere: Mod de Área o superior)');
    }
    return true;
};

/**
 * ✅ ACCESO LSPD
 * Comandos: /aceptar-robo, /rechazar-robo
 * Requiere: ROL_LSPD
 */
const checkLSPDAccess = async (interaction) => {
    const roles = getRoles('ROL_LSPD');

    if (roles.length === 0) {
        console.warn('[PERMISOS] ⚠️ ROL_LSPD no está configurado en el .env');
        return denyAccess(interaction, '❌ El sistema LSPD no está configurado. Contacta a un Developer.');
    }

    if (!hasAnyRole(interaction.member, roles)) {
        console.log(`[PERMISOS] ❌ ${interaction.user.tag} → /${interaction.commandName} (requiere: LSPD)`);
        return denyAccess(interaction, '❌ Solo los miembros de la LSPD pueden usar este comando.');
    }
    return true;
};

/**
 * ✅ ACCESO JEFE DE BANDA
 * Comandos: /solicitar-robo, /solicitar-yakuza
 * Requiere: ROL_JEFEBANDA
 */
const checkJefeBandaAccess = async (interaction) => {
    const roles = getRoles('ROL_JEFEBANDA');

    if (roles.length === 0) {
        console.warn('[PERMISOS] ⚠️ ROL_JEFEBANDA no está configurado en el .env');
        return denyAccess(interaction, '❌ El sistema de Bandas no está configurado. Contacta a un Developer.');
    }

    if (!hasAnyRole(interaction.member, roles)) {
        console.log(`[PERMISOS] ❌ ${interaction.user.tag} → /${interaction.commandName} (requiere: Jefe de Banda)`);
        return denyAccess(interaction, '❌ Solo los Jefes de Banda pueden usar este comando.');
    }
    return true;
};

/**
 * ✅ ACCESO STAFF ADMIN (MOD+ para agregar personas a canales)
 * Comandos: /agregar-persona
 * Alias de checkBotAccess — mismo nivel
 */
const checkStaffAdminAccess = checkBotAccess;

module.exports = {
    checkBotAccess,
    checkStaffAccess,
    checkDeveloperAccess,
    checkSancionesAccess,
    checkLSPDAccess,
    checkJefeBandaAccess,
    checkStaffAdminAccess,
    // Utilidades
    getRoles,
    hasAnyRole,
};
