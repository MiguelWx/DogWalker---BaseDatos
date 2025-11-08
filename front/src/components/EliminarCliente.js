// EliminarCliente.js
import React, { useEffect, useState } from 'react';

export default function EliminarCliente(){
  const [clientes, setClientes] = useState([]);
  const [sel, setSel] = useState('');
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  async function loadClientes() {
    try {
      const r = await fetch('/api/clientes');
      if (!r.ok) throw new Error('Error cargando clientes: ' + r.status);
      const d = await r.json();
      setClientes(Array.isArray(d) ? d : []);
    } catch (err) {
      console.error(err);
      setClientes([]);
    }
  }

  useEffect(()=> {
    loadClientes();
  }, []);

  async function del(){
    if (!sel) { setMsg('Seleccione cliente'); return; }
    // usar window.confirm para evitar regla ESLint no-restricted-globals
    const ok = window.confirm('¿Confirmar eliminación (soft-delete) del cliente?');
    if (!ok) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/cliente/${sel}`, { method: 'DELETE' });
      const j = await res.json();
      if (!j.ok) setMsg('Error: ' + (j.error || JSON.stringify(j)));
      else {
        setMsg('Cliente marcado como inactivo (id: ' + j.id_cliente + ')');
        // recargar lista
        await loadClientes();
        setSel('');
      }
    } catch(err) {
      setMsg('Error de red: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h4>Eliminar cliente (soft-delete)</h4>
      <select value={sel} onChange={e=>setSel(e.target.value)}>
        <option value="">-- Seleccione cliente --</option>
        {clientes.map(c => <option key={c.id_cliente} value={c.id_cliente}>{c.nombre} ({c.email})</option>)}
      </select>
      <button onClick={del} disabled={loading}>{loading ? 'Eliminando...' : 'Eliminar'}</button>
      {msg && <div style={{marginTop:8}}>{msg}</div>}
    </div>
  );
}

