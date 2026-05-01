// Este archivo solo registra el evento "ready" del client principal (manejado en index.js).
// NO debe crear un nuevo Client ni llamar a client.login().
module.exports = {
    name: 'ready',
    once: true,
    execute(client) {
        console.log(`✅ [Ready] Bot conectado como ${client.user.tag}`);
    }
};
