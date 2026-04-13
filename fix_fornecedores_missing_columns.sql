-- =============================================================================
-- FIX: Adicionar colunas ausentes na tabela 'fornecedores'
-- Erro: "Could not find the 'lead_time_medio' column of 'fornecedores' in the schema cache"
-- Execute este script no SQL Editor do Supabase Dashboard
-- =============================================================================

ALTER TABLE fornecedores
  ADD COLUMN IF NOT EXISTS pontualidade_percentual DECIMAL(5,2) DEFAULT 100.00,
  ADD COLUMN IF NOT EXISTS lead_time_medio INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS valor_total_contratado DECIMAL(15,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Verificar resultado
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'fornecedores'
ORDER BY ordinal_position;
