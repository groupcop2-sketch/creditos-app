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

  const empresas = await client.query('select count(*)::int as total from "Creditos"."TBL_EMPRESAS"');
  const empleados = await client.query('select count(*)::int as total from "Creditos"."TBL_EMPLEADOS_EMPRESA"');
  const productos = await client.query('select count(*)::int as total from "Creditos"."TBL_PRODUCTOS_CREDITO"');
  const atributos = await client.query('select count(*)::int as total from "Creditos"."TBL_PRODUCTO_CREDITO_ATRIBUTOS"');
  const documentos = await client.query('select count(*)::int as total from "Creditos"."TBL_PRODUCTO_CREDITO_DOCUMENTOS"');

  console.log('\n================ RESUMEN DE REGISTROS EN BASE DE DATOS ================');
  console.table({
    'Pagadurías (Empresas)': empresas.rows[0].total,
    'Empleados Asociados': empleados.rows[0].total,
    'Líneas de Crédito (Productos)': productos.rows[0].total,
    'Atributos de Crédito': atributos.rows[0].total,
    'Documentos Requeridos': documentos.rows[0].total
  });

  const empSample = await client.query(`
    select e.v_razon_social as empresa, emp.v_identificacion, emp.v_nombre_completo, emp.v_cargo, emp.val_salario, emp.val_neto
    from "Creditos"."TBL_EMPLEADOS_EMPRESA" emp
    join "Creditos"."TBL_EMPRESAS" e on emp.id_empresa = e.id_empresa
    order by e.v_razon_social, emp.v_nombre_completo
    limit 10
  `);
  console.log('\n================ MUESTRA DE EMPLEADOS REGISTRADOS ================');
  console.table(empSample.rows);

  const prodSample = await client.query(`
    select p.consecutivo, p.nombre, tc.des_tipo_credito, p.monto_maximo, p.plazo_maximo
    from "Creditos"."TBL_PRODUCTOS_CREDITO" p
    join "Creditos"."TBL_TIPOS_CREDITO" tc on p.id_tipo_credito = tc.id_tipo_credito
    order by p.consecutivo
  `);
  console.log('\n================ LÍNEAS DE CRÉDITO REGISTRADAS ================');
  console.table(prodSample.rows);

  await client.end();
}

main().catch(console.error);
