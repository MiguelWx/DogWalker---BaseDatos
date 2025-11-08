// front/src/App.js
import React from 'react';
import './index.css';

import CrearCliente from './components/CrearCliente';
import EditarClienteCampo from './components/EditarClienteCampo';
import EliminarCliente from './components/EliminarCliente';
import CrearMascota from './components/CrearMascota';
import CrearPaseador from './components/CrearPaseador';
import CrearPaseo from './components/CrearPaseo';
import VerPaseos from './components/VerPaseos';
import VerPaseosPorPaseador from './components/VerPaseosPorPaseador';
import VerRank from './components/VerRank';
import CrearEspecieConRaza from './components/CrearEspecieConRaza';
import VerTotalGastadoPorCliente from './components/VerTotalGastadoPorCliente';
import VerTotalPorMascota from './components/VerTotalPorMascota';
import VerClientesSinPaseos from './components/VerClientesSinPaseos';

function App() {
  return (
    <div className="container">
      <h1>Paseadores — Panel</h1>

      <section className="card">
        <h2>1. Crear Cliente</h2>
        <CrearCliente />
      </section>

      <section className="card">
        <h2>1.b Editar / Eliminar Cliente</h2>
        <EditarClienteCampo />
        <hr />
        <EliminarCliente />
      </section>

      <section className="card">
        <h2>2. Crear Mascota</h2>
        <CrearMascota />
      </section>

      <section className="card">
        <h2>2.b Crear Paseador</h2>
        <CrearPaseador />
      </section>

      <section className="card">
        <h2>3. Crear Paseo</h2>
        <CrearPaseo />
      </section>

    <section className="card">
        <h2>Crear Especie / Raza</h2>
        <CrearEspecieConRaza />
      </section>

      <section className="card">
        <h2>Vistas: Paseos</h2>
        <VerPaseos />
      </section>

      <section className="card">
        <h2>Paseos por paseador</h2>
        <VerPaseosPorPaseador />
      </section>

      <section className="card">
        <h2>Ranking: Razas</h2>
        <VerRank />
      </section>

      <section className="card">
        <h2>Total gastado por cliente</h2>
        <VerTotalGastadoPorCliente />
      </section>

      <section className="card">
        <h2>Total por mascota</h2>
        <VerTotalPorMascota />
      </section>

      <section className="card">
        <h2>Clientes sin paseos</h2>
        <VerClientesSinPaseos />
      </section>
    </div>
  );
}

export default App;


