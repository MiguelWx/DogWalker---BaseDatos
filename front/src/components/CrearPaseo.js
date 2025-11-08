// front/src/components/CrearPaseo.js  (sólo pega reemplazando tu archivo)
import React, { useState, useEffect } from 'react';

function genDateOptions(days = 14) {
  const opts = [];
  const today = new Date();
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const iso = d.toISOString().slice(0,10);
    const label = d.toLocaleDateString();
    opts.push({ value: iso, label });
  }
  return opts;
}
function parseTimeToMinutes(timeStr) {
  if (!timeStr) return null;
  const parts = timeStr.split(':').map(Number);
  if (parts.length < 2 || Number.isNaN(parts[0]) || Number.isNaN(parts[1])) return null;
  return parts[0] * 60 + parts[1];
}

export default function CrearPaseo() {
  const [mascotas, setMascotas] = useState([]);
  const [paseadores, setPaseadores] = useState([]);
  const [form, setForm] = useState({ id_mascota:'', id_paseador:'', fecha:'', hora_inicio:'', hora_fin:'', monto:'', metodo:'Efectivo' });
  const [slots, setSlots] = useState([]);
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const dateOptions = genDateOptions(14);

  useEffect(() => {
    fetch('/api/mascotas').then(r=>r.json()).then(d=>setMascotas(Array.isArray(d)?d:[])).catch(()=>setMascotas([]));
    fetch('/api/paseadores').then(r=>r.json()).then(d=>setPaseadores(Array.isArray(d)?d:[])).catch(()=>setPaseadores([]));
  }, []);

  function canAddSlot() {
    const { fecha, hora_inicio, hora_fin, monto } = form;
    if (!fecha || !hora_inicio || !hora_fin) return false;
    if (monto === '' || monto === null || isNaN(Number(monto))) return false; // monto obligatorio al añadir
    const minutes1 = parseTimeToMinutes(hora_inicio);
    const minutes2 = parseTimeToMinutes(hora_fin);
    if (minutes1 === null || minutes2 === null) return false;
    return minutes2 > minutes1;
  }

  function addSlot(e) {
    e.preventDefault();
    if (!canAddSlot()) { setMsg('Fecha/horas/monto inválidos (monto obligatorio)'); return; }
    setSlots(prev => [...prev, { fecha: form.fecha, hora_inicio: form.hora_inicio, hora_fin: form.hora_fin, monto: Number(form.monto), metodo: form.metodo }]);
    setForm(prev => ({ ...prev, hora_inicio:'', hora_fin:'', monto:'', metodo:'Efectivo' }));
    setMsg(null);
  }

  function removeSlot(i) { setSlots(prev => prev.filter((_,idx)=>idx!==i)); }

  async function submitAll(e) {
    e.preventDefault();
    if (!form.id_mascota || !form.id_paseador) { setMsg('Selecciona mascota y paseador.'); return; }
    if (slots.length === 0) { setMsg('Agrega al menos un slot.'); return; }
    setBusy(true);
    const results = [];
    for (const s of slots) {
      try {
        const payload = { id_mascota: Number(form.id_mascota), id_paseador: Number(form.id_paseador), fecha: s.fecha, hora_inicio: s.hora_inicio, hora_fin: s.hora_fin, monto: s.monto, metodo: s.metodo };
        const res = await fetch('/api/paseo', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
        const j = await res.json();
        results.push({ slot: s, resp: j });
      } catch (err) {
        results.push({ slot: s, error: err.message });
      }
    }
    setBusy(false);
    const success = results.filter(r => r.resp && r.resp.ok).length;
    setMsg(`Enviados: ${results.length}. Exitosos: ${success}. Revisa consola para detalles.`);
    console.log('Resultados envio paseos', results);
    if (success === results.length) setSlots([]);
  }

  return (
    <div>
      <form className="form" onSubmit={(e)=>e.preventDefault()}>
        <label>Mascota *</label>
        <select value={form.id_mascota} onChange={e=>setForm({...form, id_mascota:e.target.value})}><option value="">-- Seleccione mascota --</option>{mascotas.map(m => <option key={m.id_mascota} value={m.id_mascota}>{m.nombre}</option>)}</select>

        <label>Paseador *</label>
        <select value={form.id_paseador} onChange={e=>setForm({...form, id_paseador:e.target.value})}><option value="">-- Seleccione paseador --</option>{paseadores.map(p => <option key={p.id_paseador} value={p.id_paseador}>{p.nombre}</option>)}</select>

        <div style={{display:'flex', gap:8, alignItems:'flex-end'}}>
          <div style={{flex:1}}>
            <label>Fecha</label>
            <select value={form.fecha} onChange={e=>setForm({...form, fecha:e.target.value})}><option value="">-- Fecha --</option>{dateOptions.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}</select>
          </div>

          <div style={{width:140}}>
            <label>Hora inicio</label>
            <input type="time" value={form.hora_inicio} onChange={e=>setForm({...form, hora_inicio:e.target.value})} step="1"/>
          </div>

          <div style={{width:140}}>
            <label>Hora fin</label>
            <input type="time" value={form.hora_fin} onChange={e=>setForm({...form, hora_fin:e.target.value})} step="1"/>
          </div>

          <div style={{width:120}}>
            <label>Monto *</label>
            <input type="number" min="0" step="0.01" value={form.monto} onChange={e=>setForm({...form, monto:e.target.value})} required />
          </div>

          <div style={{width:120}}>
            <label>Método</label>
            <select value={form.metodo} onChange={e=>setForm({...form, metodo:e.target.value})}><option>Efectivo</option><option>Tarjeta</option></select>
          </div>

          <div>
            <button onClick={addSlot} type="button" disabled={!canAddSlot()}>+ Añadir slot</button>
          </div>
        </div>

        <div style={{marginTop:10}}>
          <h4>Slots</h4>
          {slots.length===0 ? <div>No hay slots</div> : slots.map((s,i)=>(
            <div key={i}>{s.fecha} {s.hora_inicio}→{s.hora_fin} — {s.monto} ({s.metodo}) <button type="button" onClick={()=>removeSlot(i)}>Quitar</button></div>
          ))}
        </div>

        <div style={{marginTop:10}}>
          <button onClick={submitAll} disabled={busy}>{busy ? 'Enviando...' : 'Crear paseos'}</button>
        </div>
      </form>
      {msg && <div className="msg">{msg}</div>}
    </div>
  );
}
