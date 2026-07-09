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
      alter table "Creditos"."TBL_CREDITOS"
        add column if not exists consecutivo varchar(40),
        add column if not exists id_producto_credito integer references "Creditos"."TBL_PRODUCTOS_CREDITO"(id_producto_credito),
        add column if not exists id_libranzera integer references "Creditos"."TBL_LIBRANZERAS"(id_libranzera),
        add column if not exists id_empresa integer references "Creditos"."TBL_EMPRESAS"(id_empresa),
        add column if not exists id_empleado_empresa integer references "Creditos"."TBL_EMPLEADOS_EMPRESA"(id_empleado_empresa),
        add column if not exists id_comercial integer references "Creditos"."TBL_COMERCIALES"(id_comercial),
        add column if not exists v_identificacion_cliente varchar(50),
        add column if not exists v_nombre_cliente varchar(250),
        add column if not exists v_correo_cliente varchar(180),
        add column if not exists v_telefono_cliente varchar(60),
        add column if not exists val_monto_solicitado numeric(18,2),
        add column if not exists num_plazo integer,
        add column if not exists tipo_tasa varchar(40),
        add column if not exists val_tasa numeric(10,4),
        add column if not exists val_cuota_estimada numeric(18,2),
        add column if not exists fec_radicacion timestamp without time zone default now()
    `);

    await client.query(`
      create unique index if not exists idx_tbl_creditos_consecutivo_unique
      on "Creditos"."TBL_CREDITOS" (consecutivo)
      where consecutivo is not null
    `);

    await client.query('commit');
    console.log('TBL_CREDITOS migrada para radicacion');
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
