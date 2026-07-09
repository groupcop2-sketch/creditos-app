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
  const { Client } = require('pg');
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const result = await client.query(`
    select
      (select count(*)::int from "Creditos"."TBL_CLIENTES_PORTAL") as clientes_portal,
      (select count(*)::int from "Creditos"."TBL_TIPO_CONTRATO") as tipos_contrato,
      (select count(*)::int from "Creditos"."TBL_TIP_IDENTIFICACIONES") as tipos_identificacion,
      (select v_razon_social from "Creditos"."TBL_EMPRESAS" where v_codigo = 'EMP-KAL-001' limit 1) as empresa_demo
  `);
  console.log(JSON.stringify(result.rows[0], null, 2));
  await client.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
