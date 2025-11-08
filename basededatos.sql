
-- ----------------------------------------------------------------------
-- Tabla de auditoría (logs)
-- ----------------------------------------------------------------------
CREATE TABLE log_auditoria (
  id_log serial PRIMARY KEY,
  operacion text NOT NULL,
  usuario text,
  datos_old jsonb,
  datos_new jsonb,
  tabla_name text NOT NULL,
  id_registro bigint,
  fecha timestamptz DEFAULT now()
);

-- ----------------------------------------------------------------------
-- Tablas principales
-- ----------------------------------------------------------------------
CREATE TABLE Cliente (
  id_cliente SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  telefono VARCHAR(20),
  direccion VARCHAR(200),
  email VARCHAR(100) UNIQUE NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT true,
  fecha_baja timestamptz
);

CREATE TABLE Paseador (
  id_paseador SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  telefono VARCHAR(20),
  experiencia INT,
  zona VARCHAR(100)
);

CREATE TABLE Especie (
  id_especie SERIAL PRIMARY KEY,
  nombre VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE Raza (
  id_raza SERIAL PRIMARY KEY,
  id_especie INT REFERENCES Especie(id_especie),
  nombre VARCHAR(50) NOT NULL
);

CREATE TABLE Mascota (
  id_mascota SERIAL PRIMARY KEY,
  id_cliente INT REFERENCES Cliente(id_cliente),
  nombre VARCHAR(100) NOT NULL,
  id_especie INT REFERENCES Especie(id_especie),
  id_raza INT REFERENCES Raza(id_raza),
  edad INT
);

CREATE TABLE Paseo (
  id_paseo SERIAL PRIMARY KEY,
  id_mascota INT REFERENCES Mascota(id_mascota),
  id_paseador INT REFERENCES Paseador(id_paseador),
  fecha DATE NOT NULL,
  hora_inicio TIME,
  hora_fin TIME
);

CREATE TABLE Pago (
  id_pago SERIAL PRIMARY KEY,
  id_paseo INT REFERENCES Paseo(id_paseo),
  monto DECIMAL(10,2) NOT NULL,
  metodo VARCHAR(50),
  fecha_pago DATE
);

-- índices 
CREATE INDEX IF NOT EXISTS idx_paseo_paseador_fecha ON Paseo (id_paseador, fecha);
CREATE INDEX IF NOT EXISTS idx_pago_paseo ON Pago (id_paseo);

-- ----------------------------------------------------------------------
-- Stored procedures (SPs) usados por el backend
-- ----------------------------------------------------------------------

-- sp_create_cliente
CREATE OR REPLACE FUNCTION sp_create_cliente(
  p_nombre text, p_telefono text, p_direccion text, p_email text
) RETURNS integer LANGUAGE plpgsql AS $$
DECLARE new_id integer;
BEGIN
  INSERT INTO Cliente(nombre, telefono, direccion, email)
  VALUES (p_nombre, p_telefono, p_direccion, p_email)
  RETURNING id_cliente INTO new_id;
  RETURN new_id;
END;
$$;

-- sp_update_cliente_email
CREATE OR REPLACE FUNCTION sp_update_cliente_email(p_id int, p_email text)
RETURNS integer LANGUAGE plpgsql AS $$
DECLARE new_id int;
BEGIN
  UPDATE Cliente SET email = p_email WHERE id_cliente = p_id RETURNING id_cliente INTO new_id;
  RETURN new_id;
END;
$$;

-- sp_update_cliente_telefono
CREATE OR REPLACE FUNCTION sp_update_cliente_telefono(p_id int, p_telefono text)
RETURNS integer LANGUAGE plpgsql AS $$
DECLARE new_id int;
BEGIN
  UPDATE Cliente SET telefono = p_telefono WHERE id_cliente = p_id RETURNING id_cliente INTO new_id;
  RETURN new_id;
END;
$$;

-- sp_delete_cliente_logical (soft delete)
CREATE OR REPLACE FUNCTION sp_delete_cliente_logical(p_id int)
RETURNS integer LANGUAGE plpgsql AS $$
DECLARE new_id int;
BEGIN
  UPDATE Cliente
    SET activo = false,
        fecha_baja = now()
  WHERE id_cliente = p_id
  RETURNING id_cliente INTO new_id;
  RETURN new_id;
END;
$$;

-- sp_create_especie
CREATE OR REPLACE FUNCTION sp_create_especie(p_nombre text) RETURNS integer LANGUAGE plpgsql AS $$
DECLARE nid int;
BEGIN
  INSERT INTO Especie(nombre) VALUES (p_nombre) RETURNING id_especie INTO nid;
  RETURN nid;
END;
$$;

-- sp_create_raza
CREATE OR REPLACE FUNCTION sp_create_raza(p_id_especie int, p_nombre text) RETURNS integer LANGUAGE plpgsql AS $$
DECLARE nid int;
BEGIN
  INSERT INTO Raza(id_especie, nombre) VALUES (p_id_especie, p_nombre) RETURNING id_raza INTO nid;
  RETURN nid;
END;
$$;

-- sp_create_mascota
CREATE OR REPLACE FUNCTION sp_create_mascota(
  p_id_cliente int, p_nombre text, p_edad int, p_id_especie int, p_id_raza int
) RETURNS integer LANGUAGE plpgsql AS $$
DECLARE nid int;
BEGIN
  INSERT INTO Mascota(id_cliente, nombre, edad, id_especie, id_raza)
  VALUES (p_id_cliente, p_nombre, p_edad, p_id_especie, p_id_raza)
  RETURNING id_mascota INTO nid;
  RETURN nid;
END;
$$;

-- sp_create_paseador
CREATE OR REPLACE FUNCTION sp_create_paseador(p_nombre text, p_telefono text, p_experiencia int, p_zona text)
RETURNS integer LANGUAGE plpgsql AS $$
DECLARE nid int;
BEGIN
  INSERT INTO Paseador(nombre, telefono, experiencia, zona)
  VALUES (p_nombre, p_telefono, p_experiencia, p_zona)
  RETURNING id_paseador INTO nid;
  RETURN nid;
END;
$$;

-- sp_create_paseo (verifica solapamiento)
CREATE OR REPLACE FUNCTION sp_create_paseo(
  p_id_mascota int, p_id_paseador int, p_fecha date, p_hora_inicio time, p_hora_fin time
) RETURNS integer LANGUAGE plpgsql AS $$
DECLARE nid int;
  conflict_count int;
BEGIN
  SELECT count(*) INTO conflict_count
  FROM Paseo
  WHERE id_paseador = p_id_paseador
    AND fecha = p_fecha
    AND NOT (hora_fin <= p_hora_inicio OR hora_inicio >= p_hora_fin);

  IF conflict_count > 0 THEN
    RAISE EXCEPTION 'El paseador % tiene un paseo que se solapa en fecha % y horario % - %', p_id_paseador, p_fecha, p_hora_inicio, p_hora_fin;
  END IF;

  INSERT INTO Paseo(id_mascota, id_paseador, fecha, hora_inicio, hora_fin)
  VALUES (p_id_mascota, p_id_paseador, p_fecha, p_hora_inicio, p_hora_fin)
  RETURNING id_paseo INTO nid;

  RETURN nid;
END;
$$;

-- sp_create_pago
CREATE OR REPLACE FUNCTION sp_create_pago(p_id_paseo int, p_monto numeric, p_metodo text, p_fecha_pago date)
RETURNS integer LANGUAGE plpgsql AS $$
DECLARE nid int;
BEGIN
  INSERT INTO Pago(id_paseo, monto, metodo, fecha_pago)
  VALUES (p_id_paseo, p_monto, p_metodo, p_fecha_pago)
  RETURNING id_pago INTO nid;
  RETURN nid;
END;
$$;

-- ----------------------------------------------------------------------
-- Triggers específicos 
-- 1) Auditoría para Cliente
-- ----------------------------------------------------------------------
CREATE OR REPLACE FUNCTION trg_audit_cliente()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO log_auditoria(operacion, usuario, datos_old, datos_new, tabla_name, id_registro, fecha)
  VALUES (
    TG_OP,
    current_user,
    to_jsonb(OLD),
    to_jsonb(NEW),
    'Cliente',
    CASE WHEN TG_OP = 'INSERT' THEN (NEW.id_cliente)::bigint ELSE (OLD.id_cliente)::bigint END,
    now()
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER audit_cliente_trg
AFTER INSERT OR UPDATE OR DELETE ON Cliente
FOR EACH ROW EXECUTE FUNCTION trg_audit_cliente();

-- ----------------------------------------------------------------------
-- Auditoría para Pago (puedes registrar pagos)
-- ----------------------------------------------------------------------
CREATE OR REPLACE FUNCTION trg_audit_pago()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO log_auditoria(operacion, usuario, datos_old, datos_new, tabla_name, id_registro, fecha)
  VALUES (
    TG_OP,
    current_user,
    to_jsonb(OLD),
    to_jsonb(NEW),
    'Pago',
    CASE WHEN TG_OP = 'INSERT' THEN (NEW.id_pago)::bigint ELSE (OLD.id_pago)::bigint END,
    now()
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER audit_pago_trg
AFTER INSERT OR UPDATE OR DELETE ON Pago
FOR EACH ROW EXECUTE FUNCTION trg_audit_pago();

-- ----------------------------------------------------------------------
-- Trigger de validación: evita solapamiento en Paseo (también lo hace el SP)
-- ----------------------------------------------------------------------
CREATE OR REPLACE FUNCTION trg_validar_no_solapamiento_paseo() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE cnt int;
BEGIN
  SELECT count(*) INTO cnt
  FROM Paseo
  WHERE id_paseador = NEW.id_paseador
    AND fecha = NEW.fecha
    AND NOT (hora_fin <= NEW.hora_inicio OR hora_inicio >= NEW.hora_fin)
    AND (CASE WHEN TG_OP = 'UPDATE' THEN id_paseo <> NEW.id_paseo ELSE true END);

  IF cnt > 0 THEN
    RAISE EXCEPTION 'El paseador % tiene un paseo que se solapa en fecha % y horario % - %', NEW.id_paseador, NEW.fecha, NEW.hora_inicio, NEW.hora_fin;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_paseo_trg
BEFORE INSERT OR UPDATE ON Paseo
FOR EACH ROW EXECUTE FUNCTION trg_validar_no_solapamiento_paseo();

-- ----------------------------------------------------------------------
-- Vista + trigger INSTEAD OF DELETE sobre vw_cliente_deletes (soft-delete vía vista)
-- ----------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_cliente_deletes AS
  SELECT * FROM Cliente;

CREATE OR REPLACE FUNCTION trg_instead_delete_vw_cliente()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE Cliente
    SET activo = false,
        fecha_baja = now()
  WHERE id_cliente = OLD.id_cliente;

  INSERT INTO log_auditoria(operacion, usuario, datos_old, datos_new, tabla_name, id_registro, fecha)
  VALUES (
    'INSTEADOF_DELETE_VIEW',
    current_user,
    to_jsonb(OLD),
    to_jsonb((SELECT c.* FROM Cliente c WHERE c.id_cliente = OLD.id_cliente)),
    'Cliente',
    OLD.id_cliente,
    now()
  );

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER instead_delete_on_vw_cliente
INSTEAD OF DELETE ON vw_cliente_deletes
FOR EACH ROW EXECUTE FUNCTION trg_instead_delete_vw_cliente();

-- ----------------------------------------------------------------------
-- VISTAS que usa el frontend
-- ----------------------------------------------------------------------

CREATE OR REPLACE VIEW vista_info_paseo AS
SELECT
  ps.id_paseo,
  c.id_cliente,
  c.nombre AS cliente,
  m.id_mascota,
  m.nombre AS mascota,
  pa.id_paseador,
  pa.nombre AS paseador,
  ps.fecha,
  ps.hora_inicio,
  ps.hora_fin
FROM Paseo ps
INNER JOIN Mascota m ON ps.id_mascota = m.id_mascota
INNER JOIN Cliente c ON m.id_cliente = c.id_cliente
INNER JOIN Paseador pa ON ps.id_paseador = pa.id_paseador;

CREATE OR REPLACE VIEW vista_clientes_sin_paseos AS
SELECT c.id_cliente, c.nombre
FROM Cliente c
LEFT JOIN Mascota m ON m.id_cliente = c.id_cliente
LEFT JOIN Paseo p ON p.id_mascota = m.id_mascota
WHERE p.id_paseo IS NULL;

CREATE OR REPLACE VIEW vista_total_gastado_por_cliente AS
SELECT
  c.id_cliente,
  c.nombre,
  SUM(pg.monto) AS total_gastado,
  (SELECT MAX(fecha_pago) FROM Pago WHERE Pago.id_paseo IN (
      SELECT id_paseo FROM Paseo WHERE id_mascota IN (
          SELECT id_mascota FROM Mascota WHERE id_cliente = c.id_cliente
      )
  )) AS fecha_ultimo_pago
FROM Cliente c
JOIN Mascota m ON m.id_cliente = c.id_cliente
JOIN Paseo ps ON ps.id_mascota = m.id_mascota
JOIN Pago pg ON pg.id_paseo = ps.id_paseo
GROUP BY c.id_cliente, c.nombre;

CREATE OR REPLACE VIEW vista_total_por_mascota AS
SELECT
  m.id_mascota,
  m.nombre AS mascota,
  t.total_paseos,
  t.total_monto
FROM Mascota m
LEFT JOIN (
  SELECT
    ps.id_mascota,
    COUNT(ps.id_paseo) AS total_paseos,
    SUM(pg.monto) AS total_monto
  FROM Paseo ps
  LEFT JOIN Pago pg ON pg.id_paseo = ps.id_paseo
  GROUP BY ps.id_mascota
) AS t
  ON t.id_mascota = m.id_mascota;

-- vista_dense_rank_razas 
CREATE OR REPLACE VIEW vista_dense_rank_razas AS
WITH especie_totals AS (
  SELECT e.id_especie, e.nombre AS especie,
         COUNT(ps.id_paseo) AS total_por_especie
  FROM Especie e
  LEFT JOIN Raza r ON r.id_especie = e.id_especie
  LEFT JOIN Mascota m ON m.id_raza = r.id_raza
  LEFT JOIN Paseo ps ON ps.id_mascota = m.id_mascota
  GROUP BY e.id_especie, e.nombre
),
razas_count AS (
  SELECT r.id_raza, r.id_especie, r.nombre AS raza,
         COUNT(ps.id_paseo) AS cant_paseos_raza
  FROM Raza r
  LEFT JOIN Mascota m ON m.id_raza = r.id_raza
  LEFT JOIN Paseo ps ON ps.id_mascota = m.id_mascota
  GROUP BY r.id_raza, r.id_especie, r.nombre
)
SELECT
  et.id_especie,
  et.especie,
  rc.id_raza,
  rc.raza,
  CASE WHEN rc.cant_paseos_raza IS NULL THEN 0 ELSE rc.cant_paseos_raza END AS cantidad_paseos,
  CASE WHEN et.total_por_especie IS NULL THEN 0 ELSE et.total_por_especie END AS total_por_especie,
  DENSE_RANK() OVER (ORDER BY CASE WHEN et.total_por_especie IS NULL THEN 0 ELSE et.total_por_especie END DESC) AS rank_razas
FROM especie_totals et
LEFT JOIN razas_count rc ON rc.id_especie = et.id_especie
ORDER BY rank_razas, cantidad_paseos DESC;

-- vista_paseos_por_paseador 
CREATE OR REPLACE VIEW vista_paseos_por_paseador AS
SELECT
  pa.id_paseador,
  pa.nombre AS paseador,
  COUNT(ps.id_paseo) AS total_paseos
FROM Paseador pa
LEFT JOIN Paseo ps ON ps.id_paseador = pa.id_paseador
GROUP BY pa.id_paseador, pa.nombre
ORDER BY total_paseos DESC, pa.nombre;

-- ======================================================================
-- FIN del script
-- ======================================================================
