-- ====================================================================
-- SCRIPT DE INSERCIÓN PURA DE DATOS (EXACTAMENTE ADAPTADO A TU ESQUEMA EN SUPABASE)
-- NO CREA NINGUNA TABLA. SOLO INSERTA LOS DATOS EN TUS TABLAS EXISTENTES.
-- Esquema: "Creditos"
-- ====================================================================

-- 1. ASEGURAR REGISTROS BASE EN TABLAS DE CATÁLOGO (SIN DUPLICAR)
INSERT INTO "Creditos"."TBL_ESTADOS" (id_estado, v_descripcion)
SELECT e.id, e.des
FROM (VALUES (1, 'Activo'), (2, 'Pendiente'), (3, 'Inactivo')) AS e(id, des)
WHERE NOT EXISTS (
  SELECT 1 FROM "Creditos"."TBL_ESTADOS" t WHERE t.id_estado = e.id OR lower(t.v_descripcion) = lower(e.des)
);

INSERT INTO "Creditos"."TBL_TIP_IDENTIFICACIONES" (id_tip_identificacion, v_sigla_identificacion, v_des_identificacion)
SELECT i.id, i.sigla, i.des
FROM (VALUES (1, 'CC', 'CEDULA DE CIUDADANIA'), (2, 'NIT', 'NUMERO DE IDENTIFICACION TRIBUTARIA'), (3, 'CE', 'CEDULA DE EXTRANJERIA')) AS i(id, sigla, des)
WHERE NOT EXISTS (
  SELECT 1 FROM "Creditos"."TBL_TIP_IDENTIFICACIONES" t WHERE t.id_tip_identificacion = i.id OR t.v_sigla_identificacion = i.sigla
);

-- 2. REGISTRO DE LAS 8 PAGADURÍAS / EMPRESAS (TABLA: TBL_EMPRESAS)
INSERT INTO "Creditos"."TBL_EMPRESAS" (v_nit, v_razon_social, v_codigo, id_estado)
SELECT v.v_nit, v.v_razon_social, v.v_codigo, 1
FROM (VALUES 
  ('900036347-0', 'KAL TIRE S.A. DE C.V. SUCURSAL COLOMBIA', '5653'),
  ('902007965-6', 'PYS DEL CARIBE S.A.S.', '2660'),
  ('800037224-5', 'FABRICA DE PRODUCTOS SAYSA S.A.S', '7902'),
  ('114088832-3', 'GRUPO LUX S.A.S.', '8017'),
  ('114088830-9', 'MT CAPITAL S.A.S.', '8596'),
  ('901898386-1', 'P&S SOLUCIONES FINANCIERAS SAS', '7781'),
  ('900955875-0', 'DISTRICUR S.A.S.', '3611'),
  ('800114382-0', 'HOLLOU SCHARAER S.A.S.', '7463')
) AS v(v_nit, v_razon_social, v_codigo)
WHERE NOT EXISTS (
  SELECT 1 FROM "Creditos"."TBL_EMPRESAS" e WHERE e.v_nit = v.v_nit
);

