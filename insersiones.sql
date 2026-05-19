-- Insertar hospitales
INSERT INTO hospital (descripcion, ubicacion) VALUES
('Hospital Regional de Arica', 'Av. Comandante Arturo Prat 4, Arica'),
('Hospital Juan Noé Crevanni', 'Calle 18 de Septiembre 1000, Arica'),
('Clínica San José', 'Av. Los Graneros 1234, Arica');

-- Insertar tanques
INSERT INTO tanque (color, estado, tamanio, hospital_actual_id) VALUES
('Verde', true, 2200, 1),
('Blanco', true, 1800, 1),
('Rojo', true, 1500, 1),
('Verde', true, 2000, 2),
('Azul', true, 1600, 2),
('Blanco', true, 1200, 3);

-- Insertar historial
-- Tanque 1 (Hospital Regional)
-- Tanque 2 (Hospital Regional)
-- Tanque 3 (Hospital Regional)
-- Tanque 4 (Hospital Juan Noé)
-- Tanque 5 (Hospital Juan Noé)
-- Tanque 6 (Clínica San José)

INSERT INTO historial (hospital_id_fk, tanque_id_fk, nivel_psi, fecha_ingreso, fecha_salida) VALUES
(1, 1, 2100, '2026-05-01', NULL),
(1, 1, 1850, '2026-05-10', '2026-05-12'),
(1, 1, 920, '2026-05-15', NULL),

(1, 2, 450, '2026-05-12', '2026-05-14'),
(1, 2, 1680, '2026-05-16', NULL),

(1, 3, 1480, '2026-05-08', NULL),

(2, 4, 1950, '2026-05-05', NULL),
(2, 4, 780, '2026-05-18', NULL),

(2, 5, 320, '2026-05-17', NULL),

(3, 6, 1150, '2026-05-14', NULL),
(3, 6, 80, '2026-05-19', NULL);


-- Stock de oxígeno por tanque (Disponible / Agotado)
-- Calcula el porcentaje de oxigeno para un hospital 
-- La condicion del porcentaje esta dada por SUM(hi.nivel_psi) * 100.0 / SUM(t.tamanio) >= 30
-- Donde menor a 30% se mostrara como agotada (podemos indicar disponible, bajo, agotado ante ciertos niveles)
SELECT
    h.descripcion                                               AS hospital,
    SUM(hi.nivel_psi)                                          AS nivel_total_psi,
    SUM(t.tamanio)                                             AS capacidad_total_psi,
    ROUND(SUM(hi.nivel_psi) * 100.0 / SUM(t.tamanio), 1)      AS porcentaje,
    CASE
        WHEN SUM(hi.nivel_psi) * 100.0 / SUM(t.tamanio) >= 30
        THEN 'Disponible'
        ELSE 'Agotado'
    END                                                        AS stock
FROM hospital h
JOIN tanque   t  ON t.hospital_actual_id = h.hospital_id
JOIN historial hi ON hi.tanque_id_fk = t.tanque_id
WHERE h.hospital_id = 1
  AND hi.fecha_ingreso = (          -- Solo el registro más reciente por tanque
        SELECT MAX(fecha_ingreso)
        FROM historial
        WHERE tanque_id_fk = t.tanque_id
      )
GROUP BY h.descripcion;

/*
Tanque 1 (Verde)  → nivel actual: 920  PSI  / capacidad: 2200 PSI
Tanque 2 (Blanco) → nivel actual: 1680 PSI  / capacidad: 1800 PSI
Tanque 3 (Rojo)   → nivel actual: 1480 PSI  / capacidad: 1500 PSI
                                   ────────            ─────────
SUM nivel actual →               4100 PSI  / 5500 PSI  = 74.5%
*/