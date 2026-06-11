⚡ Medidor de Energia PZEM-004T + LoRa

Monitor de consumo de energia em tempo real com ESP32, PZEM-004T v3.0, LoRa LLCC68, MQTT e Google Sheets.

Dashboard

License
🔧 Hardware
Transmissor - ESP32-C3 Mini

    MCU: ESP32-C3 SuperMini
    Medidor: PZEM-004T v3.0 - GPIO6(RX) GPIO7(TX)
    LoRa: LLCC68 868MHz - GPIO10(NSS) GPIO1(DIO1) GPIO3(NRST) GPIO2(BUSY)
    Botão Config: GPIO9
    Alimentação: 5V USB ou bateria Li-ion

Receptor - ESP32-WROOM

    MCU: ESP32-WROOM-32
    LoRa: LLCC68 868MHz - GPIO5(NSS) GPIO4(DIO1) GPIO14(NRST) GPIO27(BUSY)
    Relé: GPIO26 - Corte/religamento remoto
    Buzzer: GPIO25 - Alertas sonoros
    Botão Reset: GPIO0 - Modo AP Config

✨ Funcionalidades

    Medidores analógicos SVG com ponteiro animado em tempo real
    Histórico semanal/mensal sincronizado via NTP
    Salvamento automático no Google Sheets a cada 30min
    Alertas push - Sobrecarga >15A, Tensão anormal <110V ou >240V
    Deep Sleep no transmissor - 30s entre envios
    Modo AP nos dois ESP32 pra pareamento via DeviceID
    Dashboard PWA - Instala no celular
    Relé remoto - Corta/religa energia pelo dashboard

🚀 Instalação
1. Clonar repositório
bash

git clone https://github.com/seu-usuario/medidor-pzem.git
cd medidor-pzem
npm install


