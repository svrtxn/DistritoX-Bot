const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { checkDeveloperAccess } = require('../../Functions/permisos');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mis-roles')
        .setDescription('Muestra tus roles y sus IDs para verificar la configuración del .env')
        .setDMPermission(false),

    async execute(interaction) {
        if (!await checkDeveloperAccess(interaction)) return;

        // Obtenemos los roles del usuario, omitiendo @everyone
        const userRoles = interaction.member.roles.cache
            .filter(r => r.id !== interaction.guild.id)
            .map(r => `• ${r.name}: ${r.id}`)
            .join('\n');
        
        const fs = require('fs');
        const path = require('path');
        const envPath = path.resolve(process.cwd(), '.env');
        const envExists = fs.existsSync(envPath);

        const envDev = process.env.ROL_DEVELOPER || 'No configurado';
        const envEncargado = process.env.ROL_ENCARGADO_AREA || 'No configurado';

        const content = `🔍 **Herramienta de Diagnóstico de Roles**\n\n` +
            `**Tus roles actuales en Discord son:**\n\`\`\`text\n${userRoles || 'Ninguno'}\n\`\`\`\n` +
            `**Lo que el bot espera encontrar (.env):**\n` +
            `> \`ROL_DEVELOPER\` = \`${envDev}\`\n` +
            `> \`ROL_ENCARGADO_AREA\` = \`${envEncargado}\`\n\n` +
            `**Información de Entorno (Debug):**\n` +
            `> Carpeta ejecución: \`${process.cwd()}\`\n` +
            `> .env encontrado en ejecución: \`${envExists ? 'Sí' : 'No'}\`\n\n` +
            `⚠️ **¿Por qué falla el permiso?**\nSi el bot no encuentra tu rol en el .env (como parece ser el caso), es probable que no esté leyendo el archivo .env correcto o falten variables.`;

        await interaction.reply({ content, flags: MessageFlags.Ephemeral });
    }
};
