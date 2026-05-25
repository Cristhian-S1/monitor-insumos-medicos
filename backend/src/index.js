const express = require('express');
const { Pool } = require('pg');

const app = express();
app.use(express.json());

const dbConfig = {
  host: process.env.DB_HOST || 'postgres',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'monitor_insumos',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
};

let pool;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
async function connectWithRetry(retries = 10, delay = 3000) {
  pool = new Pool(dbConfig);
  pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
  });
  for (let i = 0; i < retries; i++) {
    try {
      await pool.query('SELECT 1');
      console.log('Database connected');
      return;
    } catch (err) {
      console.error(`DB connection failed (attempt ${i + 1}/${retries}):`, err.message);
      if (i < retries - 1) await sleep(delay);
    }
  }
  console.error('Could not connect to database after all retries');
  process.exit(1);
}

connectWithRetry();

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/hospitales', async (_req, res) => {
  try {
    const result = await pool.query(
      'SELECT hospital_id, descripcion, ubicacion FROM hospital ORDER BY hospital_id'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching hospitals:', err.message);
    res.status(500).json({ error: 'Error al consultar hospitales' });
  }
});

app.get('/api/stock/:hospitalId', async (req, res) => {
  const { hospitalId } = req.params;
  try {
    const hospital = await pool.query(
      'SELECT hospital_id, descripcion, ubicacion FROM hospital WHERE hospital_id = $1',
      [hospitalId]
    );

    if (hospital.rows.length === 0) {
      return res.status(404).json({ error: 'Hospital no encontrado' });
    }

    const result = await pool.query(
      `SELECT
        h.descripcion AS hospital,
        SUM(hi.nivel_psi) AS nivel_total_psi,
        SUM(t.tamanio) AS capacidad_total_psi,
        ROUND(SUM(hi.nivel_psi) * 100.0 / SUM(t.tamanio), 1) AS porcentaje,
        CASE
          WHEN SUM(hi.nivel_psi) * 100.0 / SUM(t.tamanio) >= 30
          THEN 'Disponible'
          ELSE 'Agotado'
        END AS stock
      FROM hospital h
      JOIN tanque t ON t.hospital_actual_id = h.hospital_id
      JOIN historial hi ON hi.tanque_id_fk = t.tanque_id
      WHERE h.hospital_id = $1
        AND hi.fecha_ingreso = (
          SELECT MAX(fecha_ingreso)
          FROM historial
          WHERE tanque_id_fk = t.tanque_id
        )
      GROUP BY h.descripcion`,
      [hospitalId]
    );

    if (result.rows.length === 0) {
      return res.json({
        hospital: hospital.rows[0].descripcion,
        ubicacion: hospital.rows[0].ubicacion,
        stock: 'Sin datos',
        porcentaje: 0,
        nivel_total_psi: 0,
        capacidad_total_psi: 0,
      });
    }

    res.json({
      ...result.rows[0],
      ubicacion: hospital.rows[0].ubicacion,
    });
  } catch (err) {
    console.error('Error fetching stock:', err.message);
    res.status(500).json({ error: 'Error al consultar stock' });
  }
});

app.get('/api/tanques/:hospitalId', async (req, res) => {
  const { hospitalId } = req.params;
  try {
    const result = await pool.query(
      `SELECT t.tanque_id, t.color, t.estado, t.tamanio,
        (SELECT hi.nivel_psi FROM historial hi
         WHERE hi.tanque_id_fk = t.tanque_id
         ORDER BY hi.fecha_ingreso DESC LIMIT 1) AS nivel_actual
      FROM tanque t
      WHERE t.hospital_actual_id = $1
      ORDER BY t.tanque_id`,
      [hospitalId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching tanks:', err.message);
    res.status(500).json({ error: 'Error al consultar tanques' });
  }
});

app.post('/api/historial', async (req, res) => {
  const { hospital_id_fk, tanque_id_fk, nivel_psi, fecha_ingreso, fecha_salida } = req.body;

  if (!hospital_id_fk || !tanque_id_fk || nivel_psi === undefined) {
    return res.status(400).json({ error: 'hospital_id_fk, tanque_id_fk y nivel_psi son requeridos' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO historial (hospital_id_fk, tanque_id_fk, nivel_psi, fecha_ingreso, fecha_salida)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [
        hospital_id_fk,
        tanque_id_fk,
        nivel_psi,
        fecha_ingreso || new Date().toISOString().split('T')[0],
        fecha_salida || null,
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error inserting record:', err.message);
    res.status(500).json({ error: 'Error al insertar registro' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend Monitor Insumos running on port ${PORT}`);
});
