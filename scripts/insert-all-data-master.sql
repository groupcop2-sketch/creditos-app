-- ====================================================================
-- SCRIPT COMPLETO DE INSERCIÓN MAESTRA (100% COMPATIBLE SUPABASE)
-- Esquema: "Creditos"
-- Utiliza subconsultas WHERE NOT EXISTS en lugar de ON CONFLICT
-- ====================================================================

-- 1. ESTADOS BASE
INSERT INTO "Creditos"."TBL_ESTADOS" (v_descripcion)
SELECT v FROM (VALUES ('Activo'), ('Pendiente'), ('Inactivo')) AS t(v)
WHERE NOT EXISTS (
  SELECT 1 FROM "Creditos"."TBL_ESTADOS" WHERE lower(v_descripcion) = lower(t.v)
);

-- 2. PAGADURÍAS / EMPRESAS (8 DE EXCEL)
INSERT INTO "Creditos"."TBL_EMPRESAS" (
    v_codigo, v_nit, v_dv, v_razon_social, num_empleados, val_cupo, val_cupo_saldo, id_estado
)
SELECT v.v_codigo, v.v_nit, v.v_dv, v.v_razon_social, v.num_empleados, v.val_cupo, v.val_cupo_saldo, v.id_estado
FROM (VALUES 
  ('5653', '900036347-0', '0', 'KAL TIRE S.A. DE C.V. SUCURSAL COLOMBIA', 16, 0, 0, 1),
  ('2660', '902007965-6', '6', 'PYS DEL CARIBE S.A.S.', 1, 0, 0, 1),
  ('7902', '800037224-5', '5', 'FABRICA DE PRODUCTOS SAYSA S.A.S', 17, 0, 0, 1),
  ('8017', '114088832-3', '3', 'GRUPO LUX S.A.S.', 11, 0, 0, 1),
  ('8596', '114088830-9', '9', 'MT CAPITAL S.A.S.', 3, 0, 0, 1),
  ('7781', '901898386-1', '1', 'P&S SOLUCIONES FINANCIERAS SAS', 3, 0, 0, 2),
  ('3611', '900955875-0', '0', 'DISTRICUR S.A.S.', 4, 0, 0, 1),
  ('7463', '800114382-0', '0', 'HOLLOU SCHARAER S.A.S.', 1, 0, 0, 1)
) AS v(v_codigo, v_nit, v_dv, v_razon_social, num_empleados, val_cupo, val_cupo_saldo, id_estado)
WHERE NOT EXISTS (
  SELECT 1 FROM "Creditos"."TBL_EMPRESAS" e WHERE e.v_nit = v.v_nit
);

