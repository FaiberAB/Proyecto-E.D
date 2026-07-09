Chart.defaults.color = '#000000';
Chart.defaults.font.weight = 'bold';
Chart.defaults.font.size = 13;

let myChart = null;

const $ = (id) => document.getElementById(id);

function leerParametros() {
  return {
    v0:   parseFloat($('input-v0').value),
    a0:   parseFloat($('input-a0').value),
    rin:  parseFloat($('input-rin').value),
    rout: parseFloat($('input-rout').value),
    l:    parseFloat($('input-l').value),
    tEval: parseInt($('input-t').value, 10),
  };
}

function actualizarEtiquetas(p) {
  $('val-v0').innerText = p.v0;
  $('val-a0').innerText = p.a0;
  $('val-rin').innerText = p.rin;
  $('val-rout').innerText = p.rout;
  $('val-l').innerText = p.l;
  $('val-t').innerText = p.tEval;
  document.querySelectorAll('.lbl-dia').forEach(el => el.innerText = p.tEval);
}

function actualizarTarjetas(res) {
  $('res-vol').innerText = res.V_objetivo.toLocaleString('es-CO') + ' m³';
  $('res-tox').innerText = res.A_objetivo.toFixed(2) + ' kg';
  $('res-conc').innerText = res.C_objetivo.toFixed(4) + ' kg/m³';

  const trendEl = $('res-vol-trend');
  if (res.deltaR > 0) {
    trendEl.innerHTML = `<i class="fa-solid fa-arrow-up"></i> Aumentando ${res.deltaR} m³/día`;
    trendEl.style.color = '#3b82f6';
  } else if (res.deltaR < 0) {
    trendEl.innerHTML = `<i class="fa-solid fa-arrow-down"></i> Disminuyendo ${Math.abs(res.deltaR)} m³/día`;
    trendEl.style.color = '#f59e0b';
  } else {
    trendEl.innerHTML = `<i class="fa-solid fa-equals"></i> Volumen constante`;
    trendEl.style.color = '#000000';
  }

  const tarjetaConc = $('tarjeta-conc');
  const estado = $('res-status');
  const enPeligro = res.C_objetivo > Sim.LIMITE_SEGURO;

  tarjetaConc.classList.toggle('peligro', enPeligro);
  estado.innerText = enPeligro ? '⚠️ Peligro Ambiental' : '✅ Nivel Seguro';
  estado.style.color = enPeligro ? '#ef4444' : '#15803d';

  return enPeligro;
}

function dibujarGrafica(res) {
  const ctx = $('simChart').getContext('2d');
  if (myChart) myChart.destroy();

  myChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: res.labels.map(t => `Día ${t}`),
      datasets: [
        {
          label: 'Concentración Actual (kg/m³)',
          data: res.dataConcentracion,
          borderColor: '#14b8a6',
          backgroundColor: 'rgba(20, 184, 166, 0.12)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointRadius: (ctx2) => ctx2.dataIndex === res.tEval ? 6 : 0,
          pointBackgroundColor: '#ffffff',
        },
        {
          label: `Límite Seguro (${Sim.LIMITE_SEGURO} kg/m³)`,
          data: res.dataLimite,
          borderColor: '#ef4444',
          borderWidth: 2,
          borderDash: [5, 5],
          fill: false,
          pointRadius: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { labels: { color: '#000000' } },
        tooltip: { backgroundColor: 'rgba(20,14,9,0.92)', titleColor: '#fff', bodyColor: '#fff' },
      },
      scales: {
        x: { ticks: { color: '#000000', maxTicksLimit: 10 }, grid: { color: 'rgba(0,0,0,0.15)' } },
        y: {
          ticks: { color: '#000000' },
          grid: { color: 'rgba(0,0,0,0.15)' },
          title: { display: true, text: 'Concentración (kg/m³)', color: '#000000' },
        },
      },
    },
  });
}

function actualizarGrietas(concentracion) {
  const severidad = concentracion / Sim.LIMITE_SEGURO; 
  const grietas = document.querySelectorAll('#grietas-overlay path');
  const totalGrietas = grietas.length;

  const proporcionVisible = Math.min(severidad / 2, 1);
  const numVisibles = Math.round(proporcionVisible * totalGrietas);

  grietas.forEach((grieta, i) => {
    if (i < numVisibles) {
      const opacidad = Math.min(0.35 + severidad * 0.3, 0.9);
      grieta.style.setProperty('--grieta-opacidad', opacidad.toFixed(2));
      grieta.classList.add('grieta-activa');
    } else {
      grieta.classList.remove('grieta-activa');
    }
  });

  $('vignette-peligro').classList.toggle('activo', severidad > 1);
}

function actualizarRellenoSlider(input) {
  const min = parseFloat(input.min);
  const max = parseFloat(input.max);
  const val = parseFloat(input.value);
  const pct = ((val - min) / (max - min)) * 100;
  input.style.setProperty('--value', pct + '%');
}

function actualizarSim() {
  const p = leerParametros();
  actualizarEtiquetas(p);

  document.querySelectorAll('input[type="range"]').forEach(actualizarRellenoSlider);

  const res = Sim.simulate(p);

  actualizarTarjetas(res);
  dibujarGrafica(res);
  actualizarGrietas(res.C_objetivo);
}

function restaurarDefaults() {
  $('input-v0').value = 10000;
  $('input-a0').value = 500;
  $('input-rin').value = 300;
  $('input-rout').value = 200;
  $('input-l').value = 10;
  $('input-t').value = 30;
  actualizarSim();
}

document.querySelectorAll('input[type="range"]').forEach(input => {
  input.addEventListener('input', actualizarSim);
});
$('btn-reset').addEventListener('click', restaurarDefaults);

window.addEventListener('load', actualizarSim);
