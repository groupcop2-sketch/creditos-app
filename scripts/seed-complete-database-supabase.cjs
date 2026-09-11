const { Client } = require('pg');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Cargar variables de entorno desde .env si existe
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const [key, ...valueParts] = trimmed.split('=');
    process.env[key.trim()] ??= valueParts.join('=').trim().replace(/^["']|["']$/g, '');
  }
}

// Configuración de Supabase
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://grqvinvnvhaysnfzszpm.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdycXZpbnZudmhheXNuZnpzenBtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2MjU1OTEsImV4cCI6MjA5OTIwMTU5MX0.cHTA_4OYH2E7D_5Nu5D8BiwJ-gMY-USvnA4KoVzRLL4';
const dbName = process.env.PGDATABASE || 'P&S';
const schema = '"Creditos"';

// ----------------------------------------------------
// 1. DATOS DE PAGADURÍAS (EXCEL)
// ----------------------------------------------------
const PAGADURIAS_DATA = [
  { codigo: '5653', nit: '900036347-0', dv: '0', razonSocial: 'KAL TIRE S.A. DE C.V. SUCURSAL COLOMBIA', empleados: 16, cupo: 0, cupoSaldo: 0, estado: 'ACTIVO' },
  { codigo: '2660', nit: '902007965-6', dv: '6', razonSocial: 'PYS DEL CARIBE S.A.S.', empleados: 1, cupo: 0, cupoSaldo: 0, estado: 'ACTIVO' },
  { codigo: '7902', nit: '800037224-5', dv: '5', razonSocial: 'FABRICA DE PRODUCTOS SAYSA S.A.S', empleados: 17, cupo: 0, cupoSaldo: 0, estado: 'ACTIVO' },
  { codigo: '8017', nit: '114088832-3', dv: '3', razonSocial: 'GRUPO LUX S.A.S.', empleados: 11, cupo: 0, cupoSaldo: 0, estado: 'ACTIVO' },
  { codigo: '8596', nit: '114088830-9', dv: '9', razonSocial: 'MT CAPITAL S.A.S.', empleados: 3, cupo: 0, cupoSaldo: 0, estado: 'ACTIVO' },
  { codigo: '7781', nit: '901898386-1', dv: '1', razonSocial: 'P&S SOLUCIONES FINANCIERAS SAS', empleados: 3, cupo: 0, cupoSaldo: 0, estado: 'PENDIENTE' },
  { codigo: '3611', nit: '900955875-0', dv: '0', razonSocial: 'DISTRICUR S.A.S.', empleados: 4, cupo: 0, cupoSaldo: 0, estado: 'ACTIVO' },
  { codigo: '7463', nit: '800114382-0', dv: '0', razonSocial: 'HOLLOU SCHARAER S.A.S.', empleados: 1, cupo: 0, cupoSaldo: 0, estado: 'ACTIVO' }
];

