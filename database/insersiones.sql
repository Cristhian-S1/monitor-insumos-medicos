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
