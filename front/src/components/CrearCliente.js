import React, { useState } from 'react';

export default function CrearCliente() {
  const [form, setForm] = useState({ nombre: '', telefono: '', direccion: '', email: '' });
  const [msg, setMsg] = useState(null);
  const [emailError, setEmailError] = useState(null);
  const [sending, setSending] = useState(false);

  // Regex simple: no espacios, tiene '@' y al menos un '.' después del @
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function validarEmail(email) {
    return emailRegex.test(email || '');
  }

  // Limpiar telefono: mantener sólo dígitos
  function cleanPhone(input) {
    if (!input) return '';
    return input.replace(/\D/g, ''); // elimina todo lo que no sea 0-9
  }

  async function submit(e) {
    e.preventDefault();
    setMsg(null);

    if (!form.nombre) {
      setMsg('El nombre es obligatorio.');
      return;
    }

    if (!validarEmail(form.email)) {
      setEmailError('Email inválido. Debe tener formato usuario@dominio.com');
      return;
    }
    setEmailError(null);

    // Sanitizar teléfono antes de enviar
    const telefonoSanitizado = form.telefono ? cleanPhone(form.telefono) : null;

    setSending(true);
    setMsg('Enviando...');
    try {
      const payload = {
        nombre: form.nombre,
        telefono: telefonoSanitizado,
        direccion: form.direccion || null,
        email: form.email
      };

      const res = await fetch('/api/cliente', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const j = await res.json();
      if (!j.ok) setMsg('Error: ' + (j.error || JSON.stringify(j)));
      else {
        setMsg('Cliente creado, id: ' + j.id_cliente);
        setForm({ nombre: '', telefono: '', direccion: '', email: '' });
      }
    } catch (err) {
      setMsg('Error de red: ' + err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div>
      <form onSubmit={submit} className="form" noValidate>
        <input
          placeholder="Nombre *"
          value={form.nombre}
          onChange={e => setForm({ ...form, nombre: e.target.value })}
          required
        />

        <input
          placeholder="Teléfono (solo números)"
          value={form.telefono}
          onChange={e => {
            const cleaned = cleanPhone(e.target.value);
            setForm({ ...form, telefono: cleaned });
          }}
        />

        <input
          placeholder="Dirección"
          value={form.direccion}
          onChange={e => setForm({ ...form, direccion: e.target.value })}
        />

        <input
          placeholder="Email * (usuario@dominio.com)"
          value={form.email}
          onChange={e => {
            setForm({ ...form, email: e.target.value });
            if (emailError && validarEmail(e.target.value)) setEmailError(null);
          }}
          onBlur={() => {
            if (form.email && !validarEmail(form.email)) setEmailError('Email inválido. Debe tener formato usuario@dominio.com');
          }}
          required
        />
        {emailError && <div style={{ color: 'red', marginTop: 6 }}>{emailError}</div>}

        <button type="submit" disabled={sending}>
          {sending ? 'Enviando...' : 'Crear Cliente'}
        </button>
      </form>

      {msg && <div className="msg" style={{ marginTop: 8 }}>{msg}</div>}
    </div>
  );
}