-- 3. EMPLEADOS POR EMPRESA (46 REGISTROS)
INSERT INTO "Creditos"."TBL_EMPLEADOS_EMPRESA" 
(id_empresa, v_identificacion, v_primer_nombre, v_segundo_nombre, v_primer_apellido, v_segundo_apellido, v_nombre_completo, v_correo, v_telefono, v_cargo, val_salario, val_neto, fec_ingreso, ind_tiene_embargos, id_estado)
SELECT e.id_empresa, emp.ident, emp.fn1, emp.fn2, emp.ln1, emp.ln2, emp.fullname, emp.email, emp.phone, emp.cargo, emp.salario, emp.neto, emp.fec_ing::date, emp.embargo, 1
FROM (VALUES
  ('900036347-0', '1048265085', 'Yasuris', 'Naritza', 'Bohórquez', 'Beltran', 'Yasuris Naritza Bohórquez Beltran', 'asecom1pys@gmail.com', NULL, 'Asesor comercial', 2000000, 1700000, '2026-05-05', false),
  ('900036347-0', '1064118593', 'ANDRES', 'URIEL', 'CASTILLO', 'DE ANGEL', 'ANDRES URIEL CASTILLO DE ANGEL', 'castillodeangelandresuriel@gmail.com', '3126060025', 'MECÁNICO DE LLANTAS 1', 0, 6300000, '2020-11-01', false),
  ('900036347-0', '1065811707', 'Rafael', 'Ricardo', 'Cantillo', 'Ballesteros', 'Rafael Ricardo Cantillo Ballesteros', 'Rafaelrcantillo@hotmail.com', '3144724649', 'Técnico mantenimiento', 5500000, 5500000, '2019-06-04', false),
  ('900036347-0', '1064112298', 'JHON', 'EDINSON', 'CUBILLOS', 'ARDILA', 'JHON EDINSON CUBILLOS ARDILA', 'jedcuar2009@homail.com', '3182894807', 'MECÁNICO OTR', 0, 4000000, '2020-11-01', false),
  ('900036347-0', '1064800649', 'DANIEL', 'ALBERTO', 'LOPEZ', 'GARCIA', 'DANIEL ALBERTO LOPEZ GARCIA', 'danielalbertolopezgarcia94@gmail.com', '3183410080', 'TÉCNICO MECÁNICO EN LLANTAS', 0, 5300000, '2016-06-13', false),
  ('900036347-0', '77000229', 'Nilson', NULL, 'Meléndez', 'Florez', 'Nilson Meléndez Florez', 'nilsonmelendezf@gmail.com', '3153099103', 'Mecánico', 0, 5500000, '2014-02-01', false),
  ('900036347-0', '1065576754', 'JEISON', 'FABIÁN', 'MENDOZA', 'SALAZAR', 'JEISON FABIÁN MENDOZA SALAZAR', 'jeison.fabian.mendoza01@gmail.com', '3151194346', 'TÉCNICO MANTENIMIENTO', 0, 5600000, '2014-02-01', false),
  ('900036347-0', '1007520261', 'Deivis', 'Duvan', 'Erazo', 'Diaz', 'Deivis Duvan Erazo Diaz', 'Deiviserazod@gmail.com', '3171841132', 'Técnico mecánico de llantas 4', 1900000, 4000000, '2023-09-19', false),
  ('900036347-0', '72203630', 'Armando', NULL, 'Beleño', 'Bolaño', 'Armando Beleño Bolaño', 'armandobb.9@gmail.com', '3153912163', 'GERENTE RECURSOS GESTION HUMANOS', 0, 15500000, '2008-12-09', false),
  ('900036347-0', '77191463', 'OMAR', 'HUMBERTO', 'CÉSPEDES', 'ORTEGON', 'OMAR HUMBERTO CÉSPEDES ORTEGON', 'omarcspds.10@gmail.com', '3204255093', 'TÉCNICO EN MANTENIMIENTO DE LLANTA', 0, 2209000, '2023-01-10', true),
  ('900036347-0', '1065824827', 'OMAR', 'DAVID', 'HERRERA', 'FERNANDEZ', 'OMAR DAVID HERRERA FERNANDEZ', 'omar_hf@outlook.com', '3157988445', 'MECANICO', 0, 6000000, '2020-01-01', false),
  ('900036347-0', '1065565202', 'JUAN', 'GABRIEL', 'CADOZO', 'CORTINA', 'JUAN GABRIEL CADOZO CORTINA', 'jcjuancardozo76@gmail.com', '3170574713', 'MECANICO DE LLANTAS 3', 0, 2367000, '2020-02-01', false),
  ('900036347-0', '1063293608', 'Andres', 'Felipe', 'Castilla', 'Casiani', 'Andres Felipe Castilla Casiani', 'Andrescastilla_casiani@hotmail.com', '3103558449', 'Técnico Mecánico de llantas', 3576000, 3576000, '2024-06-04', false),
  ('900036347-0', '1048206369', 'OSCAR', 'DANIEL', 'MOLINA', 'TILANO', 'OSCAR DANIEL MOLINA TILANO', 'oscarmolinatilano@hotmail.com', '3116508002', 'RTC', 18000000, 18000000, '2011-07-01', false),
  ('900036347-0', '1064800654', 'José', 'Carlos', 'Meneses', 'Sierra', 'José Carlos Meneses Sierra', 'josekarlosmene96@gmail.com', '3156457270', 'Tecnico mecanico de llantaa', 2896200, 5300000, '2020-02-01', false),
  ('900036347-0', '1082241607', 'SERGIO', 'LUIS', 'SALCEDO', 'CABRERA', 'SERGIO LUIS SALCEDO CABRERA', 'ssergiosalcedo28@outlook.com.ar', '3023597670', 'TÉCNICO', 0, 4000000, '2018-09-17', false),

  ('902007965-6', '1048327695', 'LORAINE', 'NATALY', 'SAMPER', 'ARENILLA', 'LORAINE NATALY SAMPER ARENILLA', 'LORAINENATALYSAMPER@GMAIL.COM', '3009919888', 'ASISTENTE ADMINISTRATIVO', 2000000, 2000000, '2025-01-29', false),

  ('800037224-5', '72267198', 'JOHN', 'ROBINSON', 'LOPEZ', 'RODRIGUEZ', 'JOHN ROBINSON LOPEZ RODRIGUEZ', '2282jhon@gmail.com', '3043431632', 'MENSAJERO', 1750905, 2400905, '2020-03-02', false),
  ('800037224-5', '32793771', 'Shirley', 'Cecilia', 'Cueto', 'Borja', 'Shirley Cecilia Cueto Borja', 'shicueto@yahoo.es', '3115695033', 'Empleada', 1750905, 1425000, '2020-03-02', false),
  ('800037224-5', '1004346859', 'Sebastián', 'Andrés', 'Solar', 'Nieto', 'Sebastián Andrés Solar Nieto', 'sebastiansolarnieto@gmail.com', '3014842936', 'Empleado', 1803500, 1724140, '2024-11-06', false),
  ('800037224-5', '1001884710', 'Diego', 'Andres', 'Perez', 'De La Rosa', 'Diego Andres Perez De La Rosa', 'diegogoa449@gmail.com', '3243392815', 'Empleado', 1512000, 1394110, '2024-11-01', false),
  ('800037224-5', '1129529023', 'Oscar', 'Miguel', 'Beltran', 'Orozco', 'Oscar Miguel Beltran Orozco', 'beltranoscar2505@gmail.com', '3004956553', 'Empleado', 1423500, 1216872, '2024-11-01', false),
  ('800037224-5', '1043008694', 'Julio', 'Cesar', 'De la hoz', 'Rivera', 'Julio Cesar De la hoz Rivera', 'analuciadelahozperez@gmail.cpm', '3042602734', 'Empleado', 1423500, 2847000, '2024-12-24', false),
  ('800037224-5', '1002025146', 'Romario', 'Andrés', 'Villalobos', 'Loaiza', 'Romario Andrés Villalobos Loaiza', 'rvillalobosloaiza@gmail.com', '3244098384', 'Empleado', 1750050, 1171092, '2020-10-01', false),
  ('800037224-5', '1048265322', 'Maribel', 'Andrea', 'Garcia', 'Romero', 'Maribel Andrea Garcia Romero', 'mariigarcia850@gmail.com', '3023719014', 'Empleada', 1700010, 1365862, '2024-10-17', false),
  ('800037224-5', '1042351301', 'Wendy', 'Paola', 'Cervantes', 'Coronado', 'Wendy Paola Cervantes Coronado', 'paolacervantes0710@gmail.com', '3243087562', 'Empleada', 1423500, 1175024, '2022-05-24', false),
  ('800037224-5', '72329043', 'Dewis', 'José', 'Noriega', 'Nuñez', 'Dewis José Noriega Nuñez', 'dewisnoriega@hotmail.com', '3016827351', 'Empleado', 1750705, 2347072, '2012-05-01', false),
  ('800037224-5', '38669485', 'Kelly', 'Patricia', 'Camacho', 'Ocoro', 'Kelly Patricia Camacho Ocoro', 'nelly_rio@hotmail.com', '3043877508', 'Empleada', 1803500, 1859220, '2024-11-18', false),
  ('800037224-5', '32854584', 'Yolanda', 'María', 'Berrio', 'Berdugo', 'Yolanda María Berrio Berdugo', 'yolandamariaberrioberdugo@gmail.com', '3013078738', 'Empleada', 1478010, 896670, '2020-10-01', false),
  ('800037224-5', '50944725', 'Lorya', 'Ludit', 'Quintana', 'Ramos', 'Lorya Ludit Quintana Ramos', 'lorya.2013@hotmail.com', '3103403922', 'Empleada', 1423500, 2847000, '2024-12-02', false),
  ('800037224-5', '1044928172', 'María', 'Angélica', 'Jimenez', 'Garcés', 'María Angélica Jimenez Garcés', 'maryjiga09@gmail.com', '3018877486', 'Empleada', 1803500, 1874100, '2025-01-07', false),
  ('800037224-5', '1045736398', 'Juan', 'Antonio', 'Martínez', 'Angulo', 'Juan Antonio Martínez Angulo', 'Sheilyjuan@hotmail.com', '3202190981', 'Empleado', 1700000, 3400000, '2017-05-05', false),
  ('800037224-5', '32864584', 'Yolanda', 'María', 'Berrio', 'Berdugo', 'Yolanda María Berrio Berdugo 2', 'yolandamariaberrioberdugo2@gmail.com', '3013078738', 'Empleada', 1478010, 896670, '2020-10-01', false),
  ('800037224-5', '32789525', 'Monica', 'Patricia', 'Durán', 'De Moya', 'Monica Patricia Durán De Moya', 'mopa7504@gmail.com', '3187353906', 'Empleada', 5694000, 4260528, '1998-08-10', false),

  ('114088832-3', '8722149', 'JORGE', NULL, 'MALKUN', 'ROJAS', 'JORGE MALKUN ROJAS', 'jmalkun@hotmail.com', '3108774590', 'DIR EJECUTIVO', 0, 25000000, '2000-06-16', false),
  ('114088832-3', '72187324', 'HARRY', 'NO', 'VILLALOBOS', 'TEJEDA', 'HARRY VILLALOBOS TEJEDA', 'harryvil07@gmail.com', '3023113405', 'ADMINISTRADOR', 0, 14600000, '2016-03-02', false),
  ('114088832-3', '40928799', 'MARIA', 'JOSE', 'PINZON', 'BRUGES', 'MARIA JOSE PINZON BRUGES', 'maryjose0874@gmail.com', '3017846048', 'ANALISTA', 0, 3000000, '2026-06-25', false),
  ('114088832-3', '1140842561', 'ALFONSO', 'ANTONIO', 'SALCEDO', 'JAAR', 'ALFONSO ANTONIO SALCEDO JAAR', 'Salcedojaar@gmail.com', '3155437751', 'AUXILIAR', 1423500, 1400000, '2025-05-27', false),
  ('114088832-3', '1140885568', 'Maria', 'Catalina', 'Martinez', 'Gomez', 'Maria Catalina Martinez Gomez', 'catalinamartinez04@hotmail.com', '3001410178', 'Empleada', 5000000, 3000000, '2025-03-03', false),
  ('114088832-3', '1140844834', 'ESTEBAN', 'ANDRES', 'PAEZ', 'CASAIS', 'ESTEBAN ANDRES PAEZ CASAISS', 'epaezcasais@gmail.com', '3006725392', 'ASESOR JURIDICO', 0, 5000000, '2026-01-08', false),
  ('114088832-3', '72173276', 'JAVIER', 'EDUARDO', 'JANER', 'GOETHE', 'JAVIER EDUARDO JANER GOETHE', 'javierjaner1@gmail.com', '3016039830', 'COMERCIAL', 0, 6000000, '2024-09-03', false),
  ('114088832-3', '1100694757', 'NELCY', 'CAROLINA', 'VELILLA', 'PEREZ', 'NELCY CAROLINA VELILLA PEREZ', 'velillanelcy97@gmail.com', '3235848464', 'ANALISTA FINANCIERO', 0, 4000000, '2023-01-03', false),
  ('114088832-3', '72121924', 'CARLOS', 'MANUEL', 'HIGGINS', 'VILLANUEVA', 'CARLOS MANUEL HIGGINS VILLANUEVA', 'carloshigginsvillanueva@hotmail.com', '3245856139', 'ABOGADO', 20000000, 20000000, '1997-01-15', false),
  ('114088832-3', '1042430044', 'Juliet', 'Paola', 'Carreño', 'Barraza', 'Juliet Paola Carreño Barraza', 'juliethcaba@hotmail.com', '3127077263', 'Acoount mánager', 4000000, 3000000, '2026-02-23', false),
  ('114088832-3', '1044430447', 'ALEJANDRO', 'MARIO', 'AHUMADA', 'TAMARA', 'ALEJANDRO MARIO AHUMADA TAMARA', 'alejandroahumadat@gmail.com', '3022624434', 'gerente', 0, 7600000, '2024-01-01', false)
) AS emp(nit, ident, fn1, fn2, ln1, ln2, fullname, email, phone, cargo, salario, neto, fec_ing, embargo)
JOIN "Creditos"."TBL_EMPRESAS" e ON e.v_nit = emp.nit
WHERE NOT EXISTS (
  SELECT 1 FROM "Creditos"."TBL_EMPLEADOS_EMPRESA" ee WHERE ee.v_identificacion = emp.ident
);

