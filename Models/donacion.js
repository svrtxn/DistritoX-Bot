const mongoose = require('mongoose');

const donacionSchema = new mongoose.Schema({
    usuario: { type: String, required: true }, 
    monto: { type: Number, required: true },
    categoria: { type: String, required: true },
    metodo: { type: String, required: true },
    canal: { type: String, required: true },
    comentario: { type: String, default: "No se proporcionó comentario." },
    mensualidad: { type: String, required: true },
    fechaRegistro: { type: Date, default: Date.now },
    fechaRenovacion: { type: Date, required: false } 
});

const Donacion = mongoose.model('Donation', donacionSchema);

module.exports = Donacion;
