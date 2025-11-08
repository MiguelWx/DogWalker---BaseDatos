import React, { useState } from 'react';

export default function VerPaseos(){
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  async function load(){
    setLoading(true); setErr(null);
    try {
      const res = await fetch('/api/vista_info_paseo');
      const data = await res.json();
      setRows(data);
    } catch(e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button onClick={load}>Cargar Paseos</button>
      {loading && <div>Cargando...</div>}
      {err && <div className="error">Error: {err}</div>}
      <table className="table">
        <thead><tr><th>id</th><th>cliente</th><th>mascota</th><th>paseador</th><th>fecha</th><th>hora_inicio</th><th>hora_fin</th></tr></thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id_paseo}>
              <td>{r.id_paseo}</td>
              <td>{r.cliente}</td>
              <td>{r.mascota}</td>
              <td>{r.paseador}</td>
              <td>{r.fecha ? new Date(r.fecha).toLocaleDateString() : ''}</td>
              <td>{r.hora_inicio}</td>
              <td>{r.hora_fin}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && !loading && <div>No hay paseos cargados.</div>}
    </div>
  );
}
