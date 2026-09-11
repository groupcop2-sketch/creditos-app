const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Cargar variables de entorno desde .env
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const [key, ...valueParts] = trimmed.split('=');
    process.env[key.trim()] ??= valueParts.join('=').trim().replace(/^["']|["']$/g, '');
  }
}

const dbName = process.env.PGDATABASE || 'P&S';
const schema = '"Creditos"';

async function ensureDatabaseExists() {
  const adminClient = new Client({
    host: process.env.PGHOST || '127.0.0.1',
    port: parseInt(process.env.PGPORT || '5432', 10),
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'IHgUXHeoGsWZxCv3ZHzt',
    database: 'postgres',
  });

  await adminClient.connect();
  const res = await adminClient.query('select 1 from pg_database where datname = $1', [dbName]);
  if (res.rowCount === 0) {
    console.log(`[+] Creando base de datos "${dbName}"...`);
    await adminClient.query(`CREATE DATABASE "${dbName.replace(/"/g, '""')}"`);
    console.log(`[✓] Base de datos "${dbName}" creada con éxito.`);
  } else {
    console.log(`[i] La base de datos "${dbName}" ya existe.`);
  }
  await adminClient.end();
}

function getAppClient() {
  return new Client({
    host: process.env.PGHOST || '127.0.0.1',
    port: parseInt(process.env.PGPORT || '5432', 10),
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'IHgUXHeoGsWZxCv3ZHzt',
    database: dbName,
  });
}

const PAGADURIAS_EXCEL_DATA = [
  { codigo: '5653', nit: '900036347', dv: '0', razonSocial: 'KAL TIRE S.A. DE C.V. SUCURSAL COLOMBIA', empleados: 16, cupo: 0, cupoSaldo: 0, estado: 'ACTIVO' },
  { codigo: '2660', nit: '902007965', dv: '6', razonSocial: 'PYS DEL CARIBE S.A.S.', empleados: 1, cupo: 0, cupoSaldo: 0, estado: 'ACTIVO' },
  { codigo: '7902', nit: '800037224', dv: '5', razonSocial: 'FABRICA DE PRODUCTOS SAYSA S.A.S', empleados: 17, cupo: 0, cupoSaldo: 0, estado: 'ACTIVO' },
  { codigo: '8017', nit: '114088832', dv: '3', razonSocial: 'GRUPO LUX S.A.S.', empleados: 11, cupo: 0, cupoSaldo: 0, estado: 'ACTIVO' },
  { codigo: '8596', nit: '114088830', dv: '9', razonSocial: 'MT CAPITAL S.A.S.', empleados: 3, cupo: 0, cupoSaldo: 0, estado: 'ACTIVO' },
  { codigo: '7781', nit: '901898386', dv: '1', razonSocial: 'P&S SOLUCIONES FINANCIERAS SAS', empleados: 3, cupo: 0, cupoSaldo: 0, estado: 'PENDIENTE' },
  { codigo: '3611', nit: '900955875', dv: '0', razonSocial: 'DISTRICUR S.A.S.', empleados: 4, cupo: 0, cupoSaldo: 0, estado: 'ACTIVO' },
  { codigo: '7463', nit: '800114382', dv: '0', razonSocial: 'HOLLOU SCHARAER S.A.S.', empleados: 1, cupo: 0, cupoSaldo: 0, estado: 'ACTIVO' }
];