// ----------------------------------------------------
// 2. DATOS DE EMPLEADOS (JSON DE PAYROLL COMPANIES)
// ----------------------------------------------------
const EMPLEADOS_PAYROLL_DATA = [
  // KAL TIRE S.A. DE C.V. SUCURSAL COLOMBIA
  { empresaNit: '900036347-0', identificacion: '1048265085', primerNombre: 'Yasuris', segundoNombre: 'Naritza', primerApellido: 'Bohórquez', segundoApellido: 'Beltran', nombreCompleto: 'Yasuris Naritza Bohórquez Beltran', correo: 'asecom1pys@gmail.com', telefono: null, cargo: 'Asesor comercial', fechaIngreso: '2026-05-05', salario: 2000000, neto: 1700000, embargos: false },
  { empresaNit: '900036347-0', identificacion: '1064118593', primerNombre: 'ANDRES', segundoNombre: 'URIEL', primerApellido: 'CASTILLO', segundoApellido: 'DE ANGEL', nombreCompleto: 'ANDRES URIEL CASTILLO DE ANGEL', correo: 'castillodeangelandresuriel@gmail.com', telefono: '3126060025', cargo: 'MECÁNICO DE LLANTAS 1', fechaIngreso: '2020-11-01', salario: 0, neto: 6300000, embargos: false },
  { empresaNit: '900036347-0', identificacion: '1065811707', primerNombre: 'Rafael', segundoNombre: 'Ricardo', primerApellido: 'Cantillo', segundoApellido: 'Ballesteros', nombreCompleto: 'Rafael Ricardo Cantillo Ballesteros', correo: 'Rafaelrcantillo@hotmail.com', telefono: '3144724649', cargo: 'Técnico mantenimiento', fechaIngreso: '2019-06-04', salario: 5500000, neto: 5500000, embargos: false },
  { empresaNit: '900036347-0', identificacion: '1064112298', primerNombre: 'JHON', segundoNombre: 'EDINSON', primerApellido: 'CUBILLOS', segundoApellido: 'ARDILA', nombreCompleto: 'JHON EDINSON CUBILLOS ARDILA', correo: 'jedcuar2009@homail.com', telefono: '3182894807', cargo: 'MECÁNICO OTR', fechaIngreso: '2020-11-01', salario: 0, neto: 4000000, embargos: false },
  { empresaNit: '900036347-0', identificacion: '1064800649', primerNombre: 'DANIEL', segundoNombre: 'ALBERTO', primerApellido: 'LOPEZ', segundoApellido: 'GARCIA', nombreCompleto: 'DANIEL ALBERTO LOPEZ GARCIA', correo: 'danielalbertolopezgarcia94@gmail.com', telefono: '3183410080', cargo: 'TÉCNICO MECÁNICO EN LLANTAS', fechaIngreso: '2016-06-13', salario: 0, neto: 5300000, embargos: false },
  { empresaNit: '900036347-0', identificacion: '77000229', primerNombre: 'Nilson', segundoNombre: null, primerApellido: 'Meléndez', segundoApellido: 'Florez', nombreCompleto: 'Nilson Meléndez Florez', correo: 'nilsonmelendezf@gmail.com', telefono: '3153099103', cargo: 'Mecánico', fechaIngreso: '2014-02-01', salario: 0, neto: 5500000, embargos: false },
  { empresaNit: '900036347-0', identificacion: '1065576754', primerNombre: 'JEISON', segundoNombre: 'FABIÁN', primerApellido: 'MENDOZA', segundoApellido: 'SALAZAR', nombreCompleto: 'JEISON FABIÁN MENDOZA SALAZAR', correo: 'jeison.fabian.mendoza01@gmail.com', telefono: '3151194346', cargo: 'TÉCNICO MANTENIMIENTO', fechaIngreso: '2014-02-01', salario: 0, neto: 5600000, embargos: false },
  { empresaNit: '900036347-0', identificacion: '1007520261', primerNombre: 'Deivis', segundoNombre: 'Duvan', primerApellido: 'Erazo', segundoApellido: 'Diaz', nombreCompleto: 'Deivis Duvan Erazo Diaz', correo: 'Deiviserazod@gmail.com', telefono: '3171841132', cargo: 'Técnico mecánico de llantas 4', fechaIngreso: '2023-09-19', salario: 1900000, neto: 4000000, embargos: false },
  { empresaNit: '900036347-0', identificacion: '72203630', primerNombre: 'Armando', segundoNombre: null, primerApellido: 'Beleño', segundoApellido: 'Bolaño', nombreCompleto: 'Armando Beleño Bolaño', correo: 'armandobb.9@gmail.com', telefono: '3153912163', cargo: 'GERENTE RECURSOS GESTION HUMANOS', fechaIngreso: '2008-12-09', salario: 0, neto: 15500000, embargos: false },
  { empresaNit: '900036347-0', identificacion: '77191463', primerNombre: 'OMAR', segundoNombre: 'HUMBERTO', primerApellido: 'CÉSPEDES', segundoApellido: 'ORTEGON', nombreCompleto: 'OMAR HUMBERTO CÉSPEDES ORTEGON', correo: 'omarcspds.10@gmail.com', telefono: '3204255093', cargo: 'TÉCNICO EN MANTENIMIENTO DE LLANTA', fechaIngreso: '2023-01-10', salario: 0, neto: 2209000, embargos: true },
  { empresaNit: '900036347-0', identificacion: '1065824827', primerNombre: 'OMAR', segundoNombre: 'DAVID', primerApellido: 'HERRERA', segundoApellido: 'FERNANDEZ', nombreCompleto: 'OMAR DAVID HERRERA FERNANDEZ', correo: 'omar_hf@outlook.com', telefono: '3157988445', cargo: 'MECANICO', fechaIngreso: '2020-01-01', salario: 0, neto: 6000000, embargos: false },
  { empresaNit: '900036347-0', identificacion: '1065565202', primerNombre: 'JUAN', segundoNombre: 'GABRIEL', primerApellido: 'CADOZO', segundoApellido: 'CORTINA', nombreCompleto: 'JUAN GABRIEL CADOZO CORTINA', correo: 'jcjuancardozo76@gmail.com', telefono: '3170574713', cargo: 'MECANICO DE LLANTAS 3', fechaIngreso: '2020-02-01', salario: 0, neto: 2367000, embargos: false },
  { empresaNit: '900036347-0', identificacion: '1063293608', primerNombre: 'Andres', segundoNombre: 'Felipe', primerApellido: 'Castilla', segundoApellido: 'Casiani', nombreCompleto: 'Andres Felipe Castilla Casiani', correo: 'Andrescastilla_casiani@hotmail.com', telefono: '3103558449', cargo: 'Técnico Mecánico de llantas', fechaIngreso: '2024-06-04', salario: 3576000, neto: 3576000, embargos: false },
  { empresaNit: '900036347-0', identificacion: '1048206369', primerNombre: 'OSCAR', segundoNombre: 'DANIEL', primerApellido: 'MOLINA', segundoApellido: 'TILANO', nombreCompleto: 'OSCAR DANIEL MOLINA TILANO', correo: 'oscarmolinatilano@hotmail.com', telefono: '3116508002', cargo: 'RTC', fechaIngreso: '2011-07-01', salario: 18000000, neto: 18000000, embargos: false },
  { empresaNit: '900036347-0', identificacion: '1064800654', primerNombre: 'José', segundoNombre: 'Carlos', primerApellido: 'Meneses', segundoApellido: 'Sierra', nombreCompleto: 'José Carlos Meneses Sierra', correo: 'josekarlosmene96@gmail.com', telefono: '3156457270', cargo: 'Tecnico mecanico de llantaa', fechaIngreso: '2020-02-01', salario: 2896200, neto: 5300000, embargos: false },
  { empresaNit: '900036347-0', identificacion: '1082241607', primerNombre: 'SERGIO', segundoNombre: 'LUIS', primerApellido: 'SALCEDO', segundoApellido: 'CABRERA', nombreCompleto: 'SERGIO LUIS SALCEDO CABRERA', correo: 'ssergiosalcedo28@outlook.com.ar', telefono: '3023597670', cargo: 'TÉCNICO', fechaIngreso: '2018-09-17', salario: 0, neto: 4000000, embargos: false },

  // PYS DEL CARIBE S.A.S.
  { empresaNit: '902007965-6', identificacion: '1048327695', primerNombre: 'LORAINE', segundoNombre: 'NATALY', primerApellido: 'SAMPER', segundoApellido: 'ARENILLA', nombreCompleto: 'LORAINE NATALY SAMPER ARENILLA', correo: 'LORAINENATALYSAMPER@GMAIL.COM', telefono: '3009919888', cargo: 'ASISTENTE ADMINISTRATIVO', fechaIngreso: '2025-01-29', salario: 2000000, neto: 2000000, embargos: false },

  // FABRICA DE PRODUCTOS SAYSA S.A.S
  { empresaNit: '800037224-5', identificacion: '72267198', primerNombre: 'JOHN', segundoNombre: 'ROBINSON', primerApellido: 'LOPEZ', segundoApellido: 'RODRIGUEZ', nombreCompleto: 'JOHN ROBINSON LOPEZ RODRIGUEZ', correo: '2282jhon@gmail.com', telefono: '3043431632', cargo: 'MENSAJERO', fechaIngreso: '2020-03-02', salario: 1750905, neto: 2400905, embargos: false },
  { empresaNit: '800037224-5', identificacion: '32793771', primerNombre: 'Shirley', segundoNombre: 'Cecilia', primerApellido: 'Cueto', segundoApellido: 'Borja', nombreCompleto: 'Shirley Cecilia Cueto Borja', correo: 'shicueto@yahoo.es', telefono: '3115695033', cargo: 'Empleada', fechaIngreso: '2020-03-02', salario: 1750905, neto: 1425000, embargos: false },
  { empresaNit: '800037224-5', identificacion: '1004346859', primerNombre: 'Sebastián', segundoNombre: 'Andrés', primerApellido: 'Solar', segundoApellido: 'Nieto', nombreCompleto: 'Sebastián Andrés Solar Nieto', correo: 'sebastiansolarnieto@gmail.com', telefono: '3014842936', cargo: 'Empleado', fechaIngreso: '2024-11-06', salario: 1803500, neto: 1724140, embargos: false },
  { empresaNit: '800037224-5', identificacion: '1001884710', primerNombre: 'Diego', segundoNombre: 'Andres', primerApellido: 'Perez', segundoApellido: 'De La Rosa', nombreCompleto: 'Diego Andres Perez De La Rosa', correo: 'diegogoa449@gmail.com', telefono: '3243392815', cargo: 'Empleado', fechaIngreso: '2024-11-01', salario: 1512000, neto: 1394110, embargos: false },
  { empresaNit: '800037224-5', identificacion: '1129529023', primerNombre: 'Oscar', segundoNombre: 'Miguel', primerApellido: 'Beltran', segundoApellido: 'Orozco', nombreCompleto: 'Oscar Miguel Beltran Orozco', correo: 'beltranoscar2505@gmail.com', telefono: '3004956553', cargo: 'Empleado', fechaIngreso: '2024-11-01', salario: 1423500, neto: 1216872, embargos: false },
  { empresaNit: '800037224-5', identificacion: '1043008694', primerNombre: 'Julio', segundoNombre: 'Cesar', primerApellido: 'De la hoz', segundoApellido: 'Rivera', nombreCompleto: 'Julio Cesar De la hoz Rivera', correo: 'analuciadelahozperez@gmail.cpm', telefono: '3042602734', cargo: 'Empleado', fechaIngreso: '2024-12-24', salario: 1423500, neto: 2847000, embargos: false },
  { empresaNit: '800037224-5', identificacion: '1002025146', primerNombre: 'Romario', segundoNombre: 'Andrés', primerApellido: 'Villalobos', segundoApellido: 'Loaiza', nombreCompleto: 'Romario Andrés Villalobos Loaiza', correo: 'rvillalobosloaiza@gmail.com', telefono: '3244098384', cargo: 'Empleado', fechaIngreso: '2020-10-01', salario: 1750050, neto: 1171092, embargos: false },
  { empresaNit: '800037224-5', identificacion: '1048265322', primerNombre: 'Maribel', segundoNombre: 'Andrea', primerApellido: 'Garcia', segundoApellido: 'Romero', nombreCompleto: 'Maribel Andrea Garcia Romero', correo: 'mariigarcia850@gmail.com', telefono: '3023719014', cargo: 'Empleada', fechaIngreso: '2024-10-17', salario: 1700010, neto: 1365862, embargos: false },
  { empresaNit: '800037224-5', identificacion: '1042351301', primerNombre: 'Wendy', segundoNombre: 'Paola', primerApellido: 'Cervantes', segundoApellido: 'Coronado', nombreCompleto: 'Wendy Paola Cervantes Coronado', correo: 'paolacervantes0710@gmail.com', telefono: '3243087562', cargo: 'Empleada', fechaIngreso: '2022-05-24', salario: 1423500, neto: 1175024, embargos: false },
  { empresaNit: '800037224-5', identificacion: '72329043', primerNombre: 'Dewis', segundoNombre: 'José', primerApellido: 'Noriega', segundoApellido: 'Nuñez', nombreCompleto: 'Dewis José Noriega Nuñez', correo: 'dewisnoriega@hotmail.com', telefono: '3016827351', cargo: 'Empleado', fechaIngreso: '2012-05-01', salario: 1750705, neto: 2347072, embargos: false },
  { empresaNit: '800037224-5', identificacion: '38669485', primerNombre: 'Kelly', segundoNombre: 'Patricia', primerApellido: 'Camacho', segundoApellido: 'Ocoro', nombreCompleto: 'Kelly Patricia Camacho Ocoro', correo: 'nelly_rio@hotmail.com', telefono: '3043877508', cargo: 'Empleada', fechaIngreso: '2024-11-18', salario: 1803500, neto: 1859220, embargos: false },
  { empresaNit: '800037224-5', identificacion: '32854584', primerNombre: 'Yolanda', segundoNombre: 'María', primerApellido: 'Berrio', segundoApellido: 'Berdugo', nombreCompleto: 'Yolanda María Berrio Berdugo', correo: 'yolandamariaberrioberdugo@gmail.com', telefono: '3013078738', cargo: 'Empleada', fechaIngreso: '2020-10-01', salario: 1478010, neto: 896670, embargos: false },
  { empresaNit: '800037224-5', identificacion: '50944725', primerNombre: 'Lorya', segundoNombre: 'Ludit', primerApellido: 'Quintana', segundoApellido: 'Ramos', nombreCompleto: 'Lorya Ludit Quintana Ramos', correo: 'lorya.2013@hotmail.com', telefono: '3103403922', cargo: 'Empleada', fechaIngreso: '2024-12-02', salario: 1423500, neto: 2847000, embargos: false },
  { empresaNit: '800037224-5', identificacion: '1044928172', primerNombre: 'María', segundoNombre: 'Angélica', primerApellido: 'Jimenez', segundoApellido: 'Garcés', nombreCompleto: 'María Angélica Jimenez Garcés', correo: 'maryjiga09@gmail.com', telefono: '3018877486', cargo: 'Empleada', fechaIngreso: '2025-01-07', salario: 1803500, neto: 1874100, embargos: false },
  { empresaNit: '800037224-5', identificacion: '1045736398', primerNombre: 'Juan', segundoNombre: 'Antonio', primerApellido: 'Martínez', segundoApellido: 'Angulo', nombreCompleto: 'Juan Antonio Martínez Angulo', correo: 'Sheilyjuan@hotmail.com', telefono: '3202190981', cargo: 'Empleado', fechaIngreso: '2017-05-05', salario: 1700000, neto: 3400000, embargos: false },
  { empresaNit: '800037224-5', identificacion: '32864584', primerNombre: 'Yolanda', segundoNombre: 'María', primerApellido: 'Berrio', segundoApellido: 'Berdugo', nombreCompleto: 'Yolanda María Berrio Berdugo', correo: 'yolandamariaberrioberdugo2@gmail.com', telefono: '3013078738', cargo: 'Empleada', fechaIngreso: '2020-10-01', salario: 1478010, neto: 896670, embargos: false },
  { empresaNit: '800037224-5', identificacion: '32789525', primerNombre: 'Monica', segundoNombre: 'Patricia', primerApellido: 'Durán', segundoApellido: 'De Moya', nombreCompleto: 'Monica Patricia Durán De Moya', correo: 'mopa7504@gmail.com', telefono: '3187353906', cargo: 'Empleada', fechaIngreso: '1998-08-10', salario: 5694000, neto: 4260528, embargos: false },

  // GRUPO LUX S.A.S.
  { empresaNit: '114088832-3', identificacion: '8722149', primerNombre: 'JORGE', segundoNombre: null, primerApellido: 'MALKUN', segundoApellido: 'ROJAS', nombreCompleto: 'JORGE MALKUN ROJAS', correo: 'jmalkun@hotmail.com', telefono: '3108774590', cargo: 'DIR EJECUTIVO', fechaIngreso: '2000-06-16', salario: 0, neto: 25000000, embargos: false },
  { empresaNit: '114088832-3', identificacion: '72187324', primerNombre: 'HARRY', segundoNombre: 'NO', primerApellido: 'VILLALOBOS', segundoApellido: 'TEJEDA', nombreCompleto: 'HARRY VILLALOBOS TEJEDA', correo: 'harryvil07@gmail.com', telefono: '3023113405', cargo: 'ADMINISTRADOR', fechaIngreso: '2016-03-02', salario: 0, neto: 14600000, embargos: false },
  { empresaNit: '114088832-3', identificacion: '40928799', primerNombre: 'MARIA', segundoNombre: 'JOSE', primerApellido: 'PINZON', segundoApellido: 'BRUGES', nombreCompleto: 'MARIA JOSE PINZON BRUGES', correo: 'maryjose0874@gmail.com', telefono: '3017846048', cargo: 'ANALISTA', fechaIngreso: '2026-06-25', salario: 0, neto: 3000000, embargos: false },
  { empresaNit: '114088832-3', identificacion: '1140842561', primerNombre: 'ALFONSO', segundoNombre: 'ANTONIO', primerApellido: 'SALCEDO', segundoApellido: 'JAAR', nombreCompleto: 'ALFONSO ANTONIO SALCEDO JAAR', correo: 'Salcedojaar@gmail.com', telefono: '3155437751', cargo: 'AUXILIAR', fechaIngreso: '2025-05-27', salario: 1423500, neto: 1400000, embargos: false },
  { empresaNit: '114088832-3', identificacion: '1140885568', primerNombre: 'Maria', segundoNombre: 'Catalina', primerApellido: 'Martinez', segundoApellido: 'Gomez', nombreCompleto: 'Maria Catalina Martinez Gomez', correo: 'catalinamartinez04@hotmail.com', telefono: '3001410178', cargo: 'Empleada', fechaIngreso: '2025-03-03', salario: 5000000, neto: 3000000, embargos: false },
  { empresaNit: '114088832-3', identificacion: '1140844834', primerNombre: 'ESTEBAN', segundoNombre: 'ANDRES', primerApellido: 'PAEZ', segundoApellido: 'CASAIS', nombreCompleto: 'ESTEBAN ANDRES PAEZ CASAISS', correo: 'epaezcasais@gmail.com', telefono: '3006725392', cargo: 'ASESOR JURIDICO', fechaIngreso: '2026-01-08', salario: 0, neto: 5000000, embargos: false },
  { empresaNit: '114088832-3', identificacion: '72173276', primerNombre: 'JAVIER', segundoNombre: 'EDUARDO', primerApellido: 'JANER', segundoApellido: 'GOETHE', nombreCompleto: 'JAVIER EDUARDO JANER GOETHE', correo: 'javierjaner1@gmail.com', telefono: '3016039830', cargo: 'COMERCIAL', fechaIngreso: '2024-09-03', salario: 0, neto: 6000000, embargos: false },
  { empresaNit: '114088832-3', identificacion: '1100694757', primerNombre: 'NELCY', segundoNombre: 'CAROLINA', primerApellido: 'VELILLA', segundoApellido: 'PEREZ', nombreCompleto: 'NELCY CAROLINA VELILLA PEREZ', correo: 'velillanelcy97@gmail.com', telefono: '3235848464', cargo: 'ANALISTA FINANCIERO', fechaIngreso: '2023-01-03', salario: 0, neto: 4000000, embargos: false },
  { empresaNit: '114088832-3', identificacion: '72121924', primerNombre: 'CARLOS', segundoNombre: 'MANUEL', primerApellido: 'HIGGINS', segundoApellido: 'VILLANUEVA', nombreCompleto: 'CARLOS MANUEL HIGGINS VILLANUEVA', correo: 'carloshigginsvillanueva@hotmail.com', telefono: '3245856139', cargo: 'ABOGADO', fechaIngreso: '1997-01-15', salario: 20000000, neto: 20000000, embargos: false },
  { empresaNit: '114088832-3', identificacion: '1042430044', primerNombre: 'Juliet', segundoNombre: 'Paola', primerApellido: 'Carreño', segundoApellido: 'Barraza', nombreCompleto: 'Juliet Paola Carreño Barraza', correo: 'juliethcaba@hotmail.com', telefono: '3127077263', cargo: 'Acoount mánager', fechaIngreso: '2026-02-23', salario: 4000000, neto: 3000000, embargos: false },
  { empresaNit: '114088832-3', identificacion: '1044430447', primerNombre: 'ALEJANDRO', segundoNombre: 'MARIO', primerApellido: 'AHUMADA', segundoApellido: 'TAMARA', nombreCompleto: 'ALEJANDRO MARIO AHUMADA TAMARA', correo: 'alejandroahumadat@gmail.com', telefono: '3022624434', cargo: 'gerente', fechaIngreso: '2024-01-01', salario: 0, neto: 7600000, embargos: false }
];

