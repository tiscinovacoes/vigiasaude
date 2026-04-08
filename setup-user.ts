import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tjlswurqqshymugajzmq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqbHN3dXJxcXNoeW11Z2Fqem1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNTg2NDQsImV4cCI6MjA4OTkzNDY0NH0.j-sQU9_8_CgmSRQQLJS5Vn1DCVhAC2KmfnLK8fJJZyg';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function setup() {
  console.log('--- Iniciando Configuração Automática ---');

  // 1. Tentar buscar perfis
  console.log('Buscando perfis disponíveis...');
  const { data: perfis, error: perfisError } = await supabase.from('perfis').select('*');
  
  if (perfisError) {
    console.log('Erro ao buscar perfis (pode ser que a tabela não exista ou RLS ativo):', perfisError.message);
  } else {
    console.log('Perfis encontrados:', perfis);
  }

  const userUuid = '06ea4770-f2e6-4558-a252-8ab5b29ce1ff';
  const cpf = '00667186190';
  const perfilId = perfis && perfis.length > 0 ? perfis[0].id : null;

  if (!perfilId) {
    console.log('⚠️ Não foi possível encontrar um UUID de perfil automaticamente.');
    return;
  }

  console.log(`Tentando vincular Usuário ${userUuid} ao Perfil ${perfilId}...`);

  const { data, error } = await supabase.from('usuarios_sistema').upsert({
    auth_user_id: userUuid,
    cpf: cpf,
    ativo: true,
    perfil_id: perfilId
  }, { onConflict: 'cpf' });

  if (error) {
    console.error('❌ Erro ao configurar usuário:', error.message);
    console.log('Dica: Pode ser que o Banco de Dados exija permissões de Administrador (Service Role) para esta operação via API.');
  } else {
    console.log('✅ Usuário configurado com sucesso via API!');
  }
}

setup();
