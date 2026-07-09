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
  const signature = await client.query(
    `select proname, pg_get_function_result(p.oid) as result, pg_get_function_arguments(p.oid) as args
     from pg_proc p
     join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = $1 and p.proname = $2`,
    ['Creditos', 'generar_amortizacion']
  );
  const sample = await client.query('select * from "Creditos".generar_amortizacion($1, $2, $3) limit 3', [5000000, 25.56, 36]);
  console.log(JSON.stringify({ signature: signature.rows, sample: sample.rows }, null, 2));
  await client.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
