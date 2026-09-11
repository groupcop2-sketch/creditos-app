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

  const tables = await client.query(`
    select table_name
    from information_schema.tables
    where table_schema = 'Creditos'
    order by table_name
  `);
  console.log('\n================ Tablas en Esquema Creditos ================');
  console.log(tables.rows.map(t => t.table_name).join(', '));

  const empresas = await client.query(`
    select id_empresa, v_codigo, v_nit, v_razon_social, num_empleados, val_cupo, e.v_descripcion as estado
    from "Creditos"."TBL_EMPRESAS" emp
    left join "Creditos"."TBL_ESTADOS" e on emp.id_estado = e.id_estado
    order by id_empresa
  `);

  console.log(`\n================ Pagadurías Registradas (${empresas.rowCount}) ================`);
  console.table(empresas.rows);

  await client.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