-- 4. VENDEDORES / COMERCIALES (3 VENDEDORES)
INSERT INTO "Creditos"."TBL_FORMULAS_COMERCIAL" (des_formula, val_porcentaje)
SELECT f.des, f.por
FROM (VALUES ('COMISION 8%', 8.0000), ('COMISION 0.05%', 0.0500), ('VALOR FIJO', 0.0000)) AS f(des, por)
WHERE NOT EXISTS (
  SELECT 1 FROM "Creditos"."TBL_FORMULAS_COMERCIAL" fc WHERE fc.des_formula = f.des
);

INSERT INTO "Creditos"."TBL_COMERCIALES" (
    v_identificacion, v_primer_nombre, v_seg_nombre, v_primer_apell, v_seg_apell, v_nombre_completo, v_correo, v_telefono, id_estado
)
SELECT c.ident, c.fn, c.sn, c.fa, c.sa, c.v_full, c.email, c.phone, 1
FROM (VALUES
  ('72173275', 'JAVIER', NULL, 'JANER', 'GOETHE', 'JAVIER JANER GOETHE', 'javierjaner1@gmail.com', '3016039830'),
  ('32772803', 'SHARIN', NULL, 'SALCEDO', 'AVILA', 'SHARIN SALCEDO AVILA', 'sharinsalcedo@gmail.com', '3000000000'),
  ('32877270', 'SILVANA', NULL, 'BARRIOS', 'NAVARRETE', 'SILVANA BARRIOS NAVARRETE', 'silvanabarrios@gmail.com', '3000000001')
) AS c(ident, fn, sn, fa, sa, v_full, email, phone)
WHERE NOT EXISTS (
  SELECT 1 FROM "Creditos"."TBL_COMERCIALES" co WHERE co.v_identificacion = c.ident
);        

