import React, { useState, useEffect } from 'react';

export default function CrearMascota() {
  const [form, setForm] = useState({ id_cliente: '', nombre: '', edad: '', id_especie: '', id_raza: '' });
  const [msg, setMsg] = useState(null);
  const [especies, setEspecies] = useState([]);
  const [razas, setRazas] = useState([]);
  const [clientes, setClientes] = useState([]); // nueva lista de clientes

  useEffect(() => {
    // cargar especies al montar
    fetch('/api/especies')
      .then(r => r.json())
      .then(data => setEspecies(Array.isArray(data) ? data : []))
      .catch(() => setEspecies([]));

    // cargar clientes al montar
    fetch('/api/clientes')
      .then(r => r.json())
      .then(data => setClientes(Array.isArray(data) ? data : []))
      .catch(() => setClientes([]));
  }, []);

  useEffect(() => {
    // cuando cambia especie, cargar razas asociadas
    if (!form.id_especie) { setRazas([]); setForm(prev=>({...prev, id_raza: ''})); return; }
    fetch(`/api/razas?especie_id=${form.id_especie}`)
      .then(r => r.json())
      .then(data => setRazas(Array.isArray(data) ? data : []))
      .catch(() => setRazas([]));
  }, [form.id_especie]);

  async function submit(e) {
    e.preventDefault();
    setMsg('Enviando...');

    // validaciones básicas
    if (!form.id_cliente) { setMsg('Seleccione un cliente'); return; }
    if (!form.nombre) { setMsg('Ingrese nombre de la mascota'); return; }
    if (!form.id_especie) { setMsg('Seleccione especie'); return; }
    if (!form.id_raza) { setMsg('Seleccione raza'); return; }

    try {
      const payload = {
        id_cliente: Number(form.id_cliente),
        nombre: form.nombre,
        edad: form.edad ? Number(form.edad) : null,
        id_especie: Number(form.id_especie),
        id_raza: Number(form.id_raza)
      };
      const res = await fetch('/api/mascota', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const j = await res.json();
      if (!j.ok) setMsg('Error: ' + (j.error || JSON.stringify(j)));
      else setMsg('Mascota creada, id: ' + j.id_mascota);
    } catch (err) {
      setMsg('Error de red: ' + err.message);
    }
  }

  return (
    <div>
      <form onSubmit={submit} className="form">
        <label>Cliente *</label>
        <select value={form.id_cliente} onChange={e => setForm({...form, id_cliente: e.target.value})} required>
          <option value="">-- Seleccione cliente --</option>
          {clientes.map(c => (
            <option key={c.id_cliente} value={c.id_cliente}>
              {c.nombre}{c.email ? ` (${c.email})` : ''}
            </option>
          ))}
        </select>

        <input placeholder="Nombre *" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} required />

        <label>Especie *</label>
        <select value={form.id_especie} onChange={e => setForm({...form, id_especie: e.target.value})} required>
          <option value="">-- Seleccione especie --</option>
          {especies.map(s => <option key={s.id_especie} value={s.id_especie}>{s.nombre}</option>)}
        </select>

        <label>Raza *</label>
        <select value={form.id_raza} onChange={e => setForm({...form, id_raza: e.target.value})} required>
          <option value="">-- Seleccione raza --</option>
          {razas.map(r => <option key={r.id_raza} value={r.id_raza}>{r.nombre}</option>)}
        </select>

        <input placeholder="Edad" value={form.edad} onChange={e => setForm({...form, edad: e.target.value})} />
        <button type="submit">Crear Mascota</button>
      </form>
      {msg && <div className="msg">{msg}</div>}
    </div>
  );
}
