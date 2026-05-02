const { SlashCommandBuilder, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mis-roles')
        .setDescription('Muestra tus roles y sus IDs para verificar la configuración del .env')
        .setDMPermission(false),

    async execute(interaction) {
        // Obtenemos los roles del usuario, omitiendo @everyone
        const userRoles = interaction.member.roles.cache
            .filter(r => r.id !== interaction.guild.id)
            .map(r => `• ${r.name}: ${r.id}`)
            .join('\n');
        
        const envDev = process.env.ROL_DEVELOPER || 'No configurado';
        const envEncargado = process.env.ROL_ENCARGADO_AREA || 'No configurado';

        const content = `🔍 **Herramienta de Diagnóstico de Roles**\n\n` +
            `**Tus roles actuales en Discord son:**\n\`\`\`text\n${userRoles || 'Ninguno'}\n\`\`\`\n` +
            `**Lo que el bot espera encontrar (.env):**\n` +
            `> \`ROL_DEVELOPER\` = \`${envDev}\`\n` +
            `> \`ROL_ENCARGADO_AREA\` = \`${envEncargado}\`\n\n` +
            `⚠️ **¿Por qué falla el permiso?**\nSi el ID de tu rol "Developer" o "Encargado" de arriba no coincide exactamente con los del \`.env\`, el bot no te reconocerá los permisos. Asegúrate de copiar el ID correcto de tu rol en Discord y pegarlo en el \`.env\`.`;

        await interaction.reply({ content, flags: MessageFlags.Ephemeral });
    }
};
