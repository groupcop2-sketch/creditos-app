require('dotenv').config();
const { Client } = require('pg');

async function ensureDatabase() {
  const adminClient = new Client({
    host: process.env.PGHOST || '127.0.0.1',
    port: parseInt(process.env.PGPORT || '5432', 10),
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'IHgUXHeoGsWZxCv3ZHzt',
    database: 'postgres',
  });

  await adminClient.connect();
  const dbName = process.env.PGDATABASE || 'P&S';
  const res = await adminClient.query(
    `select 1 from pg_database where datname = $1`,
    [dbName]
  );

  if (res.rowCount === 0) {
    console.log(`Creando base de datos "${dbName}"...`);
    // Quote database name for SQL identifier
    await adminClient.query(`CREATE DATABASE "${dbName.replace(/"/g, '""')}"`);
    console.log(`Base de datos "${dbName}" creada con éxito.`);
  } else {
    console.log(`La base de datos "${dbName}" ya existe.`);
  }
  await adminClient.end();
}

async function main() {
  await ensureDatabase();

  const client = new Client({
    host: process.env.PGHOST || '127.0.0.1',
    port: parseInt(process.env.PGPORT || '5432', 10),
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'IHgUXHeoGsWZxCv3ZHzt',
    database: process.env.PGDATABASE || 'P&S',
  });

  await client.connect();
  console.log('--- CONECTADO EXITOSAMENTE A LA BD ---');

  await client.query('CREATE SCHEMA IF NOT EXISTS "Creditos"');
  console.log('Esquema "Creditos" asegurado.');

  const tables = await client.query(`
    select table_name
    from information_schema.tables
    where table_schema = 'Creditos'
    order by table_name
  `);
  console.log('Tablas en "Creditos":', tables.rows.map(r => r.table_name));

  await client.end();
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
