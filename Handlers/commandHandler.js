'use strict';
const { loadFiles } = require('../Functions/fileLoader');

/**
 * Carga todos los comandos de la carpeta Commands/ y los registra en Discord.
 * @param {import('discord.js').Client} client
 */
async function loadCommands(client) {
    const AsciiTable = require('ascii-table');
    const table = new AsciiTable().setHeading('Command', 'Status');

    client.commands.clear();
    const commandsArray = [];

    const files = await loadFiles('Commands');
    for (const file of files) {
        const command = require(file);
        if (!command?.data?.name) {
            console.warn(`[Commands] Archivo sin 'data.name': ${file}`);
            continue;
        }
        client.commands.set(command.data.name, command);
        commandsArray.push(command.data.toJSON());
        table.addRow(command.data.name, '✅');
    }

    await client.application.commands.set(commandsArray);
    console.log(table.toString(), '\n✅ Comandos cargados.');
}

module.exports = { loadCommands };
