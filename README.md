# monitor-insumos-medicos
Aplicacion que consulta el stock de oxígeno de un centro medico utilizando la estandarizacion de cada componente de la arquitecutra mediante Docker

# creación de la base de datos del equipo

-- 1. Crear la tabla de Hospitales
CREATE TABLE hospital (
    hospital_id INT GENERATED ALWAYS AS IDENTITY,
    descripcion VARCHAR(68) NOT NULL,
    ubicacion VARCHAR(68) NOT NULL,
    
    CONSTRAINT pk_hospital PRIMARY KEY (hospital_id)
);
-- 2. Crear la tabla de Tanques
CREATE TABLE tank (
    tank_id INT GENERATED ALWAYS AS IDENTITY,
    color VARCHAR(15) NOT NULL,
    status INT NOT NULL,
    tank_size INT NOT NULL,
    
    CONSTRAINT pk_tank PRIMARY KEY (tank_id),
    CONSTRAINT chk_status_bool CHECK (status IN (0, 1)),
    CONSTRAINT chk_tank_size_positivo CHECK (tank_size > 0)
);
-- 3. Crear la tabla intermedia (Historial de movimientos)
-- Relación Uno a Muchos desde 'hospital' y Uno a Muchos desde 'tank'
CREATE TABLE historial (
    hospital_id_fk INT NOT NULL,
    tank_id_fk INT NOT NULL,
    nivel_psi INT NOT NULL,
    fecha_ingreso DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_salida DATE,
    
    -- Llave primaria compuesta (Evita duplicar el mismo tanque en el mismo hospital en la misma fecha de ingreso)
    CONSTRAINT pk_historial PRIMARY KEY (hospital_id_fk, tank_id_fk, fecha_ingreso),
        
    -- Restricciones de validación (CHECKS)
    CONSTRAINT chk_nivel_psi_positivo CHECK (nivel_psi >= 0),
    CONSTRAINT chk_fechas_coherentes CHECK (fecha_salida IS NULL OR fecha_salida >= fecha_ingreso)
);
