const express = require('express');
const mqtt = require('mqtt');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Servir arquivos estáticos da pasta public
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Variáveis de ambiente do Railway
const MQTT_BROKER = process.env.MQTT_BROKER || 'cee37ceeb13242b3a9099f84327c2c1c.s1.eu.hivemq.cloud';
const MQTT_PORT = process.env.MQTT_PORT || 1883;
const MQTT_TOPIC = process.env.MQTT_TOPIC || 'casa/medidor01';

// Conecta no MQTT
const client = mqtt.connect(MQTT_BROKER, {
  port: MQTT_PORT,
  reconnectPeriod: 5000
});

let ultimaLeitura = {
  tensao: 0,
  corrente: 0,
  potencia: 0,
  energia: 0,
  timestamp: null
};

client.on('connect', () => {
  console.log('Conectado ao MQTT:', MQTT_BROKER);
  client.subscribe(MQTT_TOPIC, (err) => {
    if (err) {
      console.error('Erro ao inscrever no tópico:', err);
    } else {
      console.log('Inscrito no tópico:', MQTT_TOPIC);
    }
  });
});

client.on('message', (topic, message) => {
  try {
    const dados = JSON.parse(message.toString());
    ultimaLeitura = {
      tensao: dados.tensao || 0,
      corrente: dados.corrente || 0,
      potencia: dados.potencia || 0,
      energia: dados.energia || 0,
      timestamp: new Date().toISOString()
    };
    console.log('Dados recebidos:', ultimaLeitura);
  } catch (e) {
    console.error('Erro ao processar mensagem MQTT:', e);
  }
});

client.on('error', (err) => {
  console.error('Erro MQTT:', err);
});

// Rota API pra pegar última leitura
app.get('/api/dados', (req, res) => {
  res.json(ultimaLeitura);
});

// Rota principal serve o index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server rodando na porta ${PORT}`);
});
