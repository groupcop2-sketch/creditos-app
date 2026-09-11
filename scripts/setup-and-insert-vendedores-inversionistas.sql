-- ====================================================================
-- SCRIPT DE INSERCIÓN: VENDEDORES, INVERSIONISTAS Y PLANES DE INVERSIÓN
-- Esquema: "Creditos"
-- ====================================================================

-- 1. ASEGURAR FÓRMULAS DE COMERCIAL / VENDEDORES
INSERT INTO "Creditos"."TBL_FORMULAS_COMERCIAL" (des_formula, val_porcentaje)
VALUES 
('COMISION 8%', 8.0000),
('COMISION 0.05%', 0.0500),
('VALOR FIJO $2.000.000', 0.0000)
ON CONFLICT DO NOTHING;

-- 2. REGISTRAR VENDEDORES / COMERCIALES
INSERT INTO "Creditos"."TBL_COMERCIALES" (
    v_identificacion, v_primer_nombre, v_seg_nombre, v_primer_apell, v_seg_apell, v_nombre_completo, v_correo, v_telefono, id_estado
)
VALUES 
('72173275', 'JAVIER', NULL, 'JANER', 'GOETHE', 'JAVIER JANER GOETHE', 'javierjaner1@gmail.com', '3016039830', 1),
('32772803', 'SHARIN', NULL, 'SALCEDO', 'AVILA', 'SHARIN SALCEDO AVILA', 'sharinsalcedo@gmail.com', '3000000000', 1),
('32877270', 'SILVANA', NULL, 'BARRIOS', 'NAVARRETE', 'SILVANA BARRIOS NAVARRETE', 'silvanabarrios@gmail.com', '3000000001', 1)
ON CONFLICT (v_identificacion) DO UPDATE SET
  v_nombre_completo = EXCLUDED.v_nombre_completo,
  v_primer_nombre = EXCLUDED.v_primer_nombre,
  v_primer_apell = EXCLUDED.v_primer_apell,
  v_seg_apell = EXCLUDED.v_seg_apell;

-- 3. CREAR ESTRUCTURA DE INVERSIONES E INVERSIONISTAS (SI NO EXISTE)
CREATE TABLE IF NOT EXISTS "Creditos"."TBL_INVERSIONISTAS" (
    id_inversionista SERIAL PRIMARY KEY,
    v_identificacion VARCHAR(50) NOT NULL UNIQUE,
    v_razon_social VARCHAR(250) NOT NULL,
    v_nombre_completo VARCHAR(250) NULL,
    fec_nacimiento DATE NULL,
    v_correo VARCHAR(180) NULL,
    v_telefono VARCHAR(60) NULL,
    v_ciudad VARCHAR(100) NULL,
    v_domicilio TEXT NULL,
    v_entidad_bancaria VARCHAR(100) NULL,
    v_tipo_cuenta VARCHAR(50) NULL,
    v_num_cuenta VARCHAR(60) NULL,
    val_dinero NUMERIC(18,2) DEFAULT 0,
    val_inversion_total NUMERIC(18,2) DEFAULT 0,
    val_cartera NUMERIC(18,2) DEFAULT 0,
    val_total_desembolsado NUMERIC(18,2) DEFAULT 0,
    val_total_recuperado NUMERIC(18,2) DEFAULT 0,
    num_prestamos_desembolsados INTEGER DEFAULT 0,
    id_estado INTEGER DEFAULT 1,
    fec_creacion TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Creditos"."TBL_TASAS_INVERSION" (
    id_tasa_inversion SERIAL PRIMARY KEY,
    v_nombre VARCHAR(120) NOT NULL UNIQUE,
    val_porcentaje NUMERIC(6,2) NOT NULL,
    id_estado INTEGER DEFAULT 1
);

INSERT INTO "Creditos"."TBL_TASAS_INVERSION" (v_nombre, val_porcentaje)
VALUES 
('PLAN PLATA 4.00%', 4.00),
('PLAN BRONCE 1.50%', 1.50),
('PLAN ORO 2.00%', 2.00)
ON CONFLICT (v_nombre) DO UPDATE SET val_porcentaje = EXCLUDED.val_porcentaje;

