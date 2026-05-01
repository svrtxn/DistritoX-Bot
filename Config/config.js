require('dotenv').config();

module.exports = {
  token: process.env.DISCORD_TOKEN,
  
  canales: {
    anuncios: process.env.CANAL_ANUNCIOS_ID,
    yakuza: process.env.CANAL_YAKUZA,
    lspd: process.env.CANAL_LSPD
  },
  roles: {
    staff: process.env.ROLES_STAFF ? process.env.ROLES_STAFF.split(',') : [],
    lspd: process.env.ROL_LSPD,
    jefeBanda: process.env.ROL_JEFEBANDA,
    yakuza: process.env.ROL_YAKUZA,
    staffAdmin: [
      "1072383514676314183", // RANGO_OWNER
      "1396558259154063391", // RANGO_JEFE_STAFF
      "1414332509868523690", // RANGO_DEVELOPER
      "1465139719892500610", // RANGO_ENCARGADO_AREA
      "1389703176369995959", // RANGO_MOD_AREA
      "1403567734570094682", // RANGO_MOD
      "1405968658605412493"  // RANGO_STAFF
    ]
  }
};

