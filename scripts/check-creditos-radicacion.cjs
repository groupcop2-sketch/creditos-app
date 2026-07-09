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
  const tables = await client.query(
    `select table_name from information_schema.tables
     where table_schema = 'Creditos' and table_name in ('TBL_CREDITOS','TBL_CREDITO_DOCUMENTOS','TBL_CREDITO_ETAPAS','TBL_CREDITO_LIQUIDACION')
     order by table_name`
  );
  const counts = await client.query(`
    select
      (select count(*)::int from "Creditos"."TBL_PRODUCTOS_CREDITO") as productos,
      (select count(*)::int from "Creditos"."TBL_EMPRESAS") as empresas,
      (select count(*)::int from "Creditos"."TBL_EMPLEADOS_EMPRESA") as empleados,
      (select count(*)::int from "Creditos"."TBL_COMERCIALES") as comerciales,
      (select count(*)::int from "Creditos"."TBL_CREDITOS") as creditos
  `);
  console.log(JSON.stringify({ tables: tables.rows, counts: counts.rows[0] }, null, 2));
  await client.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
