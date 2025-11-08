// front/src/components/CrearPaseador.js
import React, { useState } from 'react';

export default function CrearPaseador() {
  const [form, setForm] = useState({ nombre: '', telefono: '', experiencia: '', zona: '' });
  const [msg, setMsg] = useState(null);
  const [sending, setSending] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setMsg(null);
    if (!form.nombre) { setMsg('Nombre obligatorio'); return; }
    setSending(true);
    try {
      const payload = {
        nombre: form.nombre,
        telefono: form.telefono || null,
        experiencia: form.experiencia ? Number(form.experiencia) : null,
        zona: form.zona || null
      };
      const res = await fetch('/api/paseador', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const j = await res.json();
      if (!j.ok) setMsg('Error: ' + (j.error || JSON.stringify(j)));
      else {
        setMsg('Paseador creado, id: ' + j.id_paseador);
        setForm({ nombre: '', telefono: '', experiencia: '', zona: '' });
      }
    } catch (err) {
      setMsg('Error de red: ' + err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div>
      <form className="form" onSubmit={submit}>
        <input placeholder="Nombre *" value={form.nombre} onChange={e=>setForm({...form, nombre: e.target.value})} required />
        <input placeholder="Teléfono" value={form.telefono} onChange={e=>setForm({...form, telefono: e.target.value})} />
        <input placeholder="Años experiencia" value={form.experiencia} onChange={e=>setForm({...form, experiencia: e.target.value})} />
        <input placeholder="Zona" value={form.zona} onChange={e=>setForm({...form, zona: e.target.value})} />
        <button type="submit" disabled={sending}>{sending ? 'Enviando...' : 'Crear Paseador'}</button>
      </form>
      {msg && <div className="msg" style={{marginTop:8}}>{msg}</div>}
    </div>
  );
}
