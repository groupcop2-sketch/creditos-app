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

  console.log('\n================ EMPRESAS / PAGADURÍAS ================');
  const emp = await client.query('select v_codigo, v_nit, v_razon_social from "Creditos"."TBL_EMPRESAS" order by v_codigo');
  console.table(emp.rows);

  console.log('\n================ VENDEDORES (TBL_COMERCIALES) ================');
  const com = await client.query('select v_codigo_vendedor, v_identificacion, v_nombre_completo, v_correo, v_telefono from "Creditos"."TBL_COMERCIALES"');
  console.table(com.rows);

  console.log('\n================ INVERSIONISTAS (TBL_INVERSIONISTAS) ================');
  const inv = await client.query('select v_identificacion, v_nombre_completo, v_correo, v_telefono, fec_nacimiento from "Creditos"."TBL_INVERSIONISTAS"');
  console.table(inv.rows);

  console.log('\n================ TASAS DE INVERSIÓN (TBL_TASAS_INVERSION) ================');
  const tasas = await client.query('select v_nombre, val_tasa from "Creditos"."TBL_TASAS_INVERSION"');
  console.table(tasas.rows);

  await client.end();
}

main().catch(console.error);
