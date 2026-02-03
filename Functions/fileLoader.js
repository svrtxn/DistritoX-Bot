const { glob } = require('glob');

async function loadFiles(dirName) {
    const pattern = `${process.cwd().replace(/\\/g, '/')}/${dirName}/**/*.{js,ts}`;
    const Files = await glob(pattern);
    Files.forEach((file) => delete require.cache[require.resolve(file)]);
    return Files;
}

module.exports = { loadFiles };
