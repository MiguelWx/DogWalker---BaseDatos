// CrearEspecieConRaza.js
import React, { useState, useEffect } from 'react';

export default function CrearEspecieConRaza(){
  const [especies, setEspecies] = useState([]);
  const [formEspecie, setFormEspecie] = useState({ nombre: '' });
  const [formRaza, setFormRaza] = useState({ id_especie: '', nombre: '' });
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    fetch('/api/especies').then(r=>r.json()).then(d=>setEspecies(Array.isArray(d)?d:[])).catch(()=>setEspecies([]));
  }, []);

  async function crearEspecie(e){
    e.preventDefault();
    setMsg('Creando especie...');
    try {
      const res = await fetch('/api/especie', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify(formEspecie)
      });
      const j = await res.json();
      if (!j.ok) setMsg('Error: ' + (j.error||JSON.stringify(j)));
      else {
        setMsg('Especie creada id: ' + j.id_especie);
        // recargar especies
        const r2 = await fetch('/api/especies'); const d2 = await r2.json();
        setEspecies(Array.isArray(d2)?d2:[]);
        setFormEspecie({ nombre: '' });
      }
    } catch(err) {
      setMsg('Error de red: ' + err.message);
    }
  }

  async function crearRaza(e){
    e.preventDefault();
    setMsg('Creando raza...');
    try {
      const payload = { id_especie: Number(formRaza.id_especie), nombre: formRaza.nombre };
      const res = await fetch('/api/raza', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify(payload)
      });
      const j = await res.json();
      if (!j.ok) setMsg('Error: ' + (j.error||JSON.stringify(j)));
      else {
        setMsg('Raza creada id: ' + j.id_raza);
        setFormRaza({ id_especie:'', nombre:'' });
      }
    } catch(err) {
      setMsg('Error de red: ' + err.message);
    }
  }

  return (
    <div>
      <h3>Crear Especie</h3>
      <form onSubmit={crearEspecie} className="form">
        <input placeholder="Nombre especie" value={formEspecie.nombre} onChange={e=>setFormEspecie({nombre:e.target.value})} required />
        <button type="submit">Crear Especie</button>
      </form>

      <h3 style={{marginTop:12}}>Crear Raza</h3>
      <form onSubmit={crearRaza} className="form">
        <select value={formRaza.id_especie} onChange={e=>setFormRaza({...formRaza, id_especie:e.target.value})} required>
          <option value="">-- Seleccione especie --</option>
          {especies.map(s => <option key={s.id_especie} value={s.id_especie}>{s.nombre}</option>)}
        </select>
        <input placeholder="Nombre raza" value={formRaza.nombre} onChange={e=>setFormRaza({...formRaza, nombre:e.target.value})} required />
        <button type="submit">Crear Raza</button>
      </form>

      {msg && <div className="msg" style={{marginTop:8}}>{msg}</div>}
    </div>
  );
}
