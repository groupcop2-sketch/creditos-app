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
    alter table "Creditos"."TBL_CREDITOS"
      add column if not exists v_estado_solicitud varchar(40) not null default 'SOLICITADO';
    update "Creditos"."TBL_CREDITOS"
      set v_estado_solicitud = 'SOLICITADO'
      where v_estado_solicitud is null or trim(v_estado_solicitud) = '';
    create index if not exists idx_creditos_cliente_estado
      on "Creditos"."TBL_CREDITOS" (v_identificacion_cliente, v_estado_solicitud);
  `);
  await client.end();
  console.log('Estados del portal de creditos preparados.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
