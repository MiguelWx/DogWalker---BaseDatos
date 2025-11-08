import React, { useState } from 'react';

export default function VerRank(){
  const [rows, setRows] = useState([]);
  const [error, setError] = useState(null);

  async function load(){
    setError(null);
    try {
      const res = await fetch('/api/vista_dense_rank_razas');
      const data = await res.json();
      if (Array.isArray(data)) setRows(data);
      else {
        console.error('Respuesta inesperada:', data);
        setRows([]);
        setError('La respuesta del servidor no es una lista válida.');
      }
    } catch(e) {
      setRows([]);
      setError('Error de red: ' + e.message);
    }
  }

  return (
    <div>
      <button onClick={load}>Cargar Ranking (especies & razas)</button>
      {error && <div className="error" style={{color:'red'}}>{error}</div>}
      <table className="table" style={{marginTop:8}}>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Especie</th>
            <th>Raza</th>
            <th>Cantidad de paseos (raza)</th>
            <th>Total especie</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={(r.id_raza ?? i) + '-' + i}>
              <td>{r.rank_razas ?? '-'}</td>
              <td>{r.especie ?? '-'}</td>
              <td>{r.raza ?? '-'}</td>
              <td>{r.cantidad_paseos ?? 0}</td>
              <td>{r.total_por_especie ?? 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && !error && <div style={{marginTop:8}}>No hay datos de ranking.</div>}
    </div>
  );
}

