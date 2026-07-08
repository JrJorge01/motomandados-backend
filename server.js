const express = require('express');
const cors = require('cors');
const fs = require('fs');
const mongoose = require('mongoose');

const app = express();

mongoose.connect(
"mongodb://rappyranch:SBWoa5oZFs6uHfBN@ac-4nsdvgw-shard-00-00.hfg15il.mongodb.net:27017,ac-4nsdvgw-shard-00-01.hfg15il.mongodb.net:27017,ac-4nsdvgw-shard-00-02.hfg15il.mongodb.net:27017/?ssl=true&replicaSet=atlas-orqof7-shard-0&authSource=admin&appName=RappyRanch"
)
    .then(() => {
        console.log("✅ MongoDB conectado");
    })
    .catch(err => {
        console.error("❌ Error Mongo:", err);
    });

const UserSchema = new mongoose.Schema({
    user: String,
    pass: String,
    role: String
});
const User = mongoose.model('User', UserSchema);

async function crearAdmin() {

    const existe = await User.findOne({
        user: "admin"
    });

    if (!existe) {

        await User.create({
            user: "admin",
            pass: "1234",
            role: "admin"
        });

        console.log("✅ Admin creado");
    }
}


crearAdmin();


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
app.post('/register', async (req, res) => {

    let { user, pass } = req.body;

    if (!user || !pass)
        return res.json({ ok: false });

    user = user.toLowerCase().trim();
    pass = pass.trim();

    if (user === "admin")
        return res.json({ ok: false });

    const existe = await User.findOne({
        user
    });

    if (existe)
        return res.json({ ok: false });

    await User.create({
        user,
        pass,
        role: "cliente"
    });

    res.json({ ok: true });
});

// LOGIN
// LOGIN
app.post('/login', async (req, res) => {

    let { user, pass } = req.body;

    user = user.toLowerCase().trim();
    pass = pass.trim();

    const encontrado = await User.findOne({
        user,
        pass
    });

    if (!encontrado)
        return res.json({ ok: false });

    res.json({
        ok: true,
        role: encontrado.role
    });
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

app.get('/usuarios', async (req, res) => {

    const usuarios = await User.find();

    res.json(usuarios);
});


app.get('/version', (req, res) => {
    res.send("Mongo Version 1");
});


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Servidor corriendo en puerto", PORT);
});
