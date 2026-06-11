const express = require('express');
const cors = require('cors');
const mqtt = require('mqtt');
const webpush = require('web-push');
const { google } = require('googleapis');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ── SERVIR ARQUIVOS ESTÁTICOS - IMPORTANTE! ──────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ── ROTA PRINCIPAL - FORÇA INDEX.HTML ───────────────────────
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

webpush.setVapidDetails(
  process.env.VAPID_MAILTO || 'mailto:seu@email.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// ── GOOGLE SHEETS ────────────────────────────────────
const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, 'credentials.json'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const SHEET_NAME = process.env.GOOGLE_SHEET_NAME || 'Medidor';

async function salvarNoSheets(dados) {
  try {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    const data = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A:M`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[
          data,
          dados.voltage || 0,
          dados.current || 0,
          dados.power || 0,
          dados.energy || 0,
          dados.frequency || 0,
          dados.pf || 0,
          dados.energia_hoje || 0,
          dados.energia_semana || 0,
          dados.energia_mes || 0,
          dados.custo || 0,
          dados.rssi || 0,
          dados.timestamp || Date.now()
        ]]
      }
    });
    console.log('[SHEETS] Salvo:', data);
  } catch (err) {
    console.error('[SHEETS] Erro:', err.message);
  }
}

// ── MQTT ─────────────────────────────────────────────
const mqttClient = mqtt.connect(`mqtts://${process.env.MQTT_HOST}:${process.env.MQTT_PORT}`, {
  username: process.env.MQTT_USER,
  password: process.env.MQTT_PASS,
  rejectUnauthorized: false
});

const subscriptions = {};
const lastAlert = {};
const ALERT_INTERVAL_MS = 5 * 60 * 1000;

mqttClient.on('connect', () => {
  console.log('[MQTT] Conectado');
  mqttClient.subscribe('casa/+/dados');
  mqttClient.subscribe('casa/+/alerta');
  mqttClient.subscribe('casa/+/resumo');
});

mqttClient.on('message', async (topic, message) => {
  try {
    const parts = topic.split('/');
    const deviceId = parts[1];
    const payload = JSON.parse(message.toString());

    if (topic.endsWith('/dados')) {
      await salvarNoSheets(payload);
    }

    const corrente = parseFloat(payload.corrente || payload.current);
    if (!isNaN(corrente) && corrente > 15) {
      const key = `${deviceId}_corrente`;
      if (Date.now() - (lastAlert[key] || 0) > ALERT_INTERVAL_MS) {
        lastAlert[key] = Date.now();
        await enviarPush(deviceId, `⚠️ Sobrecarga: ${corrente.toFixed(2)}A`);
      }
    }

    const tensao = parseFloat(payload.tensao || payload.voltage);
    if (!isNaN(tensao) && (tensao < 110 || tensao > 240)) {
      const key = `${deviceId}_tensao`;
      if (Date.now() - (lastAlert[key] || 0) > ALERT_INTERVAL_MS) {
        lastAlert[key] = Date.now();
        await enviarPush(deviceId, `⚠️ Tensão anormal: ${tensao.toFixed(1)}V`);
      }
    }
  } catch(e) {
    console.error('[MQTT] Erro:', e.message);
  }
});

async function enviarPush(deviceId, msg) {
  const subs = subscriptions[deviceId] || [];
  subs.forEach(async sub => {
    try {
      await webpush.sendNotification(sub, JSON.stringify({
        title: '⚡ Alerta Medidor',
        body: msg,
        icon: '/icon-192.png'
      }));
    } catch(e) {
      console.error('[PUSH] Erro:', e.message);
    }
  });
}

app.post('/subscribe', (req, res) => {
  const { deviceId, subscription } = req.body;
  if (!subscriptions[deviceId]) subscriptions[deviceId] = [];
  subscriptions[deviceId].push(subscription);
  res.json({ ok: true });
});

// Inicializa planilha com cabeçalho
async function inicializarPlanilha() {
  try {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A1:M1`
    });

    if (!res.data.values || res.data.values.length === 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `${SHEET_NAME}!A1:M1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[
            'Data/Hora', 'Tensão (V)', 'Corrente (A)', 'Potência (W)',
            'Energia Total (kWh)', 'Frequência (Hz)', 'Fator Potência',
            'Energia Hoje (kWh)', 'Energia Semana (kWh)', 'Energia Mês (kWh)',
            'Custo (R$)', 'RSSI (dBm)', 'Timestamp'
          ]]
        }
      });
      console.log('[SHEETS] Cabeçalho criado');
    }
  } catch (err) {
    console.error('[SHEETS] Erro inicialização:', err.message);
  }
}

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Acesse: http://localhost:${PORT}`);
  inicializarPlanilha();
});
