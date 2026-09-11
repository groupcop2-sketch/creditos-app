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

  console.log('\n================ VENDEDORES REGISTRADOS ================');
  const com = await client.query('select v_identificacion, v_nombre_completo, v_correo, v_telefono from "Creditos"."TBL_COMERCIALES"');
  console.table(com.rows);

  console.log('\n================ INVERSIONISTAS REGISTRADOS ================');
  const inv = await client.query('select v_identificacion, v_razon_social, val_inversion_total, val_dinero, val_cartera, num_prestamos_desembolsados from "Creditos"."TBL_INVERSIONISTAS"');
  console.table(inv.rows);

  console.log('\n================ PLANES DE INVERSIÓN (TBL_INVERSIONES & TBL_TASAS_INVERSION) ================');
  const invPlanes = await client.query(`
    select i.v_razon_social as inversionista, t.v_nombre as plan, inv.val_monto, inv.val_inversion, inv.val_disponible
    from "Creditos"."TBL_INVERSIONES" inv
    join "Creditos"."TBL_INVERSIONISTAS" i on inv.id_inversionista = i.id_inversionista
    join "Creditos"."TBL_TASAS_INVERSION" t on inv.id_tasa_inversion = t.id_tasa_inversion
  `);
  console.table(invPlanes.rows);

  await client.end();
}

main().catch(console.error);
