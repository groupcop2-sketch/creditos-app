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
  const portal = await import('../apps/api/dist/modules/portal/portal.service.js');
  const productos = await portal.listPortalProductosCredito();
  if (!productos.length) throw new Error('No hay productos para probar');
  const cliente = await portal.loginPortalClient({ identificacion: '99335575', password: 'Demo12345' });
  const input = { idProductoCredito: productos[0].id, montoSolicitado: 5000000, plazo: 36 };
  const simulacion = await portal.simularPortalCredito(cliente.id, input);
  const solicitud = await portal.crearSolicitudPortalCredito(cliente.id, input);
  console.log(JSON.stringify({
    producto: productos[0].nombre,
    cuota: simulacion.resumen.cuotaEstimada,
    solicitud: solicitud.consecutivo
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