-- 3. REGISTRO DE EMPLEADOS POR PAGADURÍA (TABLA: TBL_EMPLEADOS_EMPRESA)
INSERT INTO "Creditos"."TBL_EMPLEADOS_EMPRESA" 
(id_empresa, v_identificacion, v_primer_nombre, v_segundo_nombre, v_primer_apellido, v_segundo_apellido, v_nombre_completo, v_correo, v_telefono, v_cargo, val_salario, fec_ingreso, ind_tiene_embargos, id_estado)
SELECT e.id_empresa, emp.ident, emp.fn1, emp.fn2, emp.ln1, emp.ln2, emp.fullname, emp.email, emp.phone, emp.cargo, emp.salario, emp.fec_ing::date, emp.embargo, 1
FROM (VALUES
  ('900036347-0', '1048265085', 'Yasuris', 'Naritza', 'Bohórquez', 'Beltran', 'Yasuris Naritza Bohórquez Beltran', 'asecom1pys@gmail.com', NULL, 'Asesor comercial', 2000000, '2026-05-05', false),
  ('900036347-0', '1064118593', 'ANDRES', 'URIEL', 'CASTILLO', 'DE ANGEL', 'ANDRES URIEL CASTILLO DE ANGEL', 'castillodeangelandresuriel@gmail.com', '3126060025', 'MECÁNICO DE LLANTAS 1', 0, '2020-11-01', false),
  ('900036347-0', '1065811707', 'Rafael', 'Ricardo', 'Cantillo', 'Ballesteros', 'Rafael Ricardo Cantillo Ballesteros', 'Rafaelrcantillo@hotmail.com', '3144724649', 'Técnico mantenimiento', 5500000, '2019-06-04', false),
  ('900036347-0', '1064112298', 'JHON', 'EDINSON', 'CUBILLOS', 'ARDILA', 'JHON EDINSON CUBILLOS ARDILA', 'jedcuar2009@homail.com', '3182894807', 'MECÁNICO OTR', 0, '2020-11-01', false),
  ('900036347-0', '1064800649', 'DANIEL', 'ALBERTO', 'LOPEZ', 'GARCIA', 'DANIEL ALBERTO LOPEZ GARCIA', 'danielalbertolopezgarcia94@gmail.com', '3183410080', 'TÉCNICO MECÁNICO EN LLANTAS', 0, '2016-06-13', false),
  ('900036347-0', '77000229', 'Nilson', NULL, 'Meléndez', 'Florez', 'Nilson Meléndez Florez', 'nilsonmelendezf@gmail.com', '3153099103', 'Mecánico', 0, '2014-02-01', false),
  ('900036347-0', '1065576754', 'JEISON', 'FABIÁN', 'MENDOZA', 'SALAZAR', 'JEISON FABIÁN MENDOZA SALAZAR', 'jeison.fabian.mendoza01@gmail.com', '3151194346', 'TÉCNICO MANTENIMIENTO', 0, '2014-02-01', false),
  ('900036347-0', '1007520261', 'Deivis', 'Duvan', 'Erazo', 'Diaz', 'Deivis Duvan Erazo Diaz', 'Deiviserazod@gmail.com', '3171841132', 'Técnico mecánico de llantas 4', 1900000, '2023-09-19', false),
  ('900036347-0', '72203630', 'Armando', NULL, 'Beleño', 'Bolaño', 'Armando Beleño Bolaño', 'armandobb.9@gmail.com', '3153912163', 'GERENTE RECURSOS GESTION HUMANOS', 0, '2008-12-09', false),
  ('900036347-0', '77191463', 'OMAR', 'HUMBERTO', 'CÉSPEDES', 'ORTEGON', 'OMAR HUMBERTO CÉSPEDES ORTEGON', 'omarcspds.10@gmail.com', '3204255093', 'TÉCNICO EN MANTENIMIENTO DE LLANTA', 0, '2023-01-10', true),
  ('900036347-0', '1065824827', 'OMAR', 'DAVID', 'HERRERA', 'FERNANDEZ', 'OMAR DAVID HERRERA FERNANDEZ', 'omar_hf@outlook.com', '3157988445', 'MECANICO', 0, '2020-01-01', false),
  ('900036347-0', '1065565202', 'JUAN', 'GABRIEL', 'CADOZO', 'CORTINA', 'JUAN GABRIEL CADOZO CORTINA', 'jcjuancardozo76@gmail.com', '3170574713', 'MECANICO DE LLANTAS 3', 0, '2020-02-01', false),
  ('900036347-0', '1063293608', 'Andres', 'Felipe', 'Castilla', 'Casiani', 'Andres Felipe Castilla Casiani', 'Andrescastilla_casiani@hotmail.com', '3103558449', 'Técnico Mecánico de llantas', 3576000, '2024-06-04', false),
  ('900036347-0', '1048206369', 'OSCAR', 'DANIEL', 'MOLINA', 'TILANO', 'OSCAR DANIEL MOLINA TILANO', 'oscarmolinatilano@hotmail.com', '3116508002', 'RTC', 18000000, '2011-07-01', false),
  ('900036347-0', '1064800654', 'José', 'Carlos', 'Meneses', 'Sierra', 'José Carlos Meneses Sierra', 'josekarlosmene96@gmail.com', '3156457270', 'Tecnico mecanico de llantaa', 2896200, '2020-02-01', false),
  ('900036347-0', '1082241607', 'SERGIO', 'LUIS', 'SALCEDO', 'CABRERA', 'SERGIO LUIS SALCEDO CABRERA', 'ssergiosalcedo28@outlook.com.ar', '3023597670', 'TÉCNICO', 0, '2018-09-17', false),

  ('902007965-6', '1048327695', 'LORAINE', 'NATALY', 'SAMPER', 'ARENILLA', 'LORAINE NATALY SAMPER ARENILLA', 'LORAINENATALYSAMPER@GMAIL.COM', '3009919888', 'ASISTENTE ADMINISTRATIVO', 2000000, '2025-01-29', false),

  ('800037224-5', '72267198', 'JOHN', 'ROBINSON', 'LOPEZ', 'RODRIGUEZ', 'JOHN ROBINSON LOPEZ RODRIGUEZ', '2282jhon@gmail.com', '3043431632', 'MENSAJERO', 1750905, '2020-03-02', false),
  ('800037224-5', '32793771', 'Shirley', 'Cecilia', 'Cueto', 'Borja', 'Shirley Cecilia Cueto Borja', 'shicueto@yahoo.es', '3115695033', 'Empleada', 1750905, '2020-03-02', false),
  ('800037224-5', '1004346859', 'Sebastián', 'Andrés', 'Solar', 'Nieto', 'Sebastián Andrés Solar Nieto', 'sebastiansolarnieto@gmail.com', '3014842936', 'Empleado', 1803500, '2024-11-06', false),
  ('800037224-5', '1001884710', 'Diego', 'Andres', 'Perez', 'De La Rosa', 'Diego Andres Perez De La Rosa', 'diegogoa449@gmail.com', '3243392815', 'Empleado', 1512000, '2024-11-01', false),
  ('800037224-5', '1129529023', 'Oscar', 'Miguel', 'Beltran', 'Orozco', 'Oscar Miguel Beltran Orozco', 'beltranoscar2505@gmail.com', '3004956553', 'Empleado', 1423500, '2024-11-01', false),
  ('800037224-5', '1043008694', 'Julio', 'Cesar', 'De la hoz', 'Rivera', 'Julio Cesar De la hoz Rivera', 'analuciadelahozperez@gmail.cpm', '3042602734', 'Empleado', 1423500, '2024-12-24', false),
  ('800037224-5', '1002025146', 'Romario', 'Andrés', 'Villalobos', 'Loaiza', 'Romario Andrés Villalobos Loaiza', 'rvillalobosloaiza@gmail.com', '3244098384', 'Empleado', 1750050, '2020-10-01', false),
  ('800037224-5', '1048265322', 'Maribel', 'Andrea', 'Garcia', 'Romero', 'Maribel Andrea Garcia Romero', 'mariigarcia850@gmail.com', '3023719014', 'Empleada', 1700010, '2024-10-17', false),
  ('800037224-5', '1042351301', 'Wendy', 'Paola', 'Cervantes', 'Coronado', 'Wendy Paola Cervantes Coronado', 'paolacervantes0710@gmail.com', '3243087562', 'Empleada', 1423500, '2022-05-24', false),
  ('800037224-5', '72329043', 'Dewis', 'José', 'Noriega', 'Nuñez', 'Dewis José Noriega Nuñez', 'dewisnoriega@hotmail.com', '3016827351', 'Empleado', 1750705, '2012-05-01', false),
  ('800037224-5', '38669485', 'Kelly', 'Patricia', 'Camacho', 'Ocoro', 'Kelly Patricia Camacho Ocoro', 'nelly_rio@hotmail.com', '3043877508', 'Empleada', 1803500, '2024-11-18', false),
  ('800037224-5', '32854584', 'Yolanda', 'María', 'Berrio', 'Berdugo', 'Yolanda María Berrio Berdugo', 'yolandamariaberrioberdugo@gmail.com', '3013078738', 'Empleada', 1478010, '2020-10-01', false),
  ('800037224-5', '50944725', 'Lorya', 'Ludit', 'Quintana', 'Ramos', 'Lorya Ludit Quintana Ramos', 'lorya.2013@hotmail.com', '3103403922', 'Empleada', 1423500, '2024-12-02', false),
  ('800037224-5', '1044928172', 'María', 'Angélica', 'Jimenez', 'Garcés', 'María Angélica Jimenez Garcés', 'maryjiga09@gmail.com', '3018877486', 'Empleada', 1803500, '2025-01-07', false),
  ('800037224-5', '1045736398', 'Juan', 'Antonio', 'Martínez', 'Angulo', 'Juan Antonio Martínez Angulo', 'Sheilyjuan@hotmail.com', '3202190981', 'Empleado', 1700000, '2017-05-05', false),
  ('800037224-5', '32864584', 'Yolanda', 'María', 'Berrio', 'Berdugo', 'Yolanda María Berrio Berdugo 2', 'yolandamariaberrioberdugo2@gmail.com', '3013078738', 'Empleada', 1478010, '2020-10-01', false),
  ('800037224-5', '32789525', 'Monica', 'Patricia', 'Durán', 'De Moya', 'Monica Patricia Durán De Moya', 'mopa7504@gmail.com', '3187353906', 'Empleada', 5694000, '1998-08-10', false),

  ('114088832-3', '8722149', 'JORGE', NULL, 'MALKUN', 'ROJAS', 'JORGE MALKUN ROJAS', 'jmalkun@hotmail.com', '3108774590', 'DIR EJECUTIVO', 0, '2000-06-16', false),
  ('114088832-3', '72187324', 'HARRY', 'NO', 'VILLALOBOS', 'TEJEDA', 'HARRY VILLALOBOS TEJEDA', 'harryvil07@gmail.com', '3023113405', 'ADMINISTRADOR', 0, '2016-03-02', false),
  ('114088832-3', '40928799', 'MARIA', 'JOSE', 'PINZON', 'BRUGES', 'MARIA JOSE PINZON BRUGES', 'maryjose0874@gmail.com', '3017846048', 'ANALISTA', 0, '2026-06-25', false),
  ('114088832-3', '1140842561', 'ALFONSO', 'ANTONIO', 'SALCEDO', 'JAAR', 'ALFONSO ANTONIO SALCEDO JAAR', 'Salcedojaar@gmail.com', '3155437751', 'AUXILIAR', 1423500, '2025-05-27', false),
  ('114088832-3', '1140885568', 'Maria', 'Catalina', 'Martinez', 'Gomez', 'Maria Catalina Martinez Gomez', 'catalinamartinez04@hotmail.com', '3001410178', 'Empleada', 5000000, '2025-03-03', false),
  ('114088832-3', '1140844834', 'ESTEBAN', 'ANDRES', 'PAEZ', 'CASAIS', 'ESTEBAN ANDRES PAEZ CASAISS', 'epaezcasais@gmail.com', '3006725392', 'ASESOR JURIDICO', 0, '2026-01-08', false),
  ('114088832-3', '72173276', 'JAVIER', 'EDUARDO', 'JANER', 'GOETHE', 'JAVIER EDUARDO JANER GOETHE', 'javierjaner1@gmail.com', '3016039830', 'COMERCIAL', 0, '2024-09-03', false),
  ('114088832-3', '1100694757', 'NELCY', 'CAROLINA', 'VELILLA', 'PEREZ', 'NELCY CAROLINA VELILLA PEREZ', 'velillanelcy97@gmail.com', '3235848464', 'ANALISTA FINANCIERO', 0, '2023-01-03', false),
  ('114088832-3', '72121924', 'CARLOS', 'MANUEL', 'HIGGINS', 'VILLANUEVA', 'CARLOS MANUEL HIGGINS VILLANUEVA', 'carloshigginsvillanueva@hotmail.com', '3245856139', 'ABOGADO', 20000000, '1997-01-15', false),
  ('114088832-3', '1042430044', 'Juliet', 'Paola', 'Carreño', 'Barraza', 'Juliet Paola Carreño Barraza', 'juliethcaba@hotmail.com', '3127077263', 'Acoount mánager', 4000000, '2026-02-23', false),
  ('114088832-3', '1044430447', 'ALEJANDRO', 'MARIO', 'AHUMADA', 'TAMARA', 'ALEJANDRO MARIO AHUMADA TAMARA', 'alejandroahumadat@gmail.com', '3022624434', 'gerente', 0, '2024-01-01', false)
) AS emp(nit, ident, fn1, fn2, ln1, ln2, fullname, email, phone, cargo, salario, fec_ing, embargo)
JOIN "Creditos"."TBL_EMPRESAS" e ON e.v_nit = emp.nit
WHERE NOT EXISTS (
  SELECT 1 FROM "Creditos"."TBL_EMPLEADOS_EMPRESA" ee WHERE ee.v_identificacion = emp.ident
);

