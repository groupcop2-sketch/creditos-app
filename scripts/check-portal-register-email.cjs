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
  const smtpUser = process.env.SMTP_USER || '';
  const correo = smtpUser.endsWith('@gmail.com')
    ? smtpUser.replace('@gmail.com', `+activacion${suffix}@gmail.com`)
    : `cliente.activacion.${suffix}@correo.com`;
  const { registerPortalClient } = await import('../apps/api/dist/modules/portal/portal.service.js');
  const response = await registerPortalClient({
    codigoEmpresa: 'EMP-KAL-001',
    identificacion: `88${suffix}`,
    primerNombre: 'PRUEBA',
    segundoNombre: 'CORREO',
    primerApellido: 'PORTAL',
    correo,
    telefono: '3000000000',
    password: 'Demo12345',
    cargo: 'Analista',
    fechaIngreso: '2024-01-15',
    salario: 2500000,
    neto: 2100000,
    tieneEmbargos: false
  });
  console.log(JSON.stringify({
    cliente: response.cliente,
    emailConfiguredAndProbablySent: !response.confirmationToken,
    devConfirmationToken: response.confirmationToken ?? null
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
