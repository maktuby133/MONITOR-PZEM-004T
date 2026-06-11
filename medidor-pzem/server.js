const express = require('express');
const cors = require('cors');
const mqtt = require('mqtt');
const webpush = require('web-push');
const { google } = require('googleapis');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

webpush.setVapidDetails(
  'mailto:seu@email.com',
  'BAr__h-peUzkzXFpUc0azRN70irT6bQVz1PHsUbsWIH2w5BDV1KligHC116A6bXXg_BVW7SpkvCNNm0gadgEuMc',
  '4zqMat_A0PLPWh9Nn9OaVFPcqocvFWp0tQgdslBkMV4'
);

// ── GOOGLE SHEETS ────────────────────────────────────
const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, 'credentials.json'), // Baixe do Google Cloud Console
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const SHEET_ID = 'SEU_SHEET_ID_AQUI'; // ID da planilha do Google
const SHEET_NAME = 'Medidor'; // Nome da aba

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
          dados.voltage,
          dados.current,
          dados.power,
          dados.energy,
          dados.frequency,
          dados.pf,
          dados.energia_hoje,
          dados.energia_semana,
          dados.energia_mes,
          dados.custo,
          dados.rssi,
          dados.timestamp
        ]]
      }
    });
    console.log('[SHEETS] Salvo:', data);
  } catch (err) {
    console.error('[SHEETS] Erro:', err.message);
  }
}

// ── MQTT ─────────────────────────────────────────────
const mqttClient = mqtt.connect('mqtts://07847a67e2944aca805e81e761a6f177.s1.eu.hivemq.cloud:8883', {
  username: 'monitortemp',
  password: '061084Cc@',
  rejectUnauthorized: false
});

const subscriptions = {};
const lastAlert = {};
const ALERT_INTERVAL_MS = 5 * 60 * 1000;

mqttClient.on('connect', () => {
  console.log('[MQTT] Conectado');
  mqttClient.subscribe('casa/+/dados');
  mqttClient.subscribe('casa/+/alerta');
});

mqttClient.on('message', async (topic, message) => {
  try {
    const parts = topic.split('/');
    const deviceId = parts[1];
    const payload = JSON.parse(message.toString());

    // Salva no Google Sheets
    if (topic.endsWith('/dados')) {
      await salvarNoSheets(payload);
    }

    // Alerta corrente alta
    const corrente = parseFloat(payload.corrente);
    if (!isNaN(corrente) && corrente > 15) {
      const key = `${deviceId}_corrente`;
      if (Date.now() - (lastAlert[key] || 0) > ALERT_INTERVAL_MS) {
        lastAlert[key] = Date.now();
        const msg = `⚠️ Sobrecarga: ${corrente}A`;
        await enviarPush(deviceId, msg);
      }
    }

    // Alerta tensão anormal
    const tensao = parseFloat(payload.tensao);
    if (!isNaN(tensao) && (tensao < 110 || tensao > 240)) {
      const key = `${deviceId}_tensao`;
      if (Date.now() - (lastAlert[key] || 0) > ALERT_INTERVAL_MS) {
        lastAlert[key] = Date.now();
        const msg = `⚠️ Tensão anormal: ${tensao}V`;
        await enviarPush(deviceId, msg);
      }
    }
  } catch(e) {
    console.error('[MQTT] Erro:', e);
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

    // Verifica se já tem cabeçalho
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
            'Data/Hora',
            'Tensão (V)',
            'Corrente (A)',
            'Potência (W)',
            'Energia Total (kWh)',
            'Frequência (Hz)',
            'Fator Potência',
            'Energia Hoje (kWh)',
            'Energia Semana (kWh)',
            'Energia Mês (kWh)',
            'Custo (R$)',
            'RSSI (dBm)',
            'Timestamp'
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
  inicializarPlanilha();
});
