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

  const allTablesRes = await client.query(`
    select table_name from information_schema.tables where table_schema = 'Creditos' order by table_name
  `);
  console.log('Todas las tablas en Creditos:', allTablesRes.rows.map(r => r.table_name));

  await client.end();
}

main().catch(console.error);
