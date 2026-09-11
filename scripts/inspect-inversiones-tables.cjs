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

  const tables = ['TBL_COMERCIALES', 'TBL_FORMULAS_COMERCIAL', 'TBL_LIBRANZERAS', 'TBL_ROLES_VENDEDOR'];

  for (const t of tables) {
    const cols = await client.query(`
      select column_name, data_type, is_nullable
      from information_schema.columns
      where table_schema = 'Creditos' and table_name = $1
      order by ordinal_position
    `, [t]);
    console.log(`\nESTRUCTURA DE ${t}:`);
    console.table(cols.rows);
  }

  await client.end();
}

main().catch(console.error);
