drop table hospital 
drop table tanque
drop table historial

-- 1. TABLA HOSPITAL
CREATE TABLE hospital (
    hospital_id INT GENERATED ALWAYS AS IDENTITY,
    descripcion VARCHAR(68),
    ubicacion VARCHAR(68),
   
    CONSTRAINT pk_hospital PRIMARY KEY (hospital_id)
);

-- 2. TABLA tanque (1:1 con hospital)
CREATE TABLE tanque (
    tanque_id INT GENERATED ALWAYS AS IDENTITY,
    color VARCHAR(15),
    estado BOOLEAN DEFAULT true, 
    tamanio INT CHECK (tamanio > 0),
    
    hospital_actual_id INT NULL,
   
    CONSTRAINT pk_tanque PRIMARY KEY (tanque_id),
    CONSTRAINT fk_tanque_hospital_actual FOREIGN KEY (hospital_actual_id) REFERENCES hospital(hospital_id)
);

-- 3. tabla historial (n:1 con los tanques)
CREATE TABLE historial (
    hospital_id_fk INT NOT NULL,
    tanque_id_fk INT NOT NULL,
    nivel_psi INT CHECK (nivel_psi >= 0),
    fecha_ingreso DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_salida DATE NULL,
   
    CONSTRAINT pk_historial PRIMARY KEY (tanque_id_fk, fecha_ingreso), -- Mejora en la logica de almacenamiento
    CONSTRAINT fk_historial_hospital FOREIGN KEY (hospital_id_fk) REFERENCES hospital(hospital_id),
    CONSTRAINT fk_historial_tanque FOREIGN KEY (tanque_id_fk) REFERENCES tanque(tanque_id),
    CONSTRAINT chk_fechas_coherentes CHECK (fecha_salida IS NULL OR fecha_salida >= fecha_ingreso)
);

