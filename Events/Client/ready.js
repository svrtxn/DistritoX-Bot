const { Client, GatewayIntentBits } = require('discord.js');
const mongoose = require('mongoose');
require('dotenv').config();  // Importa dotenv para cargar las variables de entorno

// Configuración de la conexión a MongoDB
mongoose.connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => {
    console.log('✅ Conexión exitosa a MongoDB');
})
.catch((error) => {
    console.error('❌ Error al conectar a MongoDB:', error);
});

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        // Agrega más intents según sea necesario
    ]
});

client.once('ready', () => {
    console.log(`✅ El cliente se ha iniciado correctamente: ${client.user.tag}`);
});

// Inicia sesión con tu token de Discord
client.login(process.env.BOT_TOKEN);
