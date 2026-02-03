const { Events, ChannelType, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: Events.VoiceStateUpdate,
    async execute(oldState, newState) {
        
        // --- VARIABLES DE ENTORNO ---
        const generatorId = process.env.CANAL_CREADOR_VOZ; 
        const categoryId = process.env.BOT_CATEGORIA; // ID de la categoría "# BOT"
        const staffRoleId = process.env.STAFF_ROL;

        const { guild, member } = newState;

        // ============================================================
        // 1. LÓGICA DE CREACIÓN (Entrar al Generador)
        // ============================================================
        if (newState.channelId === generatorId) {
            
            // A. VERIFICAR PERMISO DE STAFF
            // Si NO tiene el rol de staff, lo desconectamos del canal.
            if (!member.roles.cache.has(staffRoleId)) {
                try {
                    await member.voice.disconnect(); 
                    // Opcional: Enviarle un mensaje privado explicando por qué
                    // await member.send("❌ Solo el Staff puede crear salas de soporte.");
                } catch (e) { console.error("No se pudo desconectar al usuario sin permisos."); }
                return;
            }

            // B. CALCULAR EL NOMBRE (Soporte 1, Soporte 2...)
            // Buscamos la categoría y contamos qué canales existen ya.
            const categoryChannel = guild.channels.cache.get(categoryId);
            
            if (categoryChannel) {
                // Obtenemos nombres de canales actuales en esa categoría que empiecen por "Soporte"
                const existingNames = categoryChannel.children.cache
                    .filter(c => c.name.startsWith("Soporte"))
                    .map(c => c.name);

                // Buscador de huecos: Busca el primer número disponible (ej: si existe 1 y 3, crea el 2)
                let counter = 1;
                while (existingNames.includes(`Soporte ${counter}`)) {
                    counter++;
                }

                const channelName = `Soporte ${counter}`;

                try {
                    // C. CREAR EL CANAL
                    const newChannel = await guild.channels.create({
                        name: channelName,
                        type: ChannelType.GuildVoice,
                        parent: categoryId, // Se crea dentro de la categoría # BOT
                        permissionOverwrites: [
                            {
                                id: staffRoleId,
                                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.ManageChannels],
                            },
                            {
                                id: guild.id, // @everyone
                                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect], // Todos pueden entrar a pedir ayuda
                            },
                        ],
                    });

                    // D. MOVER AL STAFF AL NUEVO CANAL
                    await member.voice.setChannel(newChannel);

                } catch (error) {
                    console.error("❌ Error al crear canal de soporte:", error);
                }
            } else {
                console.error("⚠️ La categoría BOT_CATEGORIA no se encuentra o el ID es incorrecto.");
            }
        }

        // ============================================================
        // 2. LÓGICA DE ELIMINACIÓN (Salir del canal)
        // ============================================================
        if (oldState.channel) {
            // Verificamos si quedó vacío (0 personas)
            if (oldState.channel.members.size === 0) {
                
                // Verificamos que sea un canal de Soporte dentro de la categoría correcta
                // (Para no borrar canales permanentes por error)
                if (oldState.channel.parentId === categoryId && 
                    oldState.channel.name.startsWith("Soporte ")) {
                    
                    try {
                        await oldState.channel.delete();
                    } catch (error) {
                        console.error("❌ No se pudo eliminar el canal vacío:", error);
                    }
                }
            }
        }
    },
};