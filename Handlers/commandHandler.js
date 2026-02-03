const { loadFiles } = require('../Functions/fileLoader'); 

async function loadCommands(client) {
    const ascii = require('ascii-table');
    const table = new ascii().setHeading('Comands', 'Status');
    await client.commands.clear();
    let commandsArray = [];

    const Files = await loadFiles('Commands');

    Files.forEach((file) => {
        const command = require(file);
        if (!command?.data?.name) return;

        client.commands.set(command.data.name, command);
        commandsArray.push(command.data.toJSON());
        table.addRow(command.data.name, '✅');
    });

    await client.application.commands.set(commandsArray);
    console.log(table.toString(), '\n✅ Comandos cargados correctamente');
}

module.exports = { loadCommands };
