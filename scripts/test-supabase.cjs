const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://grqvinvnvhaysnfzszpm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdycXZpbnZudmhheXNuZnpzenBtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2MjU1OTEsImV4cCI6MjA5OTIwMTU5MX0.cHTA_4OYH2E7D_5Nu5D8BiwJ-gMY-USvnA4KoVzRLL4';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function main() {
  console.log('Testing Supabase connection...');

  // Intentar consultar algunas tablas probables o RPC
  const { data: empresas, error: empErr } = await supabase.from('TBL_EMPRESAS').select('*');
  console.log('TBL_EMPRESAS in public:', { count: empresas?.length, error: empErr?.message });

  const { data: empresasCred, error: empCredErr } = await supabase.schema('Creditos').from('TBL_EMPRESAS').select('*');
  console.log('TBL_EMPRESAS in Creditos schema:', { count: empresasCred?.length, error: empCredErr?.message });
}

main().catch(console.error);
