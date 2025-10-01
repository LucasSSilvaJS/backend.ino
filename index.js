require("dotenv").config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());

// ====== Conexão MongoDB ======
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("📦 MongoDB conectado!"))
.catch(err => console.error("Erro ao conectar Mongo:", err));

// ====== Model ======
const LeituraSchema = new mongoose.Schema({
  created_at: { type: Date, default: Date.now },
  temperatura: Number,
  umidade: Number,
  iluminacao: Number
}, { timestamps: true });

const Leitura = mongoose.model("Leitura", LeituraSchema);

// ====== Thresholds ======
let thresholds = {
  temperature_max: 30,
  humidity_min: 40,
  light_min: 500
};

// ====== Dados em memória ======
let sensorData = [];

// ====== Receber dados em tempo real ======
app.post('/api/sensor-data', async (req, res) => {
  try {
    const { temperature, humidity, light, device_id } = req.body;

    const newData = {
      device_id: device_id || 'esp32_001',
      temperature: parseFloat(temperature),
      humidity: parseFloat(humidity),
      light: parseInt(light),
      timestamp: new Date().toISOString(),
      alert: temperature > thresholds.temperature_max ||
             humidity < thresholds.humidity_min ||
             light < thresholds.light_min
    };

    sensorData.push(newData);
    if (sensorData.length > 100) sensorData = sensorData.slice(-100);

    // Salvar no MongoDB
    await Leitura.create({
      created_at: new Date(newData.timestamp),
      temperatura: newData.temperature,
      umidade: newData.humidity,
      iluminacao: newData.light
    });

    // Emitir update em tempo real
    io.emit('sensor-update', newData);

    res.json({ success: true, data: newData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ====== Dashboard ======
app.get('/api/dashboard', async (req, res) => {
  try {
    const latestMongo = await Leitura.findOne().sort({ created_at: -1 });
    const latest = sensorData[sensorData.length -1] || latestMongo || null;

    const last24h = await Leitura.find({
      created_at: { $gte: new Date(Date.now() - 24*60*60*1000) }
    });

    const stats_24h = {
      total_readings: last24h.length,
      alerts: last24h.filter(d => d.temperatura > thresholds.temperature_max ||
                                   d.umidade < thresholds.humidity_min ||
                                   d.iluminacao < thresholds.light_min).length,
      avg_temperature: last24h.length ? (last24h.reduce((sum,d)=>sum+d.temperatura,0)/last24h.length).toFixed(1) : 0,
      avg_humidity: last24h.length ? (last24h.reduce((sum,d)=>sum+d.umidade,0)/last24h.length).toFixed(1) : 0,
      avg_light: last24h.length ? Math.round(last24h.reduce((sum,d)=>sum+d.iluminacao,0)/last24h.length) : 0
    };

    res.json({ latest, thresholds, stats_24h });
  } catch(err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao carregar dashboard" });
  }
});

// ====== Thresholds ======
app.get('/api/thresholds', (req,res)=>res.json(thresholds));
app.put('/api/thresholds', (req,res)=>{
  const { temperature_max, humidity_min, light_min } = req.body;
  if(temperature_max !== undefined) thresholds.temperature_max = parseFloat(temperature_max);
  if(humidity_min !== undefined) thresholds.humidity_min = parseFloat(humidity_min);
  if(light_min !== undefined) thresholds.light_min = parseInt(light_min);
  io.emit('threshold-update', thresholds); // opcional: informar clientes via socket
  res.json({ success: true, thresholds });
});

// ====== Socket.IO ======
io.on('connection', socket => {
  console.log('Cliente conectado:', socket.id);
  socket.emit('initial-data', sensorData.slice(-50));
  socket.on('disconnect', () => console.log('Cliente desconectado:', socket.id));
});

// ====== Servidor ======
const PORT = process.env.PORT || 3000;
server.listen(PORT, ()=>console.log(`🚀 API rodando em http://localhost:${PORT}`));
