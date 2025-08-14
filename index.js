require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

// Conexão com MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log("MongoDB conectado"))
.catch(err => console.log(err));

// Schema de usuários
const UsuarioSchema = new mongoose.Schema({
    robloxId: String,
    discordId: String,
    cargo: String
});
const Usuario = mongoose.model('Usuario', UsuarioSchema);

// Middleware de segurança
function verificarToken(req, res, next) {
    const token = req.headers['x-api-token'];
    if(token !== process.env.API_TOKEN) return res.status(403).json({error: "Token inválido"});
    next();
}

// Vincular conta
app.post('/vincular', verificarToken, async (req, res) => {
    const { robloxId, discordId, cargo } = req.body;
    if(!robloxId || !discordId) return res.status(400).json({error: "Campos faltando"});

    let usuario = await Usuario.findOne({robloxId});
    if(usuario) {
        usuario.discordId = discordId;
        usuario.cargo = cargo || usuario.cargo;
    } else {
        usuario = new Usuario({robloxId, discordId, cargo: cargo || "civil"});
    }
    await usuario.save();
    res.json({success: true, usuario});
});

// Obter cargo do Roblox
app.get('/cargo/:robloxId', verificarToken, async (req, res) => {
    const usuario = await Usuario.findOne({robloxId: req.params.robloxId});
    if(!usuario) return res.status(404).json({error: "Usuário não encontrado"});
    res.json({cargo: usuario.cargo});
});

// Atualizar cargo (usado pelo bot Discord)
app.post('/atualizarCargo', verificarToken, async (req, res) => {
    const { robloxId, cargo } = req.body;
    if(!robloxId || !cargo) return res.status(400).json({error: "Campos faltando"});

    const usuario = await Usuario.findOne({robloxId});
    if(!usuario) return res.status(404).json({error: "Usuário não encontrado"});

    usuario.cargo = cargo;
    await usuario.save();
    res.json({success: true, usuario});
});

// Start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API rodando na porta ${PORT}`));
