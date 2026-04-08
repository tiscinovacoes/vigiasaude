import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tjlswurqqshymugajzmq.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqbHN3dXJxcXNoeW11Z2Fqem1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNTg2NDQsImV4cCI6MjA4OTkzNDY0NH0.j-sQU9_8_CgmSRQQLJS5Vn1DCVhAC2KmfnLK8fJJZyg';

// O client é instanciado com placeholders para evitar erros de inicialização.
// A lógica de fallback no api.ts tratará as falhas de conexão reais.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
