const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const [key, ...valueParts] = trimmed.split('=');
    process.env[key.trim()] ??= valueParts.join('=').trim().replace(/^["']|["']$/g, '');
  }
}

const schema = '"Creditos"';

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    await client.query('begin');

    await client.query(`
      create table if not exists ${schema}."TBL_CREDITOS" (
        id_credito serial primary key,
        consecutivo varchar(40) not null unique,
        id_producto_credito integer not null references ${schema}."TBL_PRODUCTOS_CREDITO"(id_producto_credito),
        id_libranzera integer null references ${schema}."TBL_LIBRANZERAS"(id_libranzera),
        id_empresa integer null references ${schema}."TBL_EMPRESAS"(id_empresa),
        id_empleado_empresa integer null references ${schema}."TBL_EMPLEADOS_EMPRESA"(id_empleado_empresa),
        id_comercial integer null references ${schema}."TBL_COMERCIALES"(id_comercial),
        v_identificacion_cliente varchar(50) not null,
        v_nombre_cliente varchar(250) not null,
        v_correo_cliente varchar(180) null,
        v_telefono_cliente varchar(60) null,
        val_monto_solicitado numeric(18,2) not null,
        num_plazo integer not null,
        tipo_tasa varchar(40) null,
        val_tasa numeric(10,4) null,
        val_cuota_estimada numeric(18,2) null,
        id_estado integer null references ${schema}."TBL_ESTADOS"(id_estado),
        fec_radicacion timestamp without time zone not null default now(),
        fec_creacion timestamp without time zone not null default now(),
        fec_actualizacion timestamp without time zone null
      )
    `);

    await client.query(`
      create table if not exists ${schema}."TBL_CREDITO_DOCUMENTOS" (
        id_credito_documento serial primary key,
        id_credito integer not null references ${schema}."TBL_CREDITOS"(id_credito) on delete cascade,
        id_documento_credito integer not null references ${schema}."TBL_DOCUMENTOS_CREDITO"(id_documento_credito),
        obligatorio boolean not null default true,
        aplica_a varchar(80) not null default 'CLIENTE',
        prioridad integer not null default 1,
        requiere_firma boolean not null default false,
        requiere_validacion boolean not null default false,
        estado_documento varchar(40) not null default 'PENDIENTE',
        v_archivo_url text null,
        fec_creacion timestamp without time zone not null default now(),
        fec_actualizacion timestamp without time zone null
      )
    `);

    await client.query(`
      create table if not exists ${schema}."TBL_CREDITO_ETAPAS" (
        id_credito_etapa serial primary key,
        id_credito integer not null references ${schema}."TBL_CREDITOS"(id_credito) on delete cascade,
        id_etapa_credito integer not null references ${schema}."TBL_ETAPAS_CREDITO"(id_etapa_credito),
        orden integer not null default 1,
        obligatoria boolean not null default true,
        permite_devolucion boolean not null default true,
        responsable varchar(160) null,
        sla_horas integer null,
        estado_etapa varchar(40) not null default 'PENDIENTE',
        fec_inicio timestamp without time zone null,
        fec_fin timestamp without time zone null,
        fec_creacion timestamp without time zone not null default now(),
        fec_actualizacion timestamp without time zone null
      )
    `);

    await client.query(`
      create table if not exists ${schema}."TBL_CREDITO_LIQUIDACION" (
        id_credito_liquidacion serial primary key,
        id_credito integer not null references ${schema}."TBL_CREDITOS"(id_credito) on delete cascade,
        id_producto_atributo integer null references ${schema}."TBL_PRODUCTO_CREDITO_ATRIBUTOS"(id_producto_atributo),
        nombre varchar(180) not null,
        tipo_atributo varchar(120) null,
        tipo_calculo varchar(120) null,
        valor numeric(18,2) null,
        porcentaje numeric(10,4) null,
        valor_calculado numeric(18,2) null,
        aplica_iva boolean not null default false,
        fec_creacion timestamp without time zone not null default now()
      )
    `);

    await client.query(`
      insert into ${schema}."TBL_PERMISOS" (v_nom_permiso, v_desc_rol, fec_creacion)
      select value, description, now()
      from (values
        ('creditos:read', 'Consultar solicitudes de credito'),
        ('creditos:create', 'Crear solicitudes de credito')
      ) as permissions(value, description)
      where not exists (
        select 1 from ${schema}."TBL_PERMISOS" p where p.v_nom_permiso = permissions.value
      )
    `);

    await client.query(`
      with modulo as (
        select id_modulo from ${schema}."TBL_MODULOS" where upper(v_nom_modulo) = 'CREDITOS' limit 1
      )
      insert into ${schema}."TBL_SUB_MODULOS" (v_nom_sub_modulo, v_desc_modulo, v_link_submodulo, id_modulo)
      select 'Solicitudes', 'Radicacion y seguimiento de creditos', '/creditos/solicitudes', modulo.id_modulo
      from modulo
      where not exists (
        select 1 from ${schema}."TBL_SUB_MODULOS" s
        where s.id_modulo = modulo.id_modulo and upper(s.v_nom_sub_modulo) = 'SOLICITUDES'
      )
    `);

    await client.query(`
      with admin_role as (
        select id_rol from ${schema}."TBL_ROLES" where upper(v_nom_rol) in ('ADMIN', 'ADMINISTRADOR') order by id_rol limit 1
      ), submodule as (
        select s.id_sub_modulo, s.v_nom_sub_modulo
        from ${schema}."TBL_SUB_MODULOS" s
        inner join ${schema}."TBL_MODULOS" m on m.id_modulo = s.id_modulo
        where upper(m.v_nom_modulo) = 'CREDITOS' and upper(s.v_nom_sub_modulo) = 'SOLICITUDES'
        limit 1
      ), active_state as (
        select id_estado from ${schema}."TBL_ESTADOS" where lower(v_descripcion) = 'activo' limit 1
      ), permissions as (
        select id_permiso from ${schema}."TBL_PERMISOS" where v_nom_permiso in ('creditos:read', 'creditos:create')
      )
      insert into ${schema}."TBL_ROL_SUBMODULO_PERMISO" (v_nom_submodulo, id_rol, id_sub_modulo, id_estado, id_permiso)
      select submodule.v_nom_sub_modulo, admin_role.id_rol, submodule.id_sub_modulo, active_state.id_estado, permissions.id_permiso
      from admin_role, submodule, active_state, permissions
      where not exists (
        select 1 from ${schema}."TBL_ROL_SUBMODULO_PERMISO" rsp
        where rsp.id_rol = admin_role.id_rol
          and rsp.id_sub_modulo = submodule.id_sub_modulo
          and rsp.id_permiso = permissions.id_permiso
      )
    `);

    await client.query('commit');
    console.log('Radicacion de creditos lista');
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
