import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tjlswurqqshymugajzmq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqbHN3dXJxcXNoeW11Z2Fqem1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNTg2NDQsImV4cCI6MjA4OTkzNDY0NH0.j-sQU9_8_CgmSRQQLJS5Vn1DCVhAC2KmfnLK8fJJZyg';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function insertSampleData() {
  console.log('--- Cadastrando Medicamento de Teste ---');
  
  const { data, error } = await supabase
    .from('medicamentos')
    .insert([
      { 
        nome: 'Insulina NPH', 
        dosagem: '100 UI/ml', 
        estoque_minimo: 500, 
        preco_teto_cmed: 45.50 
      }
    ])
    .select();

  if (error) {
    console.error('❌ Erro ao cadastrar:', error.message);
    console.log('💡 Dica: Verifique se o RLS (Row Level Security) está desabilitado ou se há uma política de INSERT para a role anon.');
  } else {
    console.log('✅ Medicamento cadastrado com sucesso!');
    console.log('Dados:', data);
  }
}

insertSampleData();
