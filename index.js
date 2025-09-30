require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const axios = require("axios");

const app = express();

// ====== Conexão com MongoDB ======
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("📦 MongoDB conectado!"))
.catch(err => console.error("Erro ao conectar Mongo:", err));

// ====== Modelo ======
const LeituraSchema = new mongoose.Schema({
  created_at: Date,
  temperatura: Number,
  umidade: Number,
  iluminacao: Number,
}, { timestamps: true });

const Leitura = mongoose.model("Leitura", LeituraSchema);

// ====== Função para importar dados do ThingSpeak ======
async function importarDados() {
  try {
    const url = `https://api.thingspeak.com/channels/${process.env.THINGSPEAK_CHANNEL_ID}/feeds.json?api_key=${process.env.THINGSPEAK_API_KEY}&results=5`;
    const response = await axios.get(url);

    for (const feed of response.data.feeds) {
      await Leitura.create({
        created_at: feed.created_at,
        temperatura: feed.field1,
        umidade: feed.field2,
        iluminacao: feed.field3,
      });
    }
    console.log("✅ Dados importados com sucesso!");
  } catch (err) {
    console.error("Erro ao importar dados:", err.message);
  }
}

// ====== Rotas ======
app.get("/", (req, res) => {
  res.send("API Thingspeak + MongoDB rodando 🚀");
});

app.get("/leituras", async (req, res) => {
  const leituras = await Leitura.find()
  .sort({ created_at: -1 }) // ordena do mais novo pro mais antigo
  .limit(10);               // pega só os 10 últimos
  res.json(leituras);
});

app.get("/atualizar", async (req, res) => {
  await importarDados();
  res.json({ message: "Dados atualizados!" });
});

// ====== Servidor ======
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});

// Importa dados a cada 1 minuto
setInterval(importarDados, 60000);
