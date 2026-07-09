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

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    await client.query('begin');

    await client.query(`
      create table if not exists "Creditos"."TBL_CLIENTES_PORTAL" (
        id_cliente_portal serial primary key,
        id_empresa integer not null references "Creditos"."TBL_EMPRESAS"(id_empresa),
        id_empleado_empresa integer null references "Creditos"."TBL_EMPLEADOS_EMPRESA"(id_empleado_empresa),
        id_tip_identificacion integer null references "Creditos"."TBL_TIP_IDENTIFICACIONES"(id_tip_identificacion),
        v_identificacion varchar(50) not null,
        v_primer_nombre varchar(100) not null,
        v_segundo_nombre varchar(100) null,
        v_primer_apellido varchar(100) null,
        v_segundo_apellido varchar(100) null,
        v_nombre_completo varchar(250) not null,
        v_correo varchar(180) not null,
        v_telefono varchar(60) null,
        v_password_hash text not null,
        v_cargo varchar(160) null,
        id_tipo_contrato integer null references "Creditos"."TBL_TIPO_CONTRATO"(id_tipo_contrato),
        fec_ingreso date null,
        val_salario numeric(18,2) null,
        val_neto numeric(18,2) null,
        ind_tiene_embargos boolean not null default false,
        id_estado integer null references "Creditos"."TBL_ESTADOS"(id_estado),
        ind_correo_confirmado boolean not null default false,
        fec_creacion timestamp without time zone not null default now(),
        fec_actualizacion timestamp without time zone null,
        constraint uq_cliente_portal_identificacion unique (v_identificacion),
        constraint uq_cliente_portal_correo unique (v_correo)
      )
    `);

    await client.query(`
      create table if not exists "Creditos"."TBL_CLIENTE_TOKENS" (
        id_cliente_token serial primary key,
        id_cliente_portal integer not null references "Creditos"."TBL_CLIENTES_PORTAL"(id_cliente_portal) on delete cascade,
        tipo_token varchar(40) not null,
        token varchar(160) not null unique,
        usado boolean not null default false,
        fec_expira timestamp without time zone not null,
        fec_creacion timestamp without time zone not null default now()
      )
    `);

    await client.query('commit');
    console.log('Portal de clientes listo');
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
