⚡ Medidor PZEM-004T com LoRa + MQTT + Google Sheets

Dashboard web em tempo real para monitorar consumo de energia usando PZEM-004T, ESP32, LoRa e integração com MQTT + Google Sheets.
📋 Features

    Dashboard em tempo real com medidores analógicos estilo industrial
    Comunicação LoRa 5km entre medidor e gateway
    MQTT via HiveMQ público
    Google Sheets para histórico automático
    PWA - instala como app no celular
    Notificações push de alertas
    Custo em R$ calculável por kWh

🚀 Deploy Rápido
Render.com

    Fork este repositório
    Crie um Web Service no Render
    Build Command: npm install
    Start Command: node server.js
    Adicione as variáveis de ambiente do .env.example

⚙️ Configuração
1. Variáveis de Ambiente

Crie um arquivo .env baseado no .env.example:
env

MQTT_BROKER=mqtt://broker.hivemq.com
MQTT_PORT=1883
MQTT_TOPIC=casa/medidor01
GOOGLE_SHEET_ID=seu_id_aqui
PORT=3000
