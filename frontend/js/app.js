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
        <div class="ubicacion">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          <span>${h.ubicacion}</span>
        </div>
      </div>
    `).join('');

    select.innerHTML = '<option value="">Seleccione un hospital</option>' +
      hospitales.map((h) => `<option value="${h.hospital_id}">${h.descripcion}</option>`).join('');

    document.querySelectorAll('.hospital-card').forEach((card) => card.classList.remove('active'));
  } catch (err) {
    list.innerHTML = `<p class="loading" style="color:#f43f5e">Error al cargar hospitales: ${err.message}</p>`;
  }
}

async function consultarStock(hospitalId, nombreHospital) {
  const panel = document.getElementById('stock-panel');
  const placeholder = document.getElementById('stock-placeholder');
  const result = document.getElementById('stock-result');
  const tanquesList = document.getElementById('tanques-list');

  // Activate card styling
  document.querySelectorAll('.hospital-card').forEach((card) => card.classList.remove('active'));
  const card = document.querySelector(`[data-id="${hospitalId}"]`);
  if (card) card.classList.add('active');

  // Hide placeholder
  if (placeholder) placeholder.classList.add('hidden');

  try {
    const [stock, tanques] = await Promise.all([
      fetchJSON(`${API_BASE}/stock/${hospitalId}`),
      fetchJSON(`${API_BASE}/tanques/${hospitalId}`),
    ]);

    const stockClass = stock.stock === 'Disponible' ? 'disponible' :
      stock.stock === 'Agotado' ? 'agotado' : 'sin-datos';

    const pctDisplay = Number(stock.porcentaje) || 0;

    result.innerHTML = `
      <div class="stock-result">
        <div class="stock-header">
          <div>
            <h3>${stock.hospital || nombreHospital}</h3>
            <p class="subtitle" style="display:flex;align-items:center;gap:4px;margin-top:2px">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              <span>${stock.ubicacion || ''}</span>
            </p>
          </div>
          <span class="stock-badge ${stockClass}">${stock.stock}</span>
        </div>
        <div class="stock-stats">
          <div class="stat-item">
            <span class="label">Nivel total</span>
            <span class="value">${Number(stock.nivel_total_psi).toLocaleString()} PSI</span>
          </div>
          <div class="stat-item">
            <span class="label">Capacidad total</span>
            <span class="value">${Number(stock.capacidad_total_psi).toLocaleString()} PSI</span>
          </div>
          <div class="stat-item">
            <span class="label">Porcentaje</span>
            <span class="value">${pctDisplay}%</span>
          </div>
        </div>
        <div class="progress-bar-container">
          <div class="progress-bar-fill ${pctDisplay >= 50 ? 'alto' : pctDisplay >= 30 ? 'medio' : 'bajo'}" style="width:${Math.min(pctDisplay, 100)}%"></div>
        </div>
      </div>
    `;

    // Map physical cylinder representation for each tank
    tanquesList.innerHTML = `
      <h3 class="tanks-section-header">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <ellipse cx="12" cy="5" rx="9" ry="3"/>
          <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
          <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"/>
        </svg>
        <span>Tanques individuales</span>
      </h3>
      <div class="tanques-list">
        ${tanques.map((t) => {
          const pctTanque = t.nivel_actual !== null ? Math.round((t.nivel_actual / t.tamanio) * 100) : 0;
          const fillClass = t.nivel_actual !== null ? (pctTanque >= 50 ? 'alto' : pctTanque >= 30 ? 'medio' : 'bajo') : 'none';
          const colorClass = (t.color || 'white').toLowerCase();
          
          return `
            <div class="tanque-card">
              <div class="tank-cylinder-wrapper">
                <div class="tank-cylinder">
                  <div class="tank-cap ${colorClass}"></div>
                  <div class="tank-fill ${fillClass}" style="height:${t.nivel_actual !== null ? Math.min(pctTanque, 100) : 0}%"></div>
                </div>
              </div>
              <div class="tanque-details">
                <div class="tanque-color">${t.color}</div>
                <div class="tanque-id">Tanque #${t.tanque_id}</div>
                <div class="tanque-nivel">
                  ${t.nivel_actual !== null ? `${Number(t.nivel_actual).toLocaleString()} PSI` : 'Sin lecturas'}
                </div>
                <div class="tanque-porcentaje">
                  ${t.nivel_actual !== null ? `${pctTanque}% / ${Number(t.tamanio).toLocaleString()} PSI` : 'Capacidad: ' + Number(t.tamanio).toLocaleString() + ' PSI'}
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    // Smooth scroll in case screen is small and stack layouts occur
    const layout = document.querySelector('.dashboard-layout');
    if (window.innerWidth < 900) {
      window.scrollTo({ top: panel.offsetTop - 20, behavior: 'smooth' });
    }
  } catch (err) {
    result.innerHTML = `
      <div class="stock-result">
        <div class="stock-badge sin-datos" style="margin-bottom:12px">Error</div>
        <p style="font-size:0.875rem;color:var(--text-secondary)">${err.message}</p>
      </div>
    `;
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
      `<option value="${t.tanque_id}">Tanque #${t.tanque_id} - ${t.color} (${Number(t.tamanio).toLocaleString()} PSI)</option>`
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

// Dark Mode Toggling and Preferences Logic
function initTheme() {
  const toggleBtn = document.getElementById('theme-toggle');
  const currentTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  if (currentTheme === 'dark' || (!currentTheme && prefersDark)) {
    document.body.classList.add('dark-mode');
  } else {
    document.body.classList.remove('dark-mode');
  }

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      document.body.classList.toggle('dark-mode');
      const isDark = document.body.classList.contains('dark-mode');
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
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