-- 5. LÍNEAS Y PRODUCTOS DE CRÉDITO
INSERT INTO "Creditos"."TBL_TIPOS_CREDITO" (des_tipo_credito)
SELECT t.v FROM (VALUES ('LIBRANZA'), ('GARANTIA REAL'), ('ANTICIPO PRIMAS'), ('LIBRE INVERSION')) AS t(v)
WHERE NOT EXISTS (
  SELECT 1 FROM "Creditos"."TBL_TIPOS_CREDITO" tc WHERE tc.des_tipo_credito = t.v
);

INSERT INTO "Creditos"."TBL_PRODUCTOS_CREDITO" (
    consecutivo, nombre, id_tipo_credito, monto_maximo, salario_minimo, salario_maximo,
    plazo_minimo, plazo_maximo, permite_refinanciacion, permite_retanqueo, id_estado
)
SELECT p.consecutivo, p.nombre, tc.id_tipo_credito, p.monto_maximo, p.salario_minimo, p.salario_maximo, p.plazo_minimo, p.plazo_maximo, p.permite_refinanciacion, p.permite_retanqueo, 1
FROM (VALUES
  ('001014', 'GARANTIA 6', 'LIBRANZA', 200000000, 1, 15, 1, 6, true, false),
  ('001010', 'LIBRANZA PLUS', 'LIBRANZA', 150000000, 1, 15, 1, 36, true, true),
  ('001013', 'LI3M', 'LIBRANZA', 50000000, 1, 4, 1, 3, false, false),
  ('001012', 'GARANTIA REAL', 'GARANTIA REAL', 200000000, 1, 15, 1, 3, false, false),
  ('001011', 'ANTICIPO PRIMAS', 'ANTICIPO PRIMAS', 30000000, 1, 10, 1, 6, false, false),
  ('001009', 'LIBRANZA', 'LIBRANZA', 100000000, 1, 15, 1, 60, true, true)
) AS p(consecutivo, nombre, tipo_cred, monto_maximo, salario_minimo, salario_maximo, plazo_minimo, plazo_maximo, permite_refinanciacion, permite_retanqueo)
JOIN "Creditos"."TBL_TIPOS_CREDITO" tc ON tc.des_tipo_credito = p.tipo_cred
WHERE NOT EXISTS (
  SELECT 1 FROM "Creditos"."TBL_PRODUCTOS_CREDITO" pc WHERE pc.consecutivo = p.consecutivo
);

