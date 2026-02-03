const mongoose = require('mongoose');

const transaccionSchema = new mongoose.Schema({
    tipo: { type: String, enum: ['INGRESO', 'GASTO'], required: true },
    
    monto: { type: Number, required: true },
    categoria: { type: String, required: true },
    metodo: { type: String, required: true },
    comentario: { type: String, default: "Sin comentarios" },

    staffId: { type: String, required: true },
    usuarioId: { type: String, required: false },
    
    canalId: { type: String, required: true }, 
    canalNombre: { type: String, required: true }, 

    fechaRegistro: { type: Date, default: Date.now },
    esMensual: { type: Boolean, default: false },
    fechaRenovacion: { type: Date, required: false },
    
    recordatorioEnviado: { type: Boolean, default: false },
    sincronizadoWeb: { type: Boolean, default: false }
});

module.exports = mongoose.model('Transaccion', transaccionSchema);