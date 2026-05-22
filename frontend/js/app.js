const API_BASE = '/api';

async function fetchJSON(url, options) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return res.json();
}

async function loadHospitales() {
  const list = document.getElementById('hospitales-list');
  const select = document.getElementById('hospital-select');

  try {
    const hospitales = await fetchJSON(`${API_BASE}/hospitales`);

    list.innerHTML = hospitales.map((h) => `
      <div class="hospital-card" data-id="${h.hospital_id}" onclick="consultarStock(${h.hospital_id}, '${h.descripcion.replace(/'/g, "\\'")}')">
        <div class="nombre">${h.descripcion}</div>
        <div class="ubicacion">${h.ubicacion}</div>
      </div>
    `).join('');

    select.innerHTML = '<option value="">Seleccione un hospital</option>' +
      hospitales.map((h) => `<option value="${h.hospital_id}">${h.descripcion}</option>`).join('');

    document.querySelectorAll('.hospital-card').forEach((card) => card.classList.remove('active'));
  } catch (err) {
    list.innerHTML = `<p class="loading" style="color:#e53e3e">Error al cargar hospitales: ${err.message}</p>`;
  }
}

async function consultarStock(hospitalId, nombreHospital) {
  const panel = document.getElementById('stock-panel');
  const result = document.getElementById('stock-result');
  const tanquesList = document.getElementById('tanques-list');

  document.querySelectorAll('.hospital-card').forEach((card) => card.classList.remove('active'));
  const card = document.querySelector(`[data-id="${hospitalId}"]`);
  if (card) card.classList.add('active');

  panel.classList.remove('hidden');

  try {
    const [stock, tanques] = await Promise.all([
      fetchJSON(`${API_BASE}/stock/${hospitalId}`),
      fetchJSON(`${API_BASE}/tanques/${hospitalId}`),
    ]);

    const stockClass = stock.stock === 'Disponible' ? 'disponible' :
      stock.stock === 'Agotado' ? 'agotado' : 'sin-datos';

    const pctDisplay = Number(stock.porcentaje) || 0;

    result.innerHTML = `
      <div class="stock-result ${stockClass}">
        <h3>${stock.hospital || nombreHospital}</h3>
        <div><span class="stock-badge ${stockClass}">${stock.stock}</span></div>
        <div class="stock-stats">
          <div class="stat-item">
            <div class="label">Nivel total</div>
            <div class="value">${Number(stock.nivel_total_psi).toLocaleString()} PSI</div>
          </div>
          <div class="stat-item">
            <div class="label">Capacidad total</div>
            <div class="value">${Number(stock.capacidad_total_psi).toLocaleString()} PSI</div>
          </div>
          <div class="stat-item">
            <div class="label">Porcentaje</div>
            <div class="value">${pctDisplay}%</div>
          </div>
        </div>
        <div class="progress-bar" style="margin-top:12px">
          <div class="progress-fill ${pctDisplay >= 50 ? 'alto' : pctDisplay >= 30 ? 'medio' : 'bajo'}" style="width:${Math.min(pctDisplay, 100)}%"></div>
        </div>
      </div>
    `;

    tanquesList.innerHTML = '<h3 style="margin-top:12px;margin-bottom:12px;color:#4a5568;font-size:1rem">Tanques</h3>' +
      '<div class="tanques-list">' +
      tanques.map((t) => {
        const pctTanque = t.nivel_actual !== null ? Math.round((t.nivel_actual / t.tamanio) * 100) : 0;
        return `
          <div class="tanque-card">
            <div class="tanque-color">${t.color} (Tanque #${t.tanque_id})</div>
            <div class="tanque-nivel">
              ${t.nivel_actual !== null ? `${t.nivel_actual} / ${t.tamanio} PSI` : 'Sin lecturas'}
            </div>
            <div class="progress-bar">
              <div class="progress-fill ${t.nivel_actual !== null ? (pctTanque >= 50 ? 'alto' : pctTanque >= 30 ? 'medio' : 'bajo') : ''}" style="width:${t.nivel_actual !== null ? Math.min(pctTanque, 100) : 0}%"></div>
            </div>
          </div>
        `;
      }).join('') +
      '</div>';

    window.scrollTo({ top: panel.offsetTop - 20, behavior: 'smooth' });
  } catch (err) {
    result.innerHTML = `<div class="stock-result sin-datos"><p>Error: ${err.message}</p></div>`;
    tanquesList.innerHTML = '';
  }
}

async function cargarTanques(hospitalId) {
  const select = document.getElementById('tanque-select');
  if (!hospitalId) {
    select.innerHTML = '<option value="">Seleccione un hospital primero</option>';
    return;
  }

  try {
    const tanques = await fetchJSON(`${API_BASE}/tanques/${hospitalId}`);
    select.innerHTML = tanques.map((t) =>
      `<option value="${t.tanque_id}">Tanque #${t.tanque_id} - ${t.color} (${t.tamanio} PSI)</option>`
    ).join('');
  } catch (err) {
    select.innerHTML = '<option value="">Error al cargar tanques</option>';
  }
}

function mostrarMensaje(texto, tipo) {
  const msg = document.getElementById('form-message');
  msg.textContent = texto;
  msg.className = `form-message ${tipo}`;
  msg.classList.remove('hidden');
  setTimeout(() => msg.classList.add('hidden'), 4000);
}

document.addEventListener('DOMContentLoaded', () => {
  loadHospitales();

  document.getElementById('hospital-select').addEventListener('change', function () {
    cargarTanques(this.value);
  });

  document.getElementById('lectura-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    const hospitalId = document.getElementById('hospital-select').value;
    const tanqueId = document.getElementById('tanque-select').value;
    const nivelPsi = document.getElementById('nivel-psi').value;

    if (!hospitalId || !tanqueId) {
      mostrarMensaje('Seleccione hospital y tanque', 'error');
      return;
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      await fetchJSON(`${API_BASE}/historial`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hospital_id_fk: parseInt(hospitalId),
          tanque_id_fk: parseInt(tanqueId),
          nivel_psi: parseInt(nivelPsi),
          fecha_ingreso: today,
        }),
      });

      mostrarMensaje('Lectura registrada exitosamente', 'success');
      document.getElementById('nivel-psi').value = '';

      const hospitalName = document.getElementById('hospital-select').selectedOptions[0].text;
      consultarStock(parseInt(hospitalId), hospitalName);
    } catch (err) {
      mostrarMensaje(`Error: ${err.message}`, 'error');
    }
  });
});
