// server.js (versión robusta)
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const app = express();

// parse JSON bodies (limit por seguridad)
app.use(bodyParser.json({ limit: '1mb' }));

// Root para comprobar servidor
app.get('/', (req, res) => {
  res.send('API Paseadores - backend activo. Usa endpoints en /api/');
});

// Helper: ejecutar query
async function runQuery(text, params = []) {
  const client = await pool.connect();
  try {
    const res = await client.query(text, params);
    return res;
  } finally {
    client.release();
  }
}

/* ---------- ENDPOINTS ---------- */

/* Función util para validar body y devolver objeto seguro */
function getBody(req) {
  return req.body && typeof req.body === 'object' ? req.body : {};
}

/* Crear cliente (usa la función sp_create_cliente en la BD) */
app.post('/api/cliente', async (req, res) => {
  const body = getBody(req);
  const nombre = body.nombre, telefono = body.telefono, direccion = body.direccion, email = body.email;
  if (!nombre || !email) {
    return res.status(400).json({ ok: false, error: 'Faltan campos obligatorios: nombre y email' });
  }
  try {
    const q = 'SELECT sp_create_cliente($1,$2,$3,$4) AS id;';
    const r = await runQuery(q, [nombre, telefono || null, direccion || null, email]);
    return res.status(201).json({ ok: true, id_cliente: r.rows[0].id });
  } catch (err) {
    if (err && err.code === '23505') {
      return res.status(400).json({ ok: false, error: 'Email duplicado' });
    }
    return res.status(400).json({ ok: false, error: err && err.message ? err.message : String(err) });
  }
});

/* Crear mascota */
app.post('/api/mascota', async (req, res) => {
  const body = getBody(req);
  const { id_cliente, nombre, edad, id_especie, id_raza } = body;
  if (!id_cliente || !nombre) {
    return res.status(400).json({ ok: false, error: 'Faltan campos obligatorios: id_cliente y nombre' });
  }
  try {
    const q = 'SELECT sp_create_mascota($1,$2,$3,$4,$5) AS id;';
    const r = await runQuery(q, [id_cliente, nombre, edad || null, id_especie || null, id_raza || null]);
    res.status(201).json({ ok: true, id_mascota: r.rows[0].id });
  } catch (err) {
    return res.status(400).json({ ok: false, error: err && err.message ? err.message : String(err) });
  }
});


// --- sustituir el handler /api/paseo por este ---
app.post('/api/paseo', async (req, res) => {
  const body = getBody(req);
  const { id_mascota, id_paseador, fecha, hora_inicio, hora_fin, monto, metodo, fecha_pago } = body;

  if (!id_mascota || !id_paseador || !fecha || !hora_inicio || !hora_fin) {
    return res.status(400).json({ ok: false, error: 'Faltan campos obligatorios: id_mascota, id_paseador, fecha, hora_inicio, hora_fin' });
  }
  if (monto === undefined || monto === null || isNaN(Number(monto))) {
    return res.status(400).json({ ok: false, error: 'monto es obligatorio y debe ser numérico' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1) Insertar paseo
    const qPaseo = `
      INSERT INTO Paseo (id_mascota, id_paseador, fecha, hora_inicio, hora_fin)
      VALUES ($1,$2,$3,$4,$5)
      RETURNING id_paseo;
    `;
    const rP = await client.query(qPaseo, [id_mascota, id_paseador, fecha, hora_inicio, hora_fin]);
    const id_paseo = rP.rows[0].id_paseo;
    console.log('Paseo creado id_paseo=', id_paseo);

    // 2) Crear pago usando la función almacenada sp_create_pago si existe,
    //    así usamos la lógica que ya tengas dentro de la BD.
    const fp = fecha_pago ? fecha_pago : (new Date()).toISOString().slice(0,10);

    // Comprueba si existe la función sp_create_pago; si existe la llamamos,
    // si no, hacemos insert directo en la tabla Pago.
    const fnCheck = await client.query(
      "SELECT proname FROM pg_proc WHERE proname = 'sp_create_pago' LIMIT 1;"
    );

    let id_pago;
    if (fnCheck.rowCount > 0) {
      // Llamar la función (se ejecutará dentro de la misma transacción)
      const rPay = await client.query('SELECT sp_create_pago($1,$2,$3,$4) AS id;', [id_paseo, Number(monto), metodo || null, fp]);
      id_pago = rPay.rows[0].id;
      console.log('Pago creado via sp_create_pago id_pago=', id_pago);
    } else {
      // Si no existe la función, insertar directamente
      const rPay = await client.query(
        `INSERT INTO Pago (id_paseo, monto, metodo, fecha_pago) VALUES ($1,$2,$3,$4) RETURNING id_pago;`,
        [id_paseo, Number(monto), metodo || null, fp]
      );
      id_pago = rPay.rows[0].id_pago;
      console.log('Pago creado via INSERT directo id_pago=', id_pago);
    }

    await client.query('COMMIT');
    return res.status(201).json({ ok: true, id_paseo, id_pago });
  } catch (err) {
    await client.query('ROLLBACK').catch(()=>{});
    console.error('Error creando paseo+payment:', err);
    return res.status(500).json({ ok: false, error: err && err.message ? err.message : String(err) });
  } finally {
    client.release();
  }
});




/* Crear pago */
app.post('/api/pago', async (req, res) => {
  const body = getBody(req);
  const { id_paseo, monto, metodo, fecha_pago } = body;
  if (!id_paseo || monto == null) {
    return res.status(400).json({ ok: false, error: 'Faltan campos obligatorios: id_paseo y monto' });
  }
  try {
    const q = 'SELECT sp_create_pago($1,$2,$3,$4) AS id;';
    const r = await runQuery(q, [id_paseo, monto, metodo || null, fecha_pago || null]);
    res.status(201).json({ ok: true, id_pago: r.rows[0].id });
  } catch (err) {
    return res.status(400).json({ ok: false, error: err && err.message ? err.message : String(err) });
  }
});

/* Consultar vistas */
app.get('/api/vista_info_paseo', async (req, res) => {
  try {
    const q = 'SELECT * FROM vista_info_paseo LIMIT 200;';
    const r = await runQuery(q);
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ ok: false, error: err && err.message ? err.message : String(err) });
  }
});

