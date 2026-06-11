const PROJETO = {
  nome: "Medidor de Energia PZEM",
  icone: "⚡",
  cor: "#f57c00",
  deviceId: "medidor01",
  topicoBase: "casa/medidor01",

  sensores: [
    { id: "voltage", nome: "Tensão", unidade: "V", icone: "fa-bolt", alerta: { tipo: "range", min: 110, max: 240 } },
    { id: "current", nome: "Corrente", unidade: "A", icone: "fa-wave-square" },
    { id: "power", nome: "Potência", unidade: "W", icone: "fa-fire", alerta: { tipo: "max", valor: 3000 } },
    { id: "energy", nome: "Consumo Total", unidade: "kWh", icone: "fa-chart-line" },
    { id: "frequency", nome: "Frequência", unidade: "Hz", icone: "fa-wave-square" },
    { id: "pf", nome: "Fator Potência", unidade: "", icone: "fa-percent" },
    { id: "energia_hoje", nome: "Hoje", unidade: "kWh", icone: "fa-calendar-day" },
    { id: "energia_semana", nome: "Semana", unidade: "kWh", icone: "fa-calendar-week" },
    { id: "energia_mes", nome: "Mês", unidade: "kWh", icone: "fa-calendar" },
    { id: "custo", nome: "Custo Mês", unidade: "R$", icone: "fa-dollar-sign" }
  ],

  botoes: [
    { texto: "Zerar Consumo", comando: "reset", cor: "#d32f2f", icone: "fa-redo", confirmacao: "Zerar contador?" },
    { texto: "Cortar Energia", comando: "desligar", cor: "#ff9e00", icone: "fa-power-off", confirmacao: "CORTAR ENERGIA?" },
    { texto: "Religar", comando: "ligar", cor: "#38b000", icone: "fa-plug" }
  ]
};
