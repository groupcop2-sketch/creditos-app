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

const tables = process.argv.slice(2);

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  for (const table of tables) {
    const result = await client.query(
      `select column_name, data_type
       from information_schema.columns
       where table_schema = 'Creditos' and table_name = $1
       order by ordinal_position`,
      [table]
    );
    console.log(table);
    console.log(result.rows.map((row) => `${row.column_name}:${row.data_type}`).join(', '));
  }
  await client.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
