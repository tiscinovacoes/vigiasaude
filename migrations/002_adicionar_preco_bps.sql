-- Adicionar coluna preco_bps à tabela medicamentos para rastreamento de preço BPS
ALTER TABLE medicamentos ADD COLUMN IF NOT EXISTS preco_bps NUMERIC(10, 2);

-- Criar índice para queries de preço BPS
CREATE INDEX IF NOT EXISTS idx_medicamentos_preco_bps ON medicamentos(preco_bps);