async function main() {
  console.log('=== CREACIÓN Y ARMADO DE BASE DE DATOS Y REGISTRO DE PAGADURÍAS ===');
  await ensureDatabaseExists();

  const client = getAppClient();
  await client.connect();

  try {
    await client.query('begin');

    // 1. Crear esquema
    await client.query(`create schema if not exists ${schema}`);

    // 2. Crear tablas de seguridad y catálogos base
    await client.query(`
      create table if not exists ${schema}."TBL_ESTADOS" (
        id_estado serial primary key,
        v_descripcion varchar(80) not null unique
      );

      insert into ${schema}."TBL_ESTADOS" (v_descripcion)
      values ('Activo'), ('Pendiente'), ('Inactivo')
      on conflict (v_descripcion) do nothing;

      create table if not exists ${schema}."TBL_ROLES" (
        id_rol serial primary key,
        v_nom_rol varchar(80) not null unique,
        v_desc_rol text null
      );

      insert into ${schema}."TBL_ROLES" (v_nom_rol, v_desc_rol)
      values ('ADMIN', 'Administrador General')
      on conflict (v_nom_rol) do nothing;

      create table if not exists ${schema}."TBL_PERMISOS" (
        id_permiso serial primary key,
        v_nom_permiso varchar(120) not null unique,
        v_desc_rol text null,
        fec_creacion timestamp without time zone default now()
      );

      create table if not exists ${schema}."TBL_MODULOS" (
        id_modulo serial primary key,
        v_nom_modulo varchar(120) not null unique,
        v_desc_modulo text null
      );

      insert into ${schema}."TBL_MODULOS" (v_nom_modulo, v_desc_modulo)
      values ('CREDITOS', 'Modulo de Solicitudes y Cartera de Creditos')
      on conflict (v_nom_modulo) do nothing;

      create table if not exists ${schema}."TBL_SUB_MODULOS" (
        id_sub_modulo serial primary key,
        v_nom_sub_modulo varchar(120) not null,
        v_desc_modulo text null,
        v_link_submodulo varchar(250) null,
        id_modulo integer references ${schema}."TBL_MODULOS"(id_modulo)
      );

      create table if not exists ${schema}."TBL_ROL_SUBMODULO_PERMISO" (
        id_rol_submodulo_permiso serial primary key,
        v_nom_submodulo varchar(120) null,
        id_rol integer references ${schema}."TBL_ROLES"(id_rol),
        id_sub_modulo integer references ${schema}."TBL_SUB_MODULOS"(id_sub_modulo),
        id_estado integer references ${schema}."TBL_ESTADOS"(id_estado),
        id_permiso integer references ${schema}."TBL_PERMISOS"(id_permiso)
      );

      create table if not exists ${schema}."TBL_TIP_IDENTIFICACIONES" (
        id_tip_identificacion serial primary key,
        v_sigla_identificacion varchar(20) not null unique,
        v_des_identificacion varchar(100) not null,
        v_cod_dane varchar(20) null
      );

      create table if not exists ${schema}."TBL_BANCOS" (
        id_banco serial primary key,
        des_banco varchar(120) not null unique
      );

      create table if not exists ${schema}."TBL_TIPO_CUENTAS" (
        id_tipo_cuenta serial primary key,
        des_tipo_cuenta varchar(80) not null unique
      );

      create table if not exists ${schema}."TBL_TIPO_CONTRATO" (
        id_tipo_contrato serial primary key,
        des_tipo_contrato varchar(100) not null unique
      );

      create table if not exists ${schema}."TBL_ESTADO_CIVIL" (
        id_estado_civil serial primary key,
        des_estado_civil varchar(60) not null unique
      );

      create table if not exists ${schema}."TBL_TIPO_VIVIENDA" (
        id_tipo_vivienda serial primary key,
        des_tipo_vivienda varchar(60) not null unique
      );

      create table if not exists ${schema}."TBL_ROLES_VENDEDOR" (
        id_rol_vendedor serial primary key,
        des_rol_vendedor varchar(100) not null unique
      );

      create table if not exists ${schema}."TBL_FORMULAS_COMERCIAL" (
        id_formula_comercial serial primary key,
        des_formula varchar(120) not null unique,
        val_porcentaje numeric(10,4) null
      );

      create table if not exists ${schema}."TBL_CIUDADES" (
        id_ciudad serial primary key,
        v_nom_ciudad varchar(120) not null unique,
        v_cod_dane varchar(20) null
      );

      create table if not exists ${schema}."TBL_TIPOS_CREDITO" (
        id_tipo_credito serial primary key,
        des_tipo_credito varchar(120) not null unique
      );

      create table if not exists ${schema}."TBL_TIPOS_ATRIBUTO_CREDITO" (
        id_tipo_atributo serial primary key,
        des_tipo_atributo varchar(120) not null unique
      );

      create table if not exists ${schema}."TBL_TIPOS_CALCULO_CREDITO" (
        id_tipo_calculo serial primary key,
        des_tipo_calculo varchar(120) not null unique
      );

      create table if not exists ${schema}."TBL_DOCUMENTOS_CREDITO" (
        id_documento_credito serial primary key,
        des_documento varchar(180) not null unique,
        grupo varchar(80) null
      );

      create table if not exists ${schema}."TBL_ETAPAS_CREDITO" (
        id_etapa_credito serial primary key,
        des_etapa varchar(120) not null unique
      );
    `);

    // 3. Tablas principales de Libranzas y Empresas
    await client.query(`
      create table if not exists ${schema}."TBL_LIBRANZERAS" (
        id_libranzera serial primary key,
        v_nit varchar(50) not null unique,
        v_razon_social varchar(250) not null,
        v_domicilio text null,
        v_sitio_web varchar(250) null,
        v_correo varchar(180) null,
        v_telefono varchar(60) null,
        camara_numero varchar(60) null,
        camara_libro varchar(60) null,
        camara_id_ciudad integer null references ${schema}."TBL_CIUDADES"(id_ciudad),
        fec_constitucion date null,
        v_ciiu varchar(40) null,
        v_runeol varchar(60) null,
        rl_id_tip_identificacion integer null references ${schema}."TBL_TIP_IDENTIFICACIONES"(id_tip_identificacion),
        rl_identificacion varchar(50) null,
        rl_nombre varchar(200) null,
        rl_genero varchar(40) null,
        rl_id_ciudad integer null references ${schema}."TBL_CIUDADES"(id_ciudad),
        rc_id_tip_identificacion integer null references ${schema}."TBL_TIP_IDENTIFICACIONES"(id_tip_identificacion),
        rc_identificacion varchar(50) null,
        rc_nombre varchar(200) null,
        rc_genero varchar(40) null,
        rc_id_ciudad integer null references ${schema}."TBL_CIUDADES"(id_ciudad),
        rc_telefono varchar(60) null,
        rc_correo varchar(180) null,
        id_estado integer null references ${schema}."TBL_ESTADOS"(id_estado),
        fec_creacion timestamp without time zone not null default now()
      );

      create table if not exists ${schema}."TBL_LIBRANZERA_CUENTAS" (
        id_libranzera_cuenta serial primary key,
        id_libranzera integer not null references ${schema}."TBL_LIBRANZERAS"(id_libranzera) on delete cascade,
        id_banco integer not null references ${schema}."TBL_BANCOS"(id_banco),
        id_tipo_cuenta integer not null references ${schema}."TBL_TIPO_CUENTAS"(id_tipo_cuenta),
        v_num_cuenta varchar(60) not null,
        es_principal boolean not null default true
      );

      create table if not exists ${schema}."TBL_EMPRESAS" (
        id_empresa serial primary key,
        v_codigo varchar(40) null,
        v_nit varchar(50) not null unique,
        v_dv varchar(10) null,
        v_razon_social varchar(250) not null,
        v_vendedor varchar(160) null,
        v_domicilio text null,
        v_correo varchar(180) null,
        v_telefono varchar(60) null,
        v_representante_legal varchar(200) null,
        v_telefono_representante varchar(60) null,
        v_tipo_identificacion_representante varchar(60) null,
        v_identificacion_representante varchar(50) null,
        v_correo_representante varchar(180) null,
        v_contacto_cargo varchar(160) null,
        v_contacto_nombre varchar(200) null,
        v_contacto_correo varchar(180) null,
        v_contacto_telefono varchar(60) null,
        fec_constitucion date null,
        val_capital_sociedad numeric(18,2) null,
        v_naturaleza varchar(80) null,
        v_camara_numero varchar(60) null,
        v_camara_libro varchar(60) null,
        v_camara_ciudad varchar(120) null,
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
        id_tip_identificacion integer null references ${schema}."TBL_TIP_IDENTIFICACIONES"(id_tip_identificacion),
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
        fec_ingreso date null,
        id_estado integer null references ${schema}."TBL_ESTADOS"(id_estado),
        id_tipo_contrato integer null references ${schema}."TBL_TIPO_CONTRATO"(id_tipo_contrato),
        id_banco integer null references ${schema}."TBL_BANCOS"(id_banco),
        id_tipo_cuenta integer null references ${schema}."TBL_TIPO_CUENTAS"(id_tipo_cuenta),
        v_cuenta_nomina varchar(60) null,
        ind_tiene_embargos boolean not null default false,
        id_estado_civil integer null references ${schema}."TBL_ESTADO_CIVIL"(id_estado_civil),
        num_personas_cargo integer not null default 0,
        id_tipo_vivienda integer null references ${schema}."TBL_TIPO_VIVIENDA"(id_tipo_vivienda),
        fec_creacion timestamp without time zone not null default now()
      );

      create table if not exists ${schema}."TBL_COMERCIALES" (
        id_comercial serial primary key,
        id_libranzera integer null references ${schema}."TBL_LIBRANZERAS"(id_libranzera),
        v_identificacion varchar(50) not null unique,
        v_primer_nombre varchar(100) not null,
        v_seg_nombre varchar(100) null,
        v_primer_apell varchar(100) null,
        v_seg_apell varchar(100) null,
        v_nombre_completo varchar(250) not null,
        fec_nacimiento date null,
        v_telefono varchar(60) null,
        v_correo varchar(180) null,
        v_codigo_vendedor varchar(40) null unique,
        id_tip_identificacion integer null references ${schema}."TBL_TIP_IDENTIFICACIONES"(id_tip_identificacion),
        id_rol_vendedor integer null references ${schema}."TBL_ROLES_VENDEDOR"(id_rol_vendedor),
        id_formula_comercial integer null references ${schema}."TBL_FORMULAS_COMERCIAL"(id_formula_comercial),
        v_direccion text null,
        id_ciudad integer null references ${schema}."TBL_CIUDADES"(id_ciudad),
        id_banco integer null references ${schema}."TBL_BANCOS"(id_banco),
        id_tipo_cuenta integer null references ${schema}."TBL_TIPO_CUENTAS"(id_tipo_cuenta),
        v_num_cuenta varchar(60) null,
        id_estado integer null references ${schema}."TBL_ESTADOS"(id_estado),
        fec_creacion timestamp without time zone not null default now()
      );

      create table if not exists ${schema}."TBL_PRODUCTOS_CREDITO" (
        id_producto_credito serial primary key,
        consecutivo varchar(40) not null unique,
        nombre varchar(180) not null,
        descripcion text null,
        id_tipo_credito integer null references ${schema}."TBL_TIPOS_CREDITO"(id_tipo_credito),
        tipo_tasa varchar(40) null,
        id_libranzera integer null references ${schema}."TBL_LIBRANZERAS"(id_libranzera),
        monto_minimo numeric(18,2) null,
        monto_maximo numeric(18,2) null,
        salario_minimo numeric(18,2) null,
        salario_maximo numeric(18,2) null,
        plazo_minimo integer null,
        plazo_maximo integer null,
        modelo_plazo varchar(40) null,
        permite_credito_multiple boolean default true,
        interes_ajustable boolean default false,
        permite_refinanciacion boolean default false,
        permite_retanqueo boolean default false,
        requiere_codeudor boolean default false,
        numero_codeudores integer default 0,
        formato_credito varchar(40) null,
        formato_requisitos varchar(40) null,
        formato_codeudores varchar(40) null,
        proveedor_firma varchar(80) null,
        periodo_gracia integer default 0,
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
        minimo numeric(18,2) null,
        maximo numeric(18,2) null,
        aplica_iva boolean default false,
        obligatorio boolean default true,
        proveedor varchar(120) null,
        prioridad integer default 1
      );

      create table if not exists ${schema}."TBL_PRODUCTO_CREDITO_DOCUMENTOS" (
        id_producto_documento serial primary key,
        id_producto_credito integer not null references ${schema}."TBL_PRODUCTOS_CREDITO"(id_producto_credito) on delete cascade,
        id_documento_credito integer not null references ${schema}."TBL_DOCUMENTOS_CREDITO"(id_documento_credito),
        obligatorio boolean default true,
        grupo varchar(80) null,
        prioridad integer default 1,
        aplica_a varchar(80) default 'CLIENTE',
        requiere_firma boolean default false,
        requiere_validacion boolean default false
      );

      create table if not exists ${schema}."TBL_PRODUCTO_CREDITO_ETAPAS" (
        id_producto_etapa serial primary key,
        id_producto_credito integer not null references ${schema}."TBL_PRODUCTOS_CREDITO"(id_producto_credito) on delete cascade,
        id_etapa_credito integer not null references ${schema}."TBL_ETAPAS_CREDITO"(id_etapa_credito),
        orden integer default 1,
        obligatoria boolean default true,
        permite_devolucion boolean default true,
        responsable varchar(160) null,
        sla_horas integer null
      );
    `);

    // 4. Mapear estado
    const estadosRes = await client.query(`select id_estado, lower(v_descripcion) as des from ${schema}."TBL_ESTADOS"`);
    const estadoMap = {};
    for (const row of estadosRes.rows) {
      estadoMap[row.des] = row.id_estado;
    }

    // 5. Insertar / Registrar Pagadurías del Excel
    console.log('[+] Registrando e insertando las 8 Pagadurías de la lista Excel...');
    for (const item of PAGADURIAS_EXCEL_DATA) {
      const fullNit = item.dv ? `${item.nit}-${item.dv}` : item.nit;
      const estadoId = estadoMap[item.estado.toLowerCase()] || estadoMap['activo'];

      await client.query(`
        insert into ${schema}."TBL_EMPRESAS" (
          v_codigo, v_nit, v_dv, v_razon_social, num_empleados, val_cupo, val_cupo_saldo, id_estado
        )
        values ($1, $2, $3, $4, $5, $6, $7, $8)
        on conflict (v_nit) do update set
          v_codigo = EXCLUDED.v_codigo,
          v_dv = EXCLUDED.v_dv,
          v_razon_social = EXCLUDED.v_razon_social,
          num_empleados = EXCLUDED.num_empleados,
          val_cupo = EXCLUDED.val_cupo,
          val_cupo_saldo = EXCLUDED.val_cupo_saldo,
          id_estado = EXCLUDED.id_estado,
          fec_actualizacion = now()
      `, [item.codigo, fullNit, item.dv, item.razonSocial, item.empleados, item.cupo, item.cupoSaldo, estadoId]);

      console.log(`    [✓] Pagaduría: [${item.codigo}] ${item.razonSocial} (NIT: ${fullNit}) -> Estado: ${item.estado}`);
    }

    await client.query('commit');
    console.log('=== ESTRUCTURA DE BASE DE DATOS Y PAGADURÍAS LISTAS ===');
  } catch (error) {
    await client.query('rollback');
    console.error('[-] Error en la creación de tablas o inserción:', error);
    throw error;
  } finally {
    await client.end();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
