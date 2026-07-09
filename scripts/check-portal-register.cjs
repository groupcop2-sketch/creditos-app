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
  const suffix = Date.now().toString().slice(-6);
  const { registerPortalClient, loginPortalClient } = await import('../apps/api/dist/modules/portal/portal.service.js');
  const registered = await registerPortalClient({
    codigoEmpresa: 'EMP-KAL-001',
    identificacion: `99${suffix}`,
    primerNombre: 'CLIENTE',
    segundoNombre: 'DEMO',
    primerApellido: 'PORTAL',
    correo: `cliente.demo.${suffix}@correo.com`,
    telefono: '3000000000',
    password: 'Demo12345',
    cargo: 'Analista',
    fechaIngreso: '2023-01-15',
    salario: 3500000,
    neto: 2800000,
    tieneEmbargos: false
  });
  const logged = await loginPortalClient({ identificacion: registered.cliente.identificacion, password: 'Demo12345' });
  console.log(JSON.stringify({ registered: registered.cliente, logged }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
