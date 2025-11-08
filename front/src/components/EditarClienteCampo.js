// EditarClienteCampo.js
import React, { useEffect, useState } from 'react';

export default function EditarClienteCampo() {
  const [clientes, setClientes] = useState([]);
  const [sel, setSel] = useState('');
  const [campo, setCampo] = useState('email'); // 'email' o 'telefono'
  const [valor, setValor] = useState('');
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/clientes').then(r=>r.json()).then(d=>setClientes(Array.isArray(d)?d:[])).catch(()=>setClientes([]));
  }, []);

  async function submit(e) {
    e.preventDefault();
    if (!sel) { setMsg('Seleccione un cliente'); return; }
    if (campo === 'email' && (!valor || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor))) {
      setMsg('Email inválido');
      return;
    }
    setLoading(true);
    setMsg('Enviando...');
    try {
      const url = campo === 'email' ? `/api/cliente/${sel}/email` : `/api/cliente/${sel}/telefono`;
      const body = campo === 'email' ? { email: valor } : { telefono: valor };
      const res = await fetch(url, {
        method: 'PUT',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify(body)
      });
      const j = await res.json();
      if (!j.ok) setMsg('Error: ' + (j.error || JSON.stringify(j)));
      else setMsg('Actualizado correctamente (id: ' + j.id_cliente + ')');
    } catch(err) {
      setMsg('Error de red: ' + err.message);
    } finally { setLoading(false); }
  }

  return (
    <div>
      <h4>Editar cliente (uno a la vez)</h4>
      <form onSubmit={submit}>
        <select value={sel} onChange={e=>setSel(e.target.value)}>
          <option value="">-- Seleccione cliente --</option>
          {clientes.map(c => <option key={c.id_cliente} value={c.id_cliente}>{c.nombre} ({c.email})</option>)}
        </select>

        <div>
          <label>
            <input type="radio" checked={campo==='email'} onChange={()=>setCampo('email')} /> Email
          </label>
          <label style={{marginLeft:10}}>
            <input type="radio" checked={campo==='telefono'} onChange={()=>setCampo('telefono')} /> Teléfono
          </label>
        </div>

        <input placeholder={campo==='email' ? 'nuevo@email.com' : 'solo números'}
               value={valor} onChange={e=>setValor(e.target.value)} />

        <button type="submit" disabled={loading}>{loading ? 'Enviando...' : 'Actualizar'}</button>
      </form>
      {msg && <div style={{marginTop:8}}>{msg}</div>}
    </div>
  );
}

