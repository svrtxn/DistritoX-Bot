require('dotenv').config();

module.exports = {
  token: process.env.DISCORD_TOKEN,
  
  canales: {
    anuncios: process.env.CANAL_ANUNCIOS_ID
  },
  roles: {
    staff: process.env.ROLES_STAFF.split(',')
  }
};