-- 4. REGISTRO DE VENDEDORES (TABLA: TBL_COMERCIALES)
-- NOTA: id_libranzera e id_tip_identificacion son FKs NOT NULL en TBL_COMERCIALES
INSERT INTO "Creditos"."TBL_COMERCIALES" (
    id_libranzera, v_identificacion, v_primer_nombre, v_seg_nombre, v_primer_apell, v_seg_apell, 
    v_nombre_completo, v_telefono, v_correo, v_codigo_vendedor, id_tip_identificacion, id_estado
)
SELECT 
    COALESCE((SELECT id_libranzera FROM "Creditos"."TBL_LIBRANZERAS" LIMIT 1), 1),
    c.ident, c.fn, c.sn, c.fa, c.sa, c.v_full, c.phone, c.email, c.code,
    COALESCE((SELECT id_tip_identificacion FROM "Creditos"."TBL_TIP_IDENTIFICACIONES" WHERE v_sigla_identificacion = 'CC' LIMIT 1), 1),
    1
FROM (VALUES
  ('72173275', 'JAVIER', NULL, 'JANER', 'GOETHE', 'JAVIER JANER GOETHE', '3016039830', 'javierjaner1@gmail.com', 'VEN-72173275'),
  ('32772803', 'SHARIN', NULL, 'SALCEDO', 'AVILA', 'SHARIN SALCEDO AVILA', '3000000000', 'sharinsalcedo@gmail.com', 'VEN-32772803'),
  ('32877270', 'SILVANA', NULL, 'BARRIOS', 'NAVARRETE', 'SILVANA BARRIOS NAVARRETE', '3000000001', 'silvanabarrios@gmail.com', 'VEN-32877270')
) AS c(ident, fn, sn, fa, sa, v_full, phone, email, code)
WHERE NOT EXISTS (
  SELECT 1 FROM "Creditos"."TBL_COMERCIALES" co WHERE co.v_identificacion = c.ident
);

