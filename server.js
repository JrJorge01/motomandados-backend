const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

let users = [
    { user: "admin", pass: "1234", role: "admin" }
];

let pedidos = [];

// REGISTRO
app.post('/register', (req, res) => {
    let { user, pass } = req.body;

    if (!user || !pass) {
        return res.json({ ok: false });
    }

    const userLower = user.toLowerCase();

    if (["admin"].includes(userLower)) {
        return res.json({ ok: false });
    }

    const existe = users.find(u => u.user === userLower);

    if (existe) {
        return res.json({ ok: false });
    }

    users.push({ user: userLower, pass, role: "cliente" });

    res.json({ ok: true });
});

// LOGIN
app.post('/login', (req, res) => {
    let { user, pass } = req.body;

    const userLower = user.toLowerCase();

    const encontrado = users.find(
        u => u.user === userLower && u.pass === pass
    );

    if (!encontrado) return res.json({ ok: false });

    res.json({ ok: true, role: encontrado.role });
});

// CREAR PEDIDO
app.post('/mensaje', (req, res) => {

    let { mensaje, user, lat, lng, direccion, telefono } = req.body;

    pedidos.push({
        mensaje,
        user: user.toLowerCase(),
        lat,
        lng,
        direccion,
        telefono,
        status: "pendiente" // ✅ estado inicial
    });

    res.json({ ok: true });
});

// CAMBIAR ESTATUS
app.post('/estatus', (req, res) => {
    const { index, status } = req.body;

    if (pedidos[index]) {
        pedidos[index].status = status;
        return res.json({ ok: true });
    }

    res.json({ ok: false });
});

// VER PEDIDOS
app.get('/pedidos', (req, res) => {
    res.json(pedidos);
});

// TRACKING (repartidor envía ubicación)
app.post('/ubicacion', (req, res) => {

    const { index, lat, lng } = req.body;

    if (pedidos[index]) {
        pedidos[index].repartidorLat = lat;
        pedidos[index].repartidorLng = lng;
    }

    res.json({ ok: true });
});


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Servidor corriendo en puerto", PORT);
});
