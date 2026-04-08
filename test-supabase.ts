// Para testar, você pode rodar este comando no terminal:
// npx tsx test-supabase.ts

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tjlswurqqshymugajzmq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqbHN3dXJxcXNoeW11Z2Fqem1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNTg2NDQsImV4cCI6MjA4OTkzNDY0NH0.j-sQU9_8_CgmSRQQLJS5Vn1DCVhAC2KmfnLK8fJJZyg';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  console.log('--- Testando Conexão Vigia Saúde ---');
  console.log('URL:', supabaseUrl);
  
  const { data, error } = await supabase.from('medicamentos').select('count', { count: 'exact' });
  
  if (error) {
    console.error('❌ Erro na conexão:', error.message);
    if (error.message.includes('relation "medicamentos" does not exist')) {
      console.log('💡 Dica: Você precisa rodar o script SQL (database_schema.sql) no SQL Editor do Supabase.');
    }
  } else {
    console.log('✅ Conexão estabelecida com sucesso!');
    console.log('Medicamentos cadastrados:', data);
  }
}

testConnection();