// ----------------------------------------------------
// 3. DATOS DE LÍNEAS / PRODUCTOS DE CRÉDITO Y DOCUMENTOS
// ----------------------------------------------------
const CREDIT_TYPES_DATA = [
  { consecutivo: '001014', nombre: 'GARANTIA 6', tipoCredito: 'LIBRANZA', montoMaximo: 200000000, salarioMinimo: 1, salarioMaximo: 15, plazoMinimo: 1, plazoMaximo: 6, refinanciacion: true, retanqueo: false, estado: 'ACTIVO',
    atributos: [
      { nombre: 'INTERÉS CORRIENTE', tipoAtributo: 'CUOTA', tipoCalculo: 'PORCENTAJE', valor: 0, porcentaje: 2.13, aplicaIva: false },
      { nombre: 'CORRETAJE GARANTIA SEIS', tipoAtributo: 'CREDITO', tipoCalculo: 'PORCENTAJE', valor: 0, porcentaje: 6.0, aplicaIva: false },
      { nombre: 'FIANZA UNO', tipoAtributo: 'CREDITO', tipoCalculo: 'VALOR FIJO', valor: 0, porcentaje: null, proveedor: 'COOPHUMANA', aplicaIva: true }
    ],
    documentos: [
      { nombre: 'CONTRATO DE CESIÓN DE DERECHOS ECONÓMICOS', grupo: 'CONTRATOS', prioridad: 2 },
      { nombre: 'CONTRATO DE FIANZA COOPHUMANA V1', grupo: 'CONTRATOS', prioridad: 3 },
      { nombre: 'SOLICITUD ÚNICA DE CONOCIMIENTO DE CLIENTE', grupo: 'CONTRATOS', prioridad: 4 },
      { nombre: 'PAGARÉ V1 - 2025', grupo: 'PAGARE', prioridad: 1 }
    ]
  },
  { consecutivo: '001010', nombre: 'LIBRANZA PLUS', tipoCredito: 'LIBRANZA', montoMaximo: 150000000, salarioMinimo: 1, salarioMaximo: 15, plazoMinimo: 1, plazoMaximo: 36, refinanciacion: true, retanqueo: true, estado: 'ACTIVO',
    atributos: [
      { nombre: 'INTERÉS CORRIENTE', tipoAtributo: 'CUOTA', tipoCalculo: 'PORCENTAJE', valor: 0, porcentaje: 2.13, aplicaIva: false },
      { nombre: 'FIANZA DE CREDITOS', tipoAtributo: 'CREDITO', tipoCalculo: 'PORCENTAJE', valor: 0, porcentaje: 1.2, proveedor: 'COOPHUMANA', aplicaIva: true },
      { nombre: 'SEGURO DE VIDA DEUDORES', tipoAtributo: 'CREDITO', tipoCalculo: 'PORCENTAJE', valor: 0, porcentaje: 1.5, proveedor: 'BMI', aplicaIva: false }
    ],
    documentos: [
      { nombre: 'CONTRATO DE MUTUO CON DESCUENTO DIRECTO', grupo: 'CONTRATOS', prioridad: 1 },
      { nombre: 'AUTORIZACION DE DESCUENTO POR NOMINA', grupo: 'CONTRATOS', prioridad: 2 },
      { nombre: 'PAGARE', grupo: 'PAGARE', prioridad: 3 },
      { nombre: 'SEGURO DE VIDA DEUDORES', grupo: 'SEGUROS', prioridad: 4 }
    ]
  },
  { consecutivo: '001013', nombre: 'LI3M', tipoCredito: 'LIBRANZA', montoMaximo: 50000000, salarioMinimo: 1, salarioMaximo: 4, plazoMinimo: 1, plazoMaximo: 3, refinanciacion: false, retanqueo: false, estado: 'ACTIVO',
    atributos: [
      { nombre: 'INTERÉS CORRIENTE', tipoAtributo: 'CUOTA', tipoCalculo: 'PORCENTAJE', valor: 0, porcentaje: 2.13, aplicaIva: false },
      { nombre: 'AFILIACION COOPHUMANA', tipoAtributo: 'CREDITO', tipoCalculo: 'VALOR FIJO', valor: 7000, porcentaje: 0.2, aplicaIva: false },
      { nombre: 'SEGURO DE VIDA DEUDORES', tipoAtributo: 'CREDITO', tipoCalculo: 'VALOR FIJO', valor: 0, porcentaje: null, proveedor: 'SEGURO', aplicaIva: false },
      { nombre: 'FIANZA TRES', tipoAtributo: 'CREDITO', tipoCalculo: 'VALOR FIJO', valor: 0, porcentaje: null, proveedor: 'FIANZA LIBRANZA', aplicaIva: true }
    ],
    documentos: [
      { nombre: 'CONTRATO DE MUTUO CON DESCUENTO DIRECTO', grupo: 'CONTRATOS', prioridad: 1 },
      { nombre: 'CONTRATO DE FIANZA COOPHUMANA V1', grupo: 'CONTRATOS', prioridad: 2 },
      { nombre: 'DECLARACIÓN DE FATCA COOPHUMANA V1', grupo: 'CONTRATOS', prioridad: 3 },
      { nombre: 'SEGURO DE VIDA BMI V1', grupo: 'CONTRATOS', prioridad: 4 }
    ]
  },
  { consecutivo: '001012', nombre: 'GARANTIA REAL', tipoCredito: 'GARANTIA REAL', montoMaximo: 200000000, salarioMinimo: 1, salarioMaximo: 15, plazoMinimo: 1, plazoMaximo: 3, refinanciacion: false, retanqueo: false, estado: 'ACTIVO',
    atributos: [
      { nombre: 'INTERÉS CORRIENTE', tipoAtributo: 'CUOTA', tipoCalculo: 'PORCENTAJE', valor: 0, porcentaje: 2.5, aplicaIva: false },
      { nombre: 'CORRETAJE', tipoAtributo: 'CREDITO', tipoCalculo: 'PORCENTAJE', valor: 0, porcentaje: 3.0, aplicaIva: false }
    ],
    documentos: [
      { nombre: 'CONTRATO DE MUTUO CON DESCUENTO DIRECTO', grupo: 'CONTRATOS', prioridad: 1 },
      { nombre: 'CONTRATO DE FIANZA COOPHUMANA V1', grupo: 'CONTRATOS', prioridad: 2 },
      { nombre: 'DECLARACIÓN DE FATCA COOPHUMANA V1', grupo: 'CONTRATOS', prioridad: 3 },
      { nombre: 'SEGURO DE VIDA BMI V1', grupo: 'CONTRATOS', prioridad: 4 }
    ]
  },
  { consecutivo: '001011', nombre: 'ANTICIPO PRIMAS', tipoCredito: 'ANTICIPO PRIMAS', montoMaximo: 30000000, salarioMinimo: 1, salarioMaximo: 10, plazoMinimo: 1, plazoMaximo: 6, refinanciacion: false, retanqueo: false, estado: 'ACTIVO', atributos: [], documentos: [] },
  { consecutivo: '001009', nombre: 'LIBRANZA', tipoCredito: 'LIBRANZA', montoMaximo: 100000000, salarioMinimo: 1, salarioMaximo: 15, plazoMinimo: 1, plazoMaximo: 60, refinanciacion: true, retanqueo: true, estado: 'ACTIVO', atributos: [], documentos: [] }
];

