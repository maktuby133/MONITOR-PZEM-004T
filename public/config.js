const PROJETO = {
  nome: "Medidor de Energia PZEM",
  icone: "⚡",
  cor: "#f57c00",
  deviceId: "medidor01",
  topicoBase: "casa/medidor01",

  sensores: [
    {
      id: "tensao",
      nome: "Tensão",
      unidade: "V",
      icone: "fa-bolt",
      alerta: { tipo: "range", min: 110, max: 240, msg: "Tensão Anormal" }
    },
    { id: "corrente", nome: "Corrente", unidade: "A", icone: "fa-wave-square" },
    {
      id: "potencia",
      nome: "Potência",
      unidade: "W",
      icone: "fa-fire",
      alerta: { tipo: "max", valor: 3000, msg: "Sobrecarga" }
    },
    { id: "consumo_kwh", nome: "Consumo Total", unidade: "kWh", icone: "fa-chart-line" },
    { id: "frequencia", nome: "Frequência", unidade: "Hz", icone: "fa-wave-square" },
    { id: "fp", nome: "Fator Potência", unidade: "", icone: "fa-percent" },
    { id: "custo", nome: "Custo", unidade: "R$", icone: "fa-dollar-sign" }
  ],

  botoes: [
    { texto: "Zerar Consumo", comando: "reset", cor: "#d32f2f", icone: "fa-redo", confirmacao: "Zerar contador de kWh?" },
    { texto: "Cortar Energia", comando: "desligar", cor: "#ff9e00", icone: "fa-power-off", confirmacao: "CORTAR ENERGIA GERAL?" },
    { texto: "Religar", comando: "ligar", cor: "#38b000", icone: "fa-plug" }
  ]
};
