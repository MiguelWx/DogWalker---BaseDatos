// VerTotalPorMascota.js
import React, { useState } from 'react';
export default function VerTotalPorMascota(){
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);

  async function load(){
    setLoading(true); setErr(null);
    try {
      const res = await fetch('/api/vista_total_por_mascota');
      const data = await res.json();
      if (Array.isArray(data)) setRows(data);
      else setErr('Respuesta inválida');
    } catch(e) {
      setErr(e.message);
    } finally { setLoading(false); }
  }

  return (
    <div>
      <button onClick={load}>{loading ? 'Cargando...' : 'Cargar totales por mascota'}</button>
      {err && <div className="error">Error: {err}</div>}
      <table className="table">
        <thead><tr><th>Mascota</th><th>Total paseos</th><th>Total monto</th></tr></thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id_mascota}>
              <td>{r.mascota}</td>
              <td>{r.total_paseos ?? 0}</td>
              <td>{r.total_monto ?? 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
