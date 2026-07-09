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
  const service = await import('../apps/api/dist/modules/creditos/creditos.service.js');
  const catalogos = await service.listCreditosCatalogs();
  const creditos = await service.listCreditos();
  console.log(JSON.stringify({ catalogos, creditos }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