async function main() {
  console.log('=== POBLAMIENTO COMPLETO DE BASE DE DATOS Y SUPABASE ===');

  const client = new Client({
    host: process.env.PGHOST || '127.0.0.1',
    port: parseInt(process.env.PGPORT || '5432', 10),
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'IHgUXHeoGsWZxCv3ZHzt',
    database: dbName,
  });

  await client.connect();
  console.log(`[✓] Conectado a PostgreSQL local (BD: "${dbName}")`);

  try {
    await client.query('begin');

    // 1. Esquema
    await client.query(`create schema if not exists ${schema}`);

    // 2. Tablas base
    await client.query(`
      create table if not exists ${schema}."TBL_ESTADOS" (
        id_estado serial primary key,
        v_descripcion varchar(80) not null unique
      );

      insert into ${schema}."TBL_ESTADOS" (v_descripcion)
      values ('Activo'), ('Pendiente'), ('Inactivo')
      on conflict (v_descripcion) do nothing;

      create table if not exists ${schema}."TBL_TIP_IDENTIFICACIONES" (
        id_tip_identificacion serial primary key,
        v_sigla_identificacion varchar(20) not null unique,
        v_des_identificacion varchar(100) not null
      );

      insert into ${schema}."TBL_TIP_IDENTIFICACIONES" (v_sigla_identificacion, v_des_identificacion)
      values ('CC', 'CEDULA DE CIUDADANIA'), ('NIT', 'NUMERO DE IDENTIFICACION TRIBUTARIA'), ('CE', 'CEDULA DE EXTRANJERIA')
      on conflict (v_sigla_identificacion) do nothing;

      create table if not exists ${schema}."TBL_EMPRESAS" (
        id_empresa serial primary key,
        v_codigo varchar(40) null,
        v_nit varchar(50) not null unique,
        v_dv varchar(10) null,
        v_razon_social varchar(250) not null,
        num_empleados integer not null default 0,
        val_cupo numeric(18,2) not null default 0,
        val_cupo_saldo numeric(18,2) not null default 0,
        id_estado integer null references ${schema}."TBL_ESTADOS"(id_estado),
        fec_creacion timestamp without time zone not null default now(),
        fec_actualizacion timestamp without time zone null
      );

      create table if not exists ${schema}."TBL_EMPLEADOS_EMPRESA" (
        id_empleado_empresa serial primary key,
        id_empresa integer not null references ${schema}."TBL_EMPRESAS"(id_empresa) on delete cascade,
        v_identificacion varchar(50) not null unique,
        v_primer_nombre varchar(100) not null,
        v_segundo_nombre varchar(100) null,
        v_primer_apellido varchar(100) null,
        v_segundo_apellido varchar(100) null,
        v_nombre_completo varchar(250) not null,
        v_correo varchar(180) null,
        v_telefono varchar(60) null,
        v_cargo varchar(160) null,
        val_salario numeric(18,2) null,
        val_neto numeric(18,2) null,
        fec_ingreso date null,
        ind_tiene_embargos boolean not null default false,
        id_estado integer null references ${schema}."TBL_ESTADOS"(id_estado),
        fec_creacion timestamp without time zone not null default now()
      );

      alter table ${schema}."TBL_EMPLEADOS_EMPRESA"
        add column if not exists val_neto numeric(18,2);

      create table if not exists ${schema}."TBL_TIPOS_CREDITO" (
        id_tipo_credito serial primary key,
        des_tipo_credito varchar(120) not null unique
      );

      create table if not exists ${schema}."TBL_TIPOS_ATRIBUTO_CREDITO" (
        id_tipo_atributo serial primary key,
        des_tipo_atributo varchar(120) not null unique
      );

      insert into ${schema}."TBL_TIPOS_ATRIBUTO_CREDITO" (des_tipo_atributo)
      values ('CUOTA'), ('CREDITO')
      on conflict (des_tipo_atributo) do nothing;

      create table if not exists ${schema}."TBL_TIPOS_CALCULO_CREDITO" (
        id_tipo_calculo serial primary key,
        des_tipo_calculo varchar(120) not null unique
      );

      insert into ${schema}."TBL_TIPOS_CALCULO_CREDITO" (des_tipo_calculo)
      values ('VALOR FIJO'), ('PORCENTAJE')
      on conflict (des_tipo_calculo) do nothing;

      create table if not exists ${schema}."TBL_DOCUMENTOS_CREDITO" (
        id_documento_credito serial primary key,
        des_documento varchar(180) not null unique,
        grupo varchar(80) null
      );

      create table if not exists ${schema}."TBL_PRODUCTOS_CREDITO" (
        id_producto_credito serial primary key,
        consecutivo varchar(40) not null unique,
        nombre varchar(180) not null,
        id_tipo_credito integer null references ${schema}."TBL_TIPOS_CREDITO"(id_tipo_credito),
        monto_maximo numeric(18,2) null,
        salario_minimo numeric(18,2) null,
        salario_maximo numeric(18,2) null,
        plazo_minimo integer null,
        plazo_maximo integer null,
        permite_refinanciacion boolean default false,
        permite_retanqueo boolean default false,
        id_estado integer null references ${schema}."TBL_ESTADOS"(id_estado),
        fec_creacion timestamp without time zone not null default now()
      );

      create table if not exists ${schema}."TBL_PRODUCTO_CREDITO_ATRIBUTOS" (
        id_producto_atributo serial primary key,
        id_producto_credito integer not null references ${schema}."TBL_PRODUCTOS_CREDITO"(id_producto_credito) on delete cascade,
        id_tipo_atributo integer references ${schema}."TBL_TIPOS_ATRIBUTO_CREDITO"(id_tipo_atributo),
        id_tipo_calculo integer references ${schema}."TBL_TIPOS_CALCULO_CREDITO"(id_tipo_calculo),
        nombre varchar(180) not null,
        valor numeric(18,2) null,
        porcentaje numeric(10,4) null,
        proveedor varchar(120) null,
        aplica_iva boolean default false
      );

      create table if not exists ${schema}."TBL_PRODUCTO_CREDITO_DOCUMENTOS" (
        id_producto_documento serial primary key,
        id_producto_credito integer not null references ${schema}."TBL_PRODUCTOS_CREDITO"(id_producto_credito) on delete cascade,
        id_documento_credito integer not null references ${schema}."TBL_DOCUMENTOS_CREDITO"(id_documento_credito),
        grupo varchar(80) null,
        prioridad integer default 1
      );
    `);

    // 3. Mapeo de estados
    const estadosRes = await client.query(`select id_estado, lower(v_descripcion) as des from ${schema}."TBL_ESTADOS"`);
    const estadoMap = {};
    for (const row of estadosRes.rows) estadoMap[row.des] = row.id_estado;

    // 4. Registro/Insert Pagadurías
    console.log('[+] Insertando 8 Pagadurías...');
    const empresaMap = {};
    for (const item of PAGADURIAS_DATA) {
      const estadoId = estadoMap[item.estado.toLowerCase()] || estadoMap['activo'];
      const res = await client.query(`
        insert into ${schema}."TBL_EMPRESAS" (v_codigo, v_nit, v_dv, v_razon_social, num_empleados, val_cupo, val_cupo_saldo, id_estado)
        values ($1, $2, $3, $4, $5, $6, $7, $8)
        on conflict (v_nit) do update set
          v_codigo = EXCLUDED.v_codigo,
          v_razon_social = EXCLUDED.v_razon_social,
          num_empleados = EXCLUDED.num_empleados,
          id_estado = EXCLUDED.id_estado
        returning id_empresa, v_nit
      `, [item.codigo, item.nit, item.dv, item.razonSocial, item.empleados, item.cupo, item.cupoSaldo, estadoId]);

      empresaMap[item.nit] = res.rows[0].id_empresa;
    }
    console.log('[✓] 8 Pagadurías registradas.');

    // 5. Registro/Insert Empleados
    console.log('[+] Insertando 45 Empleados asociados a sus respectivas Pagadurías...');
    let totalEmp = 0;
    for (const emp of EMPLEADOS_PAYROLL_DATA) {
      const empresaId = empresaMap[emp.empresaNit];
      if (!empresaId) continue;

      const estadoId = estadoMap['activo'];
      await client.query(`
        insert into ${schema}."TBL_EMPLEADOS_EMPRESA" (
          id_empresa, v_identificacion, v_primer_nombre, v_segundo_nombre, v_primer_apellido, v_segundo_apellido,
          v_nombre_completo, v_correo, v_telefono, v_cargo, val_salario, val_neto, fec_ingreso, ind_tiene_embargos, id_estado
        )
        values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        on conflict (v_identificacion) do update set
          id_empresa = EXCLUDED.id_empresa,
          v_nombre_completo = EXCLUDED.v_nombre_completo,
          v_correo = EXCLUDED.v_correo,
          v_telefono = EXCLUDED.v_telefono,
          v_cargo = EXCLUDED.v_cargo,
          val_salario = EXCLUDED.val_salario,
          val_neto = EXCLUDED.val_neto,
          ind_tiene_embargos = EXCLUDED.ind_tiene_embargos
      `, [empresaId, emp.identificacion, emp.primerNombre, emp.segundoNombre, emp.primerApellido, emp.segundoApellido, emp.nombreCompleto, emp.correo, emp.telefono, emp.cargo, emp.salario, emp.neto, emp.fechaIngreso, emp.embargos, estadoId]);
      totalEmp++;
    }
    console.log(`[✓] ${totalEmp} Empleados registrados.`);

    // 6. Registro Líneas de Crédito
    console.log('[+] Insertando Líneas de Crédito y Atributos/Documentos...');
    for (const cred of CREDIT_TYPES_DATA) {
      const tipoCredRes = await client.query(`
        insert into ${schema}."TBL_TIPOS_CREDITO" (des_tipo_credito)
        values ($1) on conflict (des_tipo_credito) do update set des_tipo_credito = EXCLUDED.des_tipo_credito
        returning id_tipo_credito
      `, [cred.tipoCredito]);
      const tipoCreditoId = tipoCredRes.rows[0].id_tipo_credito;

      const estadoId = estadoMap[cred.estado.toLowerCase()] || estadoMap['activo'];
      const prodRes = await client.query(`
        insert into ${schema}."TBL_PRODUCTOS_CREDITO" (
          consecutivo, nombre, id_tipo_credito, monto_maximo, salario_minimo, salario_maximo,
          plazo_minimo, plazo_maximo, permite_refinanciacion, permite_retanqueo, id_estado
        )
        values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        on conflict (consecutivo) do update set
          nombre = EXCLUDED.nombre,
          monto_maximo = EXCLUDED.monto_maximo,
          plazo_maximo = EXCLUDED.plazo_maximo
        returning id_producto_credito
      `, [cred.consecutivo, cred.nombre, tipoCreditoId, cred.montoMaximo, cred.salarioMinimo, cred.salarioMaximo, cred.plazoMinimo, cred.plazoMaximo, cred.refinanciacion, cred.retanqueo, estadoId]);

      const productoId = prodRes.rows[0].id_producto_credito;

      // Atributos
      for (const attr of cred.atributos) {
        const tipoAttrRes = await client.query(`select id_tipo_atributo from ${schema}."TBL_TIPOS_ATRIBUTO_CREDITO" where des_tipo_atributo = $1 limit 1`, [attr.tipoAtributo]);
        const tipoCalcRes = await client.query(`select id_tipo_calculo from ${schema}."TBL_TIPOS_CALCULO_CREDITO" where des_tipo_calculo = $1 limit 1`, [attr.tipoCalculo]);

        await client.query(`
          insert into ${schema}."TBL_PRODUCTO_CREDITO_ATRIBUTOS" (
            id_producto_credito, id_tipo_atributo, id_tipo_calculo, nombre, valor, porcentaje, proveedor, aplica_iva
          ) values ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [productoId, tipoAttrRes.rows[0]?.id_tipo_atributo, tipoCalcRes.rows[0]?.id_tipo_calculo, attr.nombre, attr.valor, attr.porcentaje, attr.proveedor || null, attr.aplicaIva]);
      }

      // Documentos
      for (const doc of cred.documentos) {
        const docRes = await client.query(`
          insert into ${schema}."TBL_DOCUMENTOS_CREDITO" (des_documento, grupo)
          values ($1, $2) on conflict (des_documento) do update set grupo = EXCLUDED.grupo
          returning id_documento_credito
        `, [doc.nombre, doc.grupo]);

        await client.query(`
          insert into ${schema}."TBL_PRODUCTO_CREDITO_DOCUMENTOS" (
            id_producto_credito, id_documento_credito, grupo, prioridad
          ) values ($1, $2, $3, $4)
        `, [productoId, docRes.rows[0].id_documento_credito, doc.grupo, doc.prioridad]);
      }
    }
    console.log('[✓] Líneas de crédito registradas.');

    await client.query('commit');
    console.log('=== POBLAMIENTO POSTGRES EXITOSO ===');

  } catch (error) {
    await client.query('rollback');
    console.error('[-] Error en poblamiento local:', error);
  } finally {
    await client.end();
  }

  // ----------------------------------------------------
  // 7. CONFIGURACIÓN E INFORMACIÓN DE SUPABASE
  // ----------------------------------------------------
  console.log('\n--- CREDANCIALES Y CONEXIÓN SUPABASE ---');
  console.log(`URL Supabase: ${SUPABASE_URL}`);
  console.log(`Anon Key: ${SUPABASE_ANON_KEY.substring(0, 30)}...`);

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  console.log('[i] Cliente Supabase instanciado y listo para sincronizar peticiones.');
}

main().catch(console.error);
