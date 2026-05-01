'use strict';
const { loadFiles } = require('../Functions/fileLoader');

/**
 * Carga todos los botones de la carpeta Buttons/ y los registra en el cliente.
 * @param {import('discord.js').Client} client
 */
async function loadButtons(client) {
    client.buttons.clear();

    const files = await loadFiles('Buttons');
    for (const file of files) {
        const button = require(file);
        if (!button?.id) {
            console.warn(`[Buttons] Archivo sin 'id': ${file}`);
            continue;
        }
        client.buttons.set(button.id, button);
    }

    console.log(`✅ Botones cargados (${client.buttons.size}).`);
}

module.exports = { loadButtons };
