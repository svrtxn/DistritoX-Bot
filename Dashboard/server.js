const express = require('express');
const path = require('path');
const Transaccion = require('../Models/transaccion');

const app = express();
const PORT = process.env.PORT || 3000;

const startDashboard = (client) => {

    app.use(express.static(path.join(__dirname, 'public')));
    app.use(express.json());

    app.get('/api/finanzas', async (req, res) => {
        try {
            const transacciones = await Transaccion.find().sort({ fechaRegistro: -1 }).limit(50);
            const allTransacciones = await Transaccion.find();

            const ingresos = allTransacciones.filter(t => t.tipo === 'INGRESO').reduce((acc, t) => acc + t.monto, 0);
            const gastos = allTransacciones.filter(t => t.tipo === 'GASTO').reduce((acc, t) => acc + t.monto, 0);
            const total = ingresos - gastos;

            // Obtenemos el ID del servidor (Guild) para armar los links
            // Asumimos que el bot está en al menos un servidor, tomamos el primero.
            const guildId = client.guilds.cache.first()?.id;

            const datosTabla = await Promise.all(transacciones.map(async (t) => {

                let staffData = { name: 'Desconocido', avatar: 'https://cdn.discordapp.com/embed/avatars/0.png' };
                try {
                    const staff = await client.users.fetch(t.staffId);
                    staffData = { name: staff.username, avatar: staff.displayAvatarURL() };
                } catch (e) { }

                // Usuario Donador
                let userData = { name: 'N/A', avatar: null };

                // SOLO buscamos usuario si es INGRESO. Si es GASTO, lo ignoramos a propósito.
                if (t.tipo === 'INGRESO' && t.usuarioId) {
                    try {
                        const user = await client.users.fetch(t.usuarioId);
                        userData = { name: user.username, avatar: user.displayAvatarURL() };
                    } catch (e) { }
                }

                const fecha = new Date(t.fechaRegistro).toLocaleDateString('es-CL', {
                    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                });

                return {
                    id: t._id.toString().slice(-6).toUpperCase(),
                    fullId: t._id, // ID real para operaciones internas (borrar/editar)
                    fecha: fecha,
                    tipo: t.tipo,
                    monto: t.monto,
                    categoria: t.categoria,
                    staff: staffData,
                    usuario: userData,
                    // DATOS NUEVOS PARA EL LINK
                    canalId: t.canalId,
                    guildId: guildId
                };
            }));

            res.json({
                stats: { total, ingresos, gastos, count: allTransacciones.length },
                registros: datosTabla
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    });

    // Endpoint para borrar una transacción
    app.delete('/api/finanzas/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const deleted = await Transaccion.findByIdAndDelete(id);
            if (!deleted) {
                return res.status(404).json({ error: 'Transacción no encontrada' });
            }
            res.json({ success: true, message: 'Registro eliminado correctamente' });
        } catch (error) {
            console.error("Error al borrar:", error);
            res.status(500).json({ error: 'Error al eliminar el registro' });
        }
    });

    app.listen(PORT, () => {
        console.log(`🌐 Dashboard Financiero online en: http://localhost:${PORT}`);
    });
};

module.exports = startDashboard;