// VerClientesSinPaseos.js
import React, { useState } from 'react';
export default function VerClientesSinPaseos(){
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState(null);

  async function load(){
    setErr(null);
    try {
      const res = await fetch('/api/vista_clientes_sin_paseos');
      const data = await res.json();
      if (Array.isArray(data)) setRows(data);
      else setErr('Respuesta inválida');
    } catch(e) {
      setErr(e.message);
    }
  }

  return (
    <div>
      <button onClick={load}>Cargar clientes sin paseos</button>
      {err && <div className="error">Error: {err}</div>}
      <ul>
        {rows.map(r => <li key={r.id_cliente}>{r.nombre} (id:{r.id_cliente})</li>)}
      </ul>
      {rows.length===0 && !err && <div>No hay clientes sin paseos.</div>}
    </div>
  );
}