-- 6. TABLAS E INSERCIONES DE INVERSIONISTAS Y PLANES DE INVERSIÓN
CREATE TABLE IF NOT EXISTS "Creditos"."TBL_INVERSIONISTAS" (
    id_inversionista SERIAL PRIMARY KEY,
    v_identificacion VARCHAR(50) NOT NULL,
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
    v_nombre VARCHAR(120) NOT NULL,
    val_porcentaje NUMERIC(6,2) NOT NULL,
    id_estado INTEGER DEFAULT 1
);

INSERT INTO "Creditos"."TBL_TASAS_INVERSION" (v_nombre, val_porcentaje)
SELECT t.nom, t.por
FROM (VALUES
  ('PLAN PLATA 4.00%', 4.00),
  ('PLAN BRONCE 1.50%', 1.50),
  ('PLAN ORO 2.00%', 2.00)
) AS t(nom, por)
WHERE NOT EXISTS (
  SELECT 1 FROM "Creditos"."TBL_TASAS_INVERSION" ti WHERE ti.v_nombre = t.nom
);

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

-- REGISTRO DE LOS 2 INVERSIONISTAS
INSERT INTO "Creditos"."TBL_INVERSIONISTAS" (
    v_identificacion, v_razon_social, v_nombre_completo, fec_nacimiento, v_correo, v_telefono,
    v_ciudad, v_domicilio, v_entidad_bancaria, v_tipo_cuenta, v_num_cuenta,
    val_dinero, val_inversion_total, val_cartera, val_total_desembolsado, val_total_recuperado, num_prestamos_desembolsados, id_estado
)
SELECT i.ident, i.razon, i.nombre, i.fec_nac::date, i.email, i.phone, i.ciudad, i.domicilio, i.banco, i.tipo_cta, i.num_cta, i.dinero, i.inv_tot, i.cartera, i.desemb, i.recup, i.num_p, 1
FROM (VALUES
  ('901898386', 'P&S S.A.S.', 'P&S S.A.S.', NULL, 'SERVICIOALCLIENTE@PYSSOLUCIONES.COM', '(321) 461-7966', 'BARRANQUILLA', 'CALLE 77B # 57 - 103', 'BANCOLOMBIA', 'AHORRO', '48700016402', 32666220, 900000000, 32666220, 299460462, 31266220, 8),
  ('1140888320', 'Marcos Jose Torres Brito', 'Marcos Jose Torres Brito', '1996-09-03', 'MARCOSSTORRES19@HOTMAIL.COM', '(350) 594-9072', 'BARRANQUILLA', 'CALLE 77B # 57 - 103', 'BANCOLOMBIA', 'AHORRO', '44213979164', 77106071, 173737998, 77106071, 196304294, 55731326, 22)
) AS i(ident, razon, nombre, fec_nac, email, phone, ciudad, domicilio, banco, tipo_cta, num_cta, dinero, inv_tot, cartera, desemb, recup, num_p)
WHERE NOT EXISTS (
  SELECT 1 FROM "Creditos"."TBL_INVERSIONISTAS" inv WHERE inv.v_identificacion = i.ident
);

