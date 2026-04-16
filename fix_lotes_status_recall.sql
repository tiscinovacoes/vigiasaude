-- ============================================================
-- MIGRATION: Adicionar 'RECALL' ao CHECK constraint de lotes.status
-- Execute no SQL Editor do Supabase
-- ============================================================

-- 1. Remove o constraint antigo (que não contém RECALL)
ALTER TABLE lotes
  DROP CONSTRAINT IF EXISTS lotes_status_check;

-- 2. Recria o constraint incluindo RECALL e QUARENTENA
ALTER TABLE lotes
  ADD CONSTRAINT lotes_status_check
  CHECK (status IN ('ATIVO', 'RECALL', 'BLOQUEADO', 'VENCIDO', 'QUARENTENA'));

-- 3. Verificação: lista constraints da tabela
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'lotes'::regclass
  AND contype = 'c';
