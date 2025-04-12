// Configuração do gráfico para os novos dados
let chart = new ApexCharts(document.querySelector("#chart"), {
  chart: {
      type: 'line',
      height: 400,
      background: '#1F2937',
      foreColor: '#E5E7EB'
  },
  series: [
      { name: 'Umidade (%)', data: [] },
      { name: 'Tensão (V)', data: [] },
      { name: 'Temperatura (°C)', data: [] },
      { name: 'Presença', data: [] }
  ],
  stroke: {
      curve: 'smooth',
      width: 2
  },
  colors: ['#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'],
  xaxis: {
      categories: [],
      labels: { style: { colors: '#9CA3AF' } }
  },
  yaxis: [
      {
          title: { text: 'Umidade/Temperatura' },
          labels: { style: { colors: '#9CA3AF' } }
      },
      {
          opposite: true,
          title: { text: 'Tensão' },
          labels: { style: { colors: '#9CA3AF' } }
      }
  ],
  tooltip: {
      theme: 'dark'
  },
  legend: {
      position: 'top',
      labels: { colors: '#E5E7EB' }
  },
  grid: {
      borderColor: '#4B5563'
  }
});

chart.render();

// Variáveis de controle
let intervalId = setInterval(fetchSensorData, 2000);
let maxDataPoints = 15;
let dataHistory = {
  times: [],
  umidade: [],
  tensao: [],
  temperatura: [],
  presenca: []
};

// Função principal
async function fetchSensorData() {
  try {
      const response = await fetch('http://localhost:5000/sensores');
      const result = await response.json();
      
      if (result.status === 'success') {
          const data = result.data;
          
          // Atualiza valores atuais
          document.getElementById('umidade').textContent = data.umidade;
          document.getElementById('tensao').textContent = data.tensao;
          document.getElementById('temperatura').textContent = data.temperatura;
          document.getElementById('presenca').textContent = data.presenca ? 'Detectada' : 'Ausente';
          
          // Atualiza status
          document.getElementById('dbStatus').textContent = result.database === 'ok' ? '✅' : '❌';
          updateThingSpeakStatus(result.thingspeak === 'enviado');
          
          // Adiciona aos históricos
          dataHistory.times.push(data.data);
          dataHistory.umidade.push(data.umidade);
          dataHistory.tensao.push(data.tensao);
          dataHistory.temperatura.push(data.temperatura);
          dataHistory.presenca.push(data.presenca);
          
          // Limita o número de pontos
          if (dataHistory.times.length > maxDataPoints) {
              dataHistory.times.shift();
              dataHistory.umidade.shift();
              dataHistory.tensao.shift();
              dataHistory.temperatura.shift();
              dataHistory.presenca.shift();
          }
          
          // Atualiza o gráfico
          updateChart();
          
          // Verifica valores críticos
          checkCriticalValues(data);
      }
  } catch (error) {
      console.error('Erro ao buscar dados:', error);
      document.getElementById('tsStatus').textContent = 'Erro na conexão';
  }
}

function updateChart() {
  chart.updateOptions({
      xaxis: { categories: dataHistory.times }
  });
  
  chart.updateSeries([
      { data: dataHistory.umidade },
      { data: dataHistory.tensao },
      { data: dataHistory.temperatura },
      { data: dataHistory.presenca }
  ]);
}

function updateThingSpeakStatus(success) {
  const statusEl = document.getElementById('tsStatus');
  const linkEl = document.getElementById('tsLink');
  
  if (success) {
      statusEl.textContent = '✅';
      linkEl.href = `https://thingspeak.com/channels/${THINGSPEAK_CONFIG.channel_id}`;
      linkEl.classList.remove('hidden');
  } else {
      statusEl.textContent = '❌';
      linkEl.classList.add('hidden');
  }
}

function checkCriticalValues(data) {
  const isCritical = (
      data.temperatura > 35 ||
      data.umidade > 70 ||
      data.tensao > 230 ||
      data.tensao < 120
  );
  
  if (isCritical) {
      // alert('ATENÇÃO: Valores críticos detectados!');
      
      // pauseMonitoring();
  }
}

function pauseMonitoring() {
  clearInterval(intervalId);
  document.getElementById('pauseBtn').classList.add('hidden');
  document.getElementById('resumeBtn').classList.remove('hidden');
}

function resumeMonitoring() {
  intervalId = setInterval(fetchSensorData, 2000);
  document.getElementById('resumeBtn').classList.add('hidden');
  document.getElementById('pauseBtn').classList.remove('hidden');
}

// Event listeners
document.getElementById('pauseBtn').addEventListener('click', pauseMonitoring);
document.getElementById('resumeBtn').addEventListener('click', resumeMonitoring);

// Configuração do ThingSpeak
const THINGSPEAK_CONFIG = {
  channel_id: "SEU_CHANNEL_ID"
};