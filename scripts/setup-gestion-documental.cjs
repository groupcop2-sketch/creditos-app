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
  await client.query(`
    create table if not exists "Creditos"."TBL_PLANTILLAS_DOCUMENTO" (
      id_plantilla_documento serial primary key,
      codigo varchar(60) not null unique,
      nombre varchar(180) not null,
      descripcion text null,
      tipo_documento varchar(60) not null,
      modo_plantilla varchar(20) not null default 'TEXTO',
      estado varchar(20) not null default 'BORRADOR',
      fec_creacion timestamp not null default now(),
      fec_actualizacion timestamp null
    );
    alter table "Creditos"."TBL_PLANTILLAS_DOCUMENTO"
      add column if not exists orden integer not null default 100;

    create table if not exists "Creditos"."TBL_VERSIONES_PLANTILLA" (
      id_version_plantilla serial primary key,
      id_plantilla_documento integer not null references "Creditos"."TBL_PLANTILLAS_DOCUMENTO"(id_plantilla_documento) on delete cascade,
      numero_version integer not null,
      contenido text not null,
      variables jsonb not null default '[]'::jsonb,
      estado varchar(20) not null default 'BORRADOR',
      fec_vigencia date null,
      fec_creacion timestamp not null default now(),
      unique (id_plantilla_documento, numero_version)
    );

    create table if not exists "Creditos"."TBL_DOCUMENTOS_GENERADOS" (
      id_documento_generado serial primary key,
      id_credito integer not null references "Creditos"."TBL_CREDITOS"(id_credito),
      id_version_plantilla integer not null references "Creditos"."TBL_VERSIONES_PLANTILLA"(id_version_plantilla),
      nombre_archivo varchar(240) not null,
      contenido_pdf bytea not null,
      variables_usadas jsonb not null,
      hash_documento varchar(64) not null,
      estado varchar(30) not null default 'GENERADO',
      proveedor_firma varchar(80) null,
      id_externo_firma varchar(180) null,
      fec_generacion timestamp not null default now(),
      fec_firma timestamp null
    );

    create table if not exists "Creditos"."TBL_DOCUMENTO_FIRMANTES" (
      id_documento_firmante serial primary key,
      id_documento_generado integer not null references "Creditos"."TBL_DOCUMENTOS_GENERADOS"(id_documento_generado) on delete cascade,
      nombre varchar(200) not null,
      correo varchar(180) not null,
      identificacion varchar(60) null,
      rol varchar(60) not null default 'DEUDOR',
      orden integer not null default 1,
      estado varchar(30) not null default 'PENDIENTE',
      fec_firma timestamp null
    );

    create table if not exists "Creditos"."TBL_PDF_BASE_PLANTILLA" (
      id_pdf_base serial primary key,
      id_plantilla_documento integer not null unique references "Creditos"."TBL_PLANTILLAS_DOCUMENTO"(id_plantilla_documento) on delete cascade,
      nombre_archivo varchar(240) not null,
      contenido_pdf bytea not null,
      hash_archivo varchar(64) not null,
      numero_paginas integer null,
      fec_carga timestamp not null default now()
    );

    create table if not exists "Creditos"."TBL_CAMPOS_PDF_PLANTILLA" (
      id_campo_pdf serial primary key,
      id_plantilla_documento integer not null references "Creditos"."TBL_PLANTILLAS_DOCUMENTO"(id_plantilla_documento) on delete cascade,
      variable varchar(120) not null,
      etiqueta varchar(180) not null,
      tipo_campo varchar(30) not null default 'TEXTO',
      pagina integer not null,
      pos_x numeric(8,5) not null,
      pos_y numeric(8,5) not null,
      ancho numeric(8,5) not null default 0.25,
      alto numeric(8,5) not null default 0.03,
      tamano_fuente numeric(5,2) not null default 9,
      alineacion varchar(20) not null default 'IZQUIERDA',
      valor_fijo varchar(240) null,
      fec_creacion timestamp not null default now()
    );
  `);
  await client.end();
  console.log('Gestion documental preparada.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
