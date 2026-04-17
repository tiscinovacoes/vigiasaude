-- Migration: Adicionar campos para rastreamento de lead time
-- Data: 2026-04-17
-- Descrição: Vincula lotes com compras e armazena datas para cálculo de lead time

-- Adicionar coluna data_entrada na tabela lotes
ALTER TABLE lotes
ADD COLUMN IF NOT EXISTS data_entrada DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS compra_id UUID REFERENCES compras_registro(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS data_solicitacao_compra DATE;

-- Criar índice para melhor performance nas queries de lead time
CREATE INDEX IF NOT EXISTS idx_lotes_fornecedor_data_entrada
ON lotes(fornecedor_id, data_entrada);

CREATE INDEX IF NOT EXISTS idx_lotes_compra_id
ON lotes(compra_id);

-- Adicionar comentários às colunas
COMMENT ON COLUMN lotes.data_entrada IS 'Data em que o lote entrou no estoque (usado para cálculo de lead time)';
COMMENT ON COLUMN lotes.compra_id IS 'Referência ao pedido de compra que originou este lote';
COMMENT ON COLUMN lotes.data_solicitacao_compra IS 'Data de solicitação da compra (copiado para facilitar cálculo de lead time)';
