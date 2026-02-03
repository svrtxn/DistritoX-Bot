require('dotenv').config();
const cron = require('node-cron'); 
const Transaccion = require('./Models/transaccion'); // ⚠️ Asegúrate que tu archivo en la carpeta Models empiece con Mayúscula (Transaccion.js)

// ---------------------------------------------------------
// 🌐 IMPORTAR EL SERVIDOR DEL DASHBOARD
// ---------------------------------------------------------
// Si aún no creas la carpeta Dashboard, comenta esta línea para que no de error.
const startDashboard = require('./Dashboard/server'); 

const token = process.env.DISCORD_TOKEN;

const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const { Guilds, GuildMembers, GuildMessages } = GatewayIntentBits;
const { User, Message, GuildMember, ThreadMember } = Partials;

const { loadEvents } = require('./Handlers/eventHandler');
const { loadCommands } = require('./Handlers/commandHandler');
const { loadButtons } = require('./Handlers/buttonHandler'); 

const client = new Client({
    intents: [Guilds, GuildMembers, GuildMessages],
    partials: [User, Message, GuildMember, ThreadMember] 
});

client.events = new Collection();
client.commands = new Collection();
client.buttons = new Collection();

(async () => {
    try {
        await loadEvents(client);
        await loadButtons(client); 

        await client.login(token);

        client.once('ready', async () => {
            await loadCommands(client);  
            console.log(`✅ El cliente se ha iniciado correctamente: ${client.user.tag}`);

            // ---------------------------------------------------------
            // 🌐 INICIAR DASHBOARD WEB (PUERTO 3000)
            // ---------------------------------------------------------
            try {
                startDashboard(client); // Pasamos el cliente para que pueda buscar avatares
            } catch (error) {
                console.error("⚠️ No se pudo iniciar el Dashboard Web (¿Falta la carpeta Dashboard?):", error.message);
            }

            // ---------------------------------------------------------
            // ⏰ INICIO DEL SISTEMA DE CRON JOBS (RECORDATORIOS)
            // ---------------------------------------------------------
            console.log('⏰ Sistema de recordatorios automáticos iniciado...');
            
            // Ejecutar cada minuto (* * * * *)
            cron.schedule('* * * * *', async () => {
                const ahora = new Date();
                
                // Calcular fecha límite (Ej: Avisar 3 días antes de que venza)
                const diasAnticipacion = 3;
                const fechaLimite = new Date();
                fechaLimite.setDate(ahora.getDate() + diasAnticipacion);

                try {
                    // Buscar suscripciones MENSUALES, activas, que venzan pronto y NO hayan sido avisadas
                    const porVencer = await Transaccion.find({
                        tipo: 'INGRESO',
                        esMensual: true,
                        recordatorioEnviado: false, 
                        fechaRenovacion: {
                            $gte: ahora,       // Que venza en el futuro (no vencidas ya)
                            $lte: fechaLimite  // Pero dentro de los próximos 3 días
                        }
                    });

                    if (porVencer.length > 0) {
                        console.log(`🔎 Se encontraron ${porVencer.length} renovaciones próximas.`);
                    }

                    for (const pago of porVencer) {
                        try {
                            let mensajeEnviado = false;

                            // 1. INTENTAR ENVIAR AL CANAL VINCULADO (Prioridad)
                            if (pago.canalId) {
                                try {
                                    const canal = await client.channels.fetch(pago.canalId);
                                    if (canal) {
                                        await canal.send({
                                            content: `📢 <@${pago.usuarioId}> **¡Recordatorio de Renovación!**\n\nTu suscripción (**${pago.categoria}**) vence el **${pago.fechaRenovacion.toLocaleDateString()}**.\nPor favor, gestiona tu pago para evitar cortes en el servicio. 🗓️`
                                        });
                                        mensajeEnviado = true;
                                        console.log(`✅ Recordatorio enviado al canal ${canal.name} para ${pago.usuarioId}`);
                                    }
                                } catch (err) {
                                    console.log(`⚠️ No se pudo acceder al canal ${pago.canalId}. Intentando DM como respaldo...`);
                                }
                            }

                            // 2. RESPALDO: Si no hay canal o se borró, enviar DM
                            if (!mensajeEnviado) {
                                const usuario = await client.users.fetch(pago.usuarioId);
                                if (usuario) {
                                    await usuario.send({
                                        content: `👋 Hola **${usuario.username}**, un recordatorio de **Distrito X**.\n\n⚠️ Tu suscripción vence el **${pago.fechaRenovacion.toLocaleDateString()}**.`
                                    });
                                    console.log(`✅ Recordatorio enviado por DM a ${usuario.tag}`);
                                    mensajeEnviado = true;
                                }
                            }

                            // 3. ACTUALIZAR BASE DE DATOS (Solo si se pudo enviar algún aviso)
                            if (mensajeEnviado) {
                                pago.recordatorioEnviado = true;
                                await pago.save();
                            }

                        } catch (err) {
                            console.error(`⚠️ Error procesando recordatorio para usuario ID: ${pago.usuarioId}`, err);
                        }
                    }
                } catch (error) {
                    console.error("❌ Error en el CronJob de renovaciones:", error);
                }
            });
            // ---------------------------------------------------------
            // FIN DEL CRON JOB
            // ---------------------------------------------------------

        });

    } catch (error) {
        console.error("❌ Error al iniciar el bot:", error);
    }
})();