// VerTotalGastadoPorCliente.js
import React, { useState } from 'react';
export default function VerTotalGastadoPorCliente(){
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  async function load(){
    setLoading(true); setErr(null);
    try {
      const res = await fetch('/api/vista_total_gastado_por_cliente');
      const data = await res.json();
      if (Array.isArray(data)) setRows(data);
      else setErr('Respuesta inválida del servidor');
    } catch(e) {
      setErr(e.message);
    } finally { setLoading(false); }
  }

  return (
    <div>
      <button onClick={load}>{loading ? 'Cargando...' : 'Cargar total gastado por cliente'}</button>
      {err && <div className="error">Error: {err}</div>}
      <table className="table">
        <thead><tr><th>Cliente</th><th>Total Gastado</th><th>Fecha último pago</th></tr></thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id_cliente}>
              <td>{r.nombre}</td>
              <td>{r.total_gastado}</td>
              <td>{r.fecha_ultimo_pago ? new Date(r.fecha_ultimo_pago).toLocaleDateString() : ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length===0 && !loading && <div>No hay datos.</div>}
    </div>
  );
}
