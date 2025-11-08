# DogWalker — Sistema de Gestión de Paseos de Mascotas  

Este proyecto implementa una aplicación (frontend + backend + base de datos) para la gestión de paseadores, clientes, mascotas, paseos y pagos.

---

## Requisitos previos  

Antes de ejecutar el proyecto, asegúrate de tener instalados los siguientes programas:

- **Node.js** y **npm**  
- **PostgreSQL**  
- **Git**

---

##  Clonar el repositorio  

Para descargar el proyecto completo desde GitHub:  

```
git clone https://github.com/MiguelWx/DogWalker---BaseDatos.git
cd DogWalker---BaseDatos
```

---

##  Crear la base de datos  

1. Abre PostgreSQL (por ejemplo con DBeaver o desde psql).  
2. Crea una base de datos nueva:  

 ```
 CREATE DATABASE dogwalker_db;
 ```
O creala desde un contenedor de Docker

---

## 3. Añade Tablas, vistas, Funciones, etc.
En este repositorio hay un sql con toda la base de datos que debes ejecutar para que funcione, se llama "basededatos.sql"

---

## 4. Configuración del backend

Crea un archivo .env en la raíz del proyecto con los siguientes datos (ajusta usuario y contraseña a tu entorno local):
```
DATABASE_URL=postgres://usuario:contraseña@localhost:5432/dogwalker_db
PORT=3000
```

Guarda y cierra el archivo

---

## 5. Ejecutar el backend y frontend

Desde la carpeta raíz del proyecto:

```
npm install
node server.js
```

Esto iniciará el servidor en
http://localhost:3000

El backend expone las rutas /api/... que son consumidas por el frontend

# Ejecutar el frontend

Desde la carpeta front:
```
cd front
npm install
npm start
```

El sistema abrira la interfaz en el navegador

---

##Conexión entre frontend y backend

El frontend se comunica con el backend mediante el prefijo /api/.
Si cambias el puerto del backend, edita el campo "proxy" en front/package.json:

"proxy": "http://localhost:3000"
