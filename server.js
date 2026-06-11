const express = require('express');
const mqtt = require('mqtt');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'static')));
app.use(express.json());

const MQTT_BROKER = 'mqtts://cee37ceeb13242b3a9099f84327c2c1c.s1.eu.hivemq.cloud';
const MQTT_PORT = 8883;
const MQTT_TOPIC = 'casa/medidor01';
const MQTT_USER = 'monitortemp';
const MQTT_PASS = '061084Cc@';

console.log('Iniciando conexão MQTT...');
console.log('Broker:', MQTT_BROKER);
console.log('Tópico:', MQTT_TOPIC);

const client = mqtt.connect(MQTT_BROKER, {
  port: MQTT_PORT,
  username: MQTT_USER,
  password: MQTT_PASS,
  protocol: 'mqtts',
  reconnectPeriod: 5000,
  connectTimeout: 30000,
  rejectUnauthorized: false
});

let ultimaLeitura = {
  tensao: 0,
  corrente: 0,
  potencia: 0,
  energia: 0,
  timestamp: null,
  status: 'Conectando ao MQTT...'
};

client.on('connect', () => {
  console.log('✅ Conectado ao MQTT com sucesso!');
  ultimaLeitura.status = 'Conectado';
  client.subscribe(MQTT_TOPIC, (err) => {
    if (err) {
      console.error('❌ Erro ao inscrever no tópico:', err);
      ultimaLeitura.status = 'Erro ao inscrever';
    } else {
      console.log('✅ Inscrito no tópico:', MQTT_TOPIC);
      ultimaLeitura.status = 'Aguardando dados...';
    }
  });
});

client.on('message', (topic, message) => {
  try {
    const dados = JSON.parse(message.toString());
    ultimaLeitura = {
      tensao: parseFloat(dados.tensao) || 0,
      corrente: parseFloat(dados.corrente) || 0,
      potencia: parseFloat(dados.potencia) || 0,
      energia: parseFloat(dados.energia) || 0,
      timestamp: new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
      status: 'Online'
    };
    console.log('📊 Dados recebidos:', ultimaLeitura);
  } catch (e) {
    console.error('❌ Erro ao processar mensagem MQTT:', e.message);
    ultimaLeitura.status = 'Erro nos dados';
  }
});

client.on('error', (err) => {
  console.error('❌ Erro MQTT:', err.message);
  ultimaLeitura.status = 'Erro: ' + err.message;
});

client.on('offline', () => {
  console.log('⚠️ MQTT Offline');
  ultimaLeitura.status = 'Offline';
});

client.on('reconnect', () => {
  console.log('🔄 Reconectando ao MQTT...');
  ultimaLeitura.status = 'Reconectando...';
});

app.get('/api/dados', (req, res) => {
  res.json(ultimaLeitura);
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'static', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server rodando na porta ${PORT}`);
  console.log(`📡 Aguardando dados do ESP32 no tópico: ${MQTT_TOPIC}`);
});