app.get('/api/vista_total_por_mascota', async (req, res) => {
  try {
    const q = 'SELECT * FROM vista_total_por_mascota ORDER BY total_monto DESC NULLS LAST LIMIT 200;';
    const r = await runQuery(q);
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ ok: false, error: err && err.message ? err.message : String(err) });
  }
});

// endpoint que devuelve ranking basado en la vista existente vista_dense_rank_razas
// Obtener todas las especies
app.get('/api/especies', async (req, res) => {
  try {
    const r = await runQuery('SELECT id_especie, nombre FROM Especie ORDER BY nombre;');
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ ok:false, error: err.message });
  }
});

// Obtener razas (opcional: filtrar por especie: /api/razas?especie_id=1)
app.get('/api/razas', async (req, res) => {
  try {
    const especieId = req.query.especie_id ? Number(req.query.especie_id) : null;
    let q, params;
    if (especieId) {
      q = 'SELECT id_raza, nombre, id_especie FROM Raza WHERE id_especie = $1 ORDER BY nombre;';
      params = [especieId];
    } else {
      q = 'SELECT id_raza, nombre, id_especie FROM Raza ORDER BY nombre;';
      params = [];
    }
    const r = await runQuery(q, params);
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ ok:false, error: err.message });
  }
});

// Obtener mascotas (id + nombre) — puedes filtrar por cliente si quieres
app.get('/api/mascotas', async (req, res) => {
  try {
    const r = await runQuery('SELECT id_mascota, nombre, id_cliente FROM Mascota ORDER BY nombre;');
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ ok:false, error: err.message });
  }
});

// Obtener paseadores (id + nombre)
app.get('/api/paseadores', async (req, res) => {
  try {
    const r = await runQuery('SELECT id_paseador, nombre, zona FROM Paseador ORDER BY nombre;');
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ ok:false, error: err.message });
  }
});


// el frontend que usa el nombre de la vista funcione también
app.get('/api/vista_dense_rank_razas', async (req, res) => {
  try {
    const q = 'SELECT * FROM vista_dense_rank_razas ORDER BY rank_razas LIMIT 50;';
    const r = await runQuery(q);
    res.json(r.rows);
  } catch (err) {
    console.error('ERROR /api/vista_dense_rank_razas ->', err);
    res.status(500).json({ ok: false, error: err && err.message ? err.message : String(err) });
  }
});

// Crear especie (usa sp_create_especie)
app.post('/api/especie', async (req, res) => {
  const body = getBody(req);
  const { nombre } = body;
  if (!nombre) return res.status(400).json({ ok:false, error: 'nombre es obligatorio' });
  try {
    const q = 'SELECT sp_create_especie($1) AS id;';
    const r = await runQuery(q, [nombre]);
    res.status(201).json({ ok:true, id_especie: r.rows[0].id });
  } catch (err) {
    res.status(400).json({ ok:false, error: err && err.message ? err.message : String(err) });
  }
});