CREATE TABLE IF NOT EXISTS "Creditos"."TBL_INVERSIONES" (
    id_inversion SERIAL PRIMARY KEY,
    id_inversionista INTEGER NOT NULL REFERENCES "Creditos"."TBL_INVERSIONISTAS"(id_inversionista) ON DELETE CASCADE,
    id_tasa_inversion INTEGER REFERENCES "Creditos"."TBL_TASAS_INVERSION"(id_tasa_inversion),
    val_monto NUMERIC(18,2) NOT NULL,
    val_inversion NUMERIC(18,2) NOT NULL,
    val_disponible NUMERIC(18,2) NOT NULL,
    id_estado INTEGER DEFAULT 1,
    fec_creacion TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- 4. REGISTRAR INVERSIONISTAS (DEL PANEL DE DETALLE DE INVERSIONISTA)
INSERT INTO "Creditos"."TBL_INVERSIONISTAS" (
    v_identificacion, v_razon_social, v_nombre_completo, fec_nacimiento, v_correo, v_telefono,
    v_ciudad, v_domicilio, v_entidad_bancaria, v_tipo_cuenta, v_num_cuenta,
    val_dinero, val_inversion_total, val_cartera, val_total_desembolsado, val_total_recuperado, num_prestamos_desembolsados, id_estado
)
VALUES 
(
    '901898386', 'P&S S.A.S.', 'P&S S.A.S.', NULL, 'SERVICIOALCLIENTE@PYSSOLUCIONES.COM', '(321) 461-7966',
    'BARRANQUILLA', 'CALLE 77B # 57 - 103', 'BANCOLOMBIA', 'AHORRO', '48700016402',
    32666220, 900000000, 32666220, 299460462, 31266220, 8, 1
),
(
    '1140888320', 'Marcos Jose Torres Brito', 'Marcos Jose Torres Brito', '1996-09-03', 'MARCOSSTORRES19@HOTMAIL.COM', '(350) 594-9072',
    'BARRANQUILLA', 'CALLE 77B # 57 - 103', 'BANCOLOMBIA', 'AHORRO', '44213979164',
    77106071, 173737998, 77106071, 196304294, 55731326, 22, 1
)
ON CONFLICT (v_identificacion) DO UPDATE SET
  v_razon_social = EXCLUDED.v_razon_social,
  v_nombre_completo = EXCLUDED.v_nombre_completo,
  v_correo = EXCLUDED.v_correo,
  v_telefono = EXCLUDED.v_telefono,
  val_dinero = EXCLUDED.val_dinero,
  val_inversion_total = EXCLUDED.val_inversion_total,
  val_cartera = EXCLUDED.val_cartera,
  val_total_desembolsado = EXCLUDED.val_total_desembolsado,
  val_total_recuperado = EXCLUDED.val_total_recuperado;

-- 5. REGISTRAR PLANES DE INVERSIÓN POR INVERSIONISTA
-- Planes para P&S S.A.S. (901898386)
INSERT INTO "Creditos"."TBL_INVERSIONES" (id_inversionista, id_tasa_inversion, val_monto, val_inversion, val_disponible)
SELECT 
    inv.id_inversionista,
    t.id_tasa_inversion,
    p.val_monto,
    p.val_inversion,
    p.val_disponible
FROM "Creditos"."TBL_INVERSIONISTAS" inv
CROSS JOIN (VALUES
    ('PLAN PLATA 4.00%', 300000000.00, 300000000.00, 539538.00),
    ('PLAN BRONCE 1.50%', 300000000.00, 300000000.00, 300000000.00),
    ('PLAN ORO 2.00%', 300000000.00, 300000000.00, 300000000.00)
) AS p(plan_nom, val_monto, val_inversion, val_disponible)
JOIN "Creditos"."TBL_TASAS_INVERSION" t ON t.v_nombre = p.plan_nom
WHERE inv.v_identificacion = '901898386';

-- Plan para Marcos Jose Torres Brito (1140888320)
INSERT INTO "Creditos"."TBL_INVERSIONES" (id_inversionista, id_tasa_inversion, val_monto, val_inversion, val_disponible)
SELECT 
    inv.id_inversionista,
    t.id_tasa_inversion,
    173737998.00,
    173737998.00,
    7171129.00
FROM "Creditos"."TBL_INVERSIONISTAS" inv
JOIN "Creditos"."TBL_TASAS_INVERSION" t ON t.v_nombre = 'PLAN PLATA 4.00%'
WHERE inv.v_identificacion = '1140888320';
