'use strict';
const { loadFiles } = require('../Functions/fileLoader');

/**
 * Carga todos los eventos de la carpeta Events/ y los registra en el cliente.
 * @param {import('discord.js').Client} client
 */
async function loadEvents(client) {
    const AsciiTable = require('ascii-table');
    const table = new AsciiTable().setHeading('Event', 'Status');

    client.events.clear();

    const files = await loadFiles('Events');
    for (const file of files) {
        const event = require(file);
        if (!event?.name) {
            console.warn(`[Events] Archivo sin 'name' exportado: ${file}`);
            continue;
        }

        const handler = (...args) => event.execute(...args, client);
        client.events.set(event.name, handler);

        const emitter = event.rest ? client.rest : client;
        event.once ? emitter.once(event.name, handler) : emitter.on(event.name, handler);

        table.addRow(event.name, '✅');
    }

    console.log(table.toString(), '\n✅ Eventos cargados.');
}

module.exports = { loadEvents };