// Crear raza (usa sp_create_raza)
app.post('/api/raza', async (req, res) => {
  const body = getBody(req);
  const { id_especie, nombre } = body;
  if (!id_especie || !nombre) return res.status(400).json({ ok:false, error: 'id_especie y nombre son obligatorios' });
  try {
    const q = 'SELECT sp_create_raza($1,$2) AS id;';
    const r = await runQuery(q, [id_especie, nombre]);
    res.status(201).json({ ok:true, id_raza: r.rows[0].id });
  } catch (err) {
    res.status(400).json({ ok:false, error: err && err.message ? err.message : String(err) });
  }
});

/* Vistas nuevas: total gastado por cliente, clientes sin paseos, paseos por paseador (si no existen endpoints) */

// Total gastado por cliente (vista_total_gastado_por_cliente)
app.get('/api/vista_total_gastado_por_cliente', async (req, res) => {
  try {
    const r = await runQuery('SELECT * FROM vista_total_gastado_por_cliente ORDER BY total_gastado DESC NULLS LAST LIMIT 200;');
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ ok:false, error: err && err.message ? err.message : String(err) });
  }
});

// Clientes sin paseos (vista_clientes_sin_paseos)
app.get('/api/vista_clientes_sin_paseos', async (req, res) => {
  try {
    const r = await runQuery('SELECT * FROM vista_clientes_sin_paseos ORDER BY nombre LIMIT 500;');
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ ok:false, error: err && err.message ? err.message : String(err) });
  }
});

app.get('/api/vista_paseos_por_paseador', async (req, res) => {
  try {
    // pedimos sólo las columnas que la vista realmente devuelve
    const r = await runQuery(
      'SELECT id_paseador, paseador, total_paseos FROM vista_paseos_por_paseador ORDER BY total_paseos DESC, paseador LIMIT 500;'
    );
    res.json(r.rows);
  } catch (err) {
    console.error('/api/vista_paseos_por_paseador ERROR ->', err);
    res.status(500).json({ ok: false, error: err && err.message ? err.message : String(err) });
  }
});


// Obtener clientes (id + nombre + email)
app.get('/api/clientes', async (req, res) => {
  try {
    const r = await runQuery('SELECT id_cliente, nombre, email FROM Cliente ORDER BY nombre;');
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ ok:false, error: err && err.message ? err.message : String(err) });
  }
});

// Actualizar solo email
app.put('/api/cliente/:id/email', async (req, res) => {
  const id = Number(req.params.id);
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ ok:false, error: 'email requerido' });
  try {
    const q = 'SELECT sp_update_cliente_email($1,$2) AS id;';
    const r = await runQuery(q, [id, email]);
    return res.json({ ok:true, id_cliente: r.rows[0].id });
  } catch(err) {
    return res.status(400).json({ ok:false, error: err && err.message ? err.message : String(err) });
  }
});

// Actualizar solo telefono
app.put('/api/cliente/:id/telefono', async (req, res) => {
  const id = Number(req.params.id);
  const { telefono } = req.body || {};
  if (telefono === undefined) return res.status(400).json({ ok:false, error: 'telefono requerido (puede ser null)' });
  try {
    const q = 'SELECT sp_update_cliente_telefono($1,$2) AS id;';
    const r = await runQuery(q, [id, telefono || null]);
    return res.json({ ok:true, id_cliente: r.rows[0].id });
  } catch(err) {
    return res.status(400).json({ ok:false, error: err && err.message ? err.message : String(err) });
  }
});

// Eliminación lógica (soft-delete) vía SP
app.delete('/api/cliente/:id', async (req, res) => {
  const id = Number(req.params.id);
  try {
    const q = 'SELECT sp_delete_cliente_logical($1) AS id;';
    const r = await runQuery(q, [id]);
    return res.json({ ok:true, id_cliente: r.rows[0].id });
  } catch(err) {
    return res.status(400).json({ ok:false, error: err && err.message ? err.message : String(err) });
  }
});

app.post('/api/paseador', async (req, res) => {
  const body = getBody(req);
  const { nombre, telefono, experiencia, zona } = body;
  if (!nombre) return res.status(400).json({ ok:false, error: 'nombre es obligatorio' });
  try {
    // si tienes una función sp_create_paseador en BD, usa SELECT sp_create_paseador(...).
    // Si no, aquí hacemos INSERT simple (pero lo ideal: SP). Ajusta según tu diseño.
    const q = 'INSERT INTO Paseador(nombre, telefono, experiencia, zona) VALUES ($1,$2,$3,$4) RETURNING id_paseador;';
    const r = await runQuery(q, [nombre, telefono || null, experiencia || null, zona || null]);
    res.status(201).json({ ok:true, id_paseador: r.rows[0].id_paseador });
  } catch (err) {
    res.status(400).json({ ok:false, error: err && err.message ? err.message : String(err) });
  }
});


/* 404 */
app.use((req, res) => res.status(404).json({ ok: false, error: 'Not found' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening ${PORT}`));
