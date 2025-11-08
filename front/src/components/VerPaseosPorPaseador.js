import React, { useState } from 'react';

export default function VerPaseosPorPaseador(){
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);

  async function load(){
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch('/api/vista_paseos_por_paseador');
      if (!res.ok) throw new Error('Respuesta no OK: ' + res.status);
      const data = await res.json();
      if (!Array.isArray(data)) throw new Error('Respuesta inválida del servidor');
      setRows(data);
    } catch(e) {
      setErr(e.message);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button onClick={load}>{loading ? 'Cargando...' : 'Cargar Paseos por Paseador'}</button>
      {err && <div className="error" style={{color:'red', marginTop:8}}>Error: {err}</div>}
      <table className="table" style={{marginTop:8}}>
        <thead>
          <tr><th>Paseador</th><th>Total de paseos</th></tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id_paseador}>
              <td>{r.paseador}</td>
              <td>{r.total_paseos ?? 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && !loading && !err && <div style={{marginTop:8}}>No hay paseos para mostrar.</div>}
    </div>
  );
}