-- 5. REGISTRO DE LÍNEAS DE CRÉDITO Y PRODUCTOS (TABLAS: TBL_TIPOS_CREDITO, TBL_PRODUCTOS_CREDITO)
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

-- 6. REGISTRO DE INVERSIONISTAS (TABLA: TBL_INVERSIONISTAS)
-- NOTA: v_primer_nombre, v_primer_apell, v_seg_apell, v_telefono, v_correo, id_ciudad, id_estado, id_tip_identificacion son NOT NULL en TBL_INVERSIONISTAS
INSERT INTO "Creditos"."TBL_INVERSIONISTAS" (
    v_identificacion, v_primer_nombre, v_seg_nombre, v_primer_apell, v_seg_apell,
    v_nombre_completo, v_telefono, v_correo, v_direccion, fec_creacion, id_ciudad, id_estado, id_tip_identificacion, fec_nacimiento
)
SELECT 
    i.ident, i.fn, i.sn, i.fa, i.sa, i.fullname, i.phone, i.email, i.direccion, NOW(),
    COALESCE((SELECT id_ciudad FROM "Creditos"."TBL_CIUDADES" LIMIT 1), 1),
    1,
    COALESCE((SELECT id_tip_identificacion FROM "Creditos"."TBL_TIP_IDENTIFICACIONES" WHERE v_sigla_identificacion = i.sigla LIMIT 1), 1),
    i.fec_nac::date
