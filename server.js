const express = require('express');
const cors = require('cors');
const fs = require('fs');

const app = express();

app.use(cors());
app.use(express.json());

const USERS_FILE = 'users.json';

// 🔥 Cargar usuarios desde archivo
function loadUsers() {
    try {
        return JSON.parse(fs.readFileSync(USERS_FILE));
    } catch {
        return [{ user: "admin", pass: "1234", role: "admin" }];
    }
}

// 🔥 Guardar usuarios
function saveUsers(data) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2));
}

let users = loadUsers();

let pedidos = [];
let onlineUsers = {};

app.post('/heartbeat', (req, res) => {
    const { user } = req.body;

    if (user) {
        onlineUsers[user] = Date.now();
    }

    res.json({ ok: true });
});

app.get('/online', (req, res) => {

    const now = Date.now();
    const activos = {};

    for (let u in onlineUsers) {
        if (now - onlineUsers[u] < 10000) { // 10 segundos
            activos[u] = true;
        }
    }

    res.json(activos);
});
// REGISTRO
app.post('/register', (req, res) => {
    let { user, pass } = req.body;

    if (!user || !pass) return res.json({ ok: false });

    user = user.toLowerCase().trim();
    pass = pass.trim();

    if (user === "admin") return res.json({ ok: false });

    const existe = users.find(u => u.user === user);

    if (existe) return res.json({ ok: false });

    users.push({ user, pass, role: "cliente" });

    saveUsers(users); // 🔥 GUARDAR

    res.json({ ok: true });
});

// LOGIN
app.post('/login', (req, res) => {
    let { user, pass } = req.body;

    user = user.toLowerCase().trim();
    pass = pass.trim();

    const encontrado = users.find(
        u => u.user === user && u.pass === pass
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
        status: "pendiente"
    });

    res.json({ ok: true });
});

// ESTATUS
app.post('/estatus', (req, res) => {
    const { index, status } = req.body;

    if (pedidos[index]) {
        pedidos[index].status = status;
        return res.json({ ok: true });
    }

    res.json({ ok: false });
});

// PEDIDOS
app.get('/pedidos', (req, res) => {
    res.json(pedidos);
});

// TRACKING
app.post('/ubicacion', (req, res) => {
    const { index, lat, lng } = req.body;

    if (pedidos[index]) {
        pedidos[index].repartidorLat = lat;
        pedidos[index].repartidorLng = lng;
    }

    res.json({ ok: true });
});


// VER USUARIOS (solo admin lo debería usar)
app.get('/usuarios', (req, res) => {
    res.json(users);
});


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Servidor corriendo en puerto", PORT);
});
