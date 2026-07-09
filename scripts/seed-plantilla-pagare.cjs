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

const content = `PAGARE No. {{credito.consecutivo}}

VALOR: {{credito.monto}}
VALOR EN LETRAS: {{credito.monto_letras}}
LUGAR Y FECHA DE SUSCRIPCION: {{credito.fecha}}
PLAZO: {{credito.plazo}} meses

DEUDOR
Nombre: {{cliente.nombre_completo}}
Identificacion: {{cliente.identificacion}}
Correo: {{cliente.correo}}
Telefono: {{cliente.telefono}}
Empresa: {{empresa.razon_social}}

ACREEDOR
{{libranzera.razon_social}}

El DEUDOR declara que pagara incondicionalmente a la orden del ACREEDOR el capital correspondiente al credito {{credito.consecutivo}}, junto con los intereses, cargos y demas conceptos legalmente exigibles de acuerdo con las condiciones aprobadas.

La obligacion corresponde al producto {{producto.nombre}}, con tasa {{credito.tasa}}, plazo de {{credito.plazo}} meses y cuota estimada de {{credito.cuota}}.

CARTA DE INSTRUCCIONES

El DEUDOR autoriza al ACREEDOR o a quien represente sus derechos para completar los espacios del pagare cuando se presente incumplimiento o una causal de aceleracion de la obligacion, de acuerdo con la ley colombiana y los contratos suscritos.

El valor exigible podra comprender capital insoluto, intereses permitidos, seguros, comisiones, gastos de cobranza y demas conceptos debidamente soportados.

El DEUDOR manifiesta que la informacion suministrada es veraz, que conoce las condiciones del credito y que recibe copia de este documento.

FIRMA DEL DEUDOR

____________________________________
{{cliente.nombre_completo}}
Documento: {{cliente.identificacion}}

Documento generado automaticamente por el sistema. Requiere revision juridica y firma electronica para su perfeccionamiento.`;

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  await client.query('begin');
  try {
    const template = await client.query(
      `insert into "Creditos"."TBL_PLANTILLAS_DOCUMENTO"
        (codigo, nombre, descripcion, tipo_documento, estado)
       values ('PAGARE_BASE', 'Pagare y carta de instrucciones',
        'Plantilla inicial para creditos. Requiere revision juridica.', 'PAGARE', 'BORRADOR')
       on conflict (codigo) do update set nombre = excluded.nombre
       returning id_plantilla_documento`
    );
    await client.query(
      `insert into "Creditos"."TBL_VERSIONES_PLANTILLA"
        (id_plantilla_documento, numero_version, contenido, variables, estado)
       select $1, 1, $2, $3::jsonb, 'BORRADOR'
       where not exists (
         select 1 from "Creditos"."TBL_VERSIONES_PLANTILLA"
         where id_plantilla_documento = $1
       )`,
      [template.rows[0].id_plantilla_documento, content, JSON.stringify([
        'credito.consecutivo', 'credito.monto', 'credito.monto_letras', 'credito.fecha',
        'credito.plazo', 'credito.tasa', 'credito.cuota', 'cliente.nombre_completo',
        'cliente.identificacion', 'cliente.correo', 'cliente.telefono',
        'empresa.razon_social', 'libranzera.razon_social', 'producto.nombre'
      ])]
    );
    await client.query('commit');
    console.log('Plantilla inicial de pagare preparada.');
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
