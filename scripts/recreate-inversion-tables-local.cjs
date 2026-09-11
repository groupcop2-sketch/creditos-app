require('dotenv').config();
const { Client } = require('pg');

async function main() {
  const client = new Client({
    host: process.env.PGHOST || '127.0.0.1',
    port: parseInt(process.env.PGPORT || '5432', 10),
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'IHgUXHeoGsWZxCv3ZHzt',
    database: process.env.PGDATABASE || 'P&S',
  });
  await client.connect();

  await client.query('drop table if exists "Creditos"."TBL_INVERSIONES" cascade;');
  await client.query('drop table if exists "Creditos"."TBL_INVERSIONISTAS" cascade;');
  await client.query('drop table if exists "Creditos"."TBL_TASAS_INVERSION" cascade;');

  await client.query(`
    create table "Creditos"."TBL_INVERSIONISTAS" (
      id_inversionista serial not null,
      v_identificacion character varying(50) not null,
      v_primer_nombre character varying(80) not null,
      v_seg_nombre character varying(80) null,
      v_primer_apell character varying(80) not null,
      v_seg_apell character varying(80) not null,
      v_telefono character varying(30) not null,
      v_correo character varying(160) not null,
      v_num_principal character varying(4) null,
      v_pri_num_casa character varying(4) null,
      v_seg_num_casa character varying(4) null,
      v_nombre_completo character varying(220) null,
      v_direccion character varying(260) null,
      fec_creacion timestamp without time zone not null default now(),
      fec_actualizacion timestamp without time zone null,
      id_ciudad integer not null default 1,
      id_estado integer not null default 1,
      id_tip_identificacion integer not null default 1,
      fec_nacimiento date null,
      constraint TBL_INVERSIONISTAS_pkey primary key (id_inversionista)
    );
  `);

  await client.query(`
    create table "Creditos"."TBL_TASAS_INVERSION" (
      id_tasa_inversion serial not null,
      v_nombre character varying(120) not null,
      val_tasa numeric(10, 4) not null,
      num_plazo integer null,
      id_estado integer null default 1,
      fec_creacion timestamp without time zone not null default now(),
      fec_actualizacion timestamp without time zone null,
      constraint TBL_TASAS_INVERSION_pkey primary key (id_tasa_inversion)
    );
  `);

  console.log('[✓] Tablas TBL_INVERSIONISTAS y TBL_TASAS_INVERSION adaptadas a Supabase DDL');
  await client.end();
}

main().catch(console.error);
