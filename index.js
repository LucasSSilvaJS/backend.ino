require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");

const app = express();
app.use(express.json());

// ====== Conexão MongoDB ======
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("📦 MongoDB conectado!"))
.catch(err => console.error("Erro ao conectar Mongo:", err));

// ====== Modelo de Leitura ======
const LeituraSchema = new mongoose.Schema({
  created_at: { type: Date, default: Date.now },
  temperatura: Number,
  umidade: Number,
  iluminacao: Number,
}, { timestamps: true });

const Leitura = mongoose.model("Leitura", LeituraSchema);

// ====== Thresholds em memória ======
let thresholds = {
  temperature_max: 30,
  humidity_min: 40,
  light_min: 200
};

// ====== Receber dados em tempo real ======
app.post("/api/receive", async (req, res) => {
  const { field1, field2, field3, created_at } = req.body;

  try {
    const leitura = await Leitura.create({
      created_at: created_at ? new Date(created_at) : new Date(),
      temperatura: field1,
      umidade: field2,
      iluminacao: field3
    });
    res.json({ success: true, leitura });
  } catch (err) {
    console.error("Erro ao salvar leitura:", err);
    res.status(500).json({ error: "Erro ao salvar leitura" });
  }
});

// ====== Dashboard ======
app.get("/api/dashboard", async (req, res) => {
  try {
    const latest = await Leitura.findOne().sort({ created_at: -1 });
    if (!latest) return res.json({ latest: null, thresholds });

    res.json({
      latest: {
        temperature: latest.temperatura,
        humidity: latest.umidade,
        light: latest.iluminacao,
        timestamp: latest.created_at
      },
      thresholds
    });
  } catch (err) {
    console.error("Erro ao carregar dashboard:", err);
    res.status(500).json({ error: "Erro ao carregar dashboard" });
  }
});

// ====== Thresholds ======
app.get("/api/thresholds", (req, res) => {
  res.json(thresholds);
});

app.put("/api/thresholds", (req, res) => {
  const { temperature_max, humidity_min, light_min } = req.body;
  thresholds = { temperature_max, humidity_min, light_min };
  res.json(thresholds);
});

// ====== Servidor ======
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});