FROM (VALUES
  ('901898386', 'P&S', NULL, 'S.A.S.', '.', 'P&S S.A.S.', '3214617966', 'SERVICIOALCLIENTE@PYSSOLUCIONES.COM', 'CALLE 77B # 57 - 103', 'NIT', NULL),
  ('1140888320', 'Marcos', 'Jose', 'Torres', 'Brito', 'Marcos Jose Torres Brito', '3505949072', 'MARCOSSTORRES19@HOTMAIL.COM', 'CALLE 77B # 57 - 103', 'CC', '1996-09-03')
) AS i(ident, fn, sn, fa, sa, fullname, phone, email, direccion, sigla, fec_nac)
WHERE NOT EXISTS (
  SELECT 1 FROM "Creditos"."TBL_INVERSIONISTAS" inv WHERE inv.v_identificacion = i.ident
);

-- 7. REGISTRO DE TASAS DE INVERSIÓN (TABLA: TBL_TASAS_INVERSION)
-- NOTA: La columna de tasa se llama val_tasa (numeric(10,4))
INSERT INTO "Creditos"."TBL_TASAS_INVERSION" (v_nombre, val_tasa, id_estado)
SELECT t.nom, t.por, 1
FROM (VALUES
  ('PLAN PLATA 4.00%', 4.0000),
  ('PLAN BRONCE 1.50%', 1.5000),
  ('PLAN ORO 2.00%', 2.0000)
) AS t(nom, por)
WHERE NOT EXISTS (
  SELECT 1 FROM "Creditos"."TBL_TASAS_INVERSION" ti WHERE ti.v_nombre = t.nom
);