-- REGISTRO DE PLANES DE INVERSIÓN
INSERT INTO "Creditos"."TBL_INVERSIONES" (id_inversionista, id_tasa_inversion, val_monto, val_inversion, val_disponible)
SELECT 
    inv.id_inversionista,
    t.id_tasa_inversion,
    p.val_monto,
    p.val_inversion,
    p.val_disponible
FROM (VALUES
    ('901898386', 'PLAN PLATA 4.00%', 300000000.00, 300000000.00, 539538.00),
    ('901898386', 'PLAN BRONCE 1.50%', 300000000.00, 300000000.00, 300000000.00),
    ('901898386', 'PLAN ORO 2.00%', 300000000.00, 300000000.00, 300000000.00),
    ('1140888320', 'PLAN PLATA 4.00%', 173737998.00, 173737998.00, 7171129.00)
) AS p(ident, plan_nom, val_monto, val_inversion, val_disponible)
JOIN "Creditos"."TBL_INVERSIONISTAS" inv ON inv.v_identificacion = p.ident
JOIN "Creditos"."TBL_TASAS_INVERSION" t ON t.v_nombre = p.plan_nom
WHERE NOT EXISTS (
  SELECT 1 FROM "Creditos"."TBL_INVERSIONES" inv_exist 
  WHERE inv_exist.id_inversionista = inv.id_inversionista AND inv_exist.id_tasa_inversion = t.id_tasa_inversion
);
