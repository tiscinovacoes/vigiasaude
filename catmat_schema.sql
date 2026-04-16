-- =============================================================================
-- CATMAT — Catálogo de Materiais do Governo Federal (COMPRASNET)
-- Execute este script no Supabase Studio > SQL Editor
-- =============================================================================

-- 1. Tabela principal com os dados do CSV
CREATE TABLE IF NOT EXISTS catmat_medicamentos (
    codigo_br           TEXT PRIMARY KEY,          -- Ex: BR0268315
    descricao           TEXT NOT NULL,             -- Descrição completa CATMAT
    unidade_fornecimento TEXT,                     -- Ex: COMPRIMIDO, FRASCO 240 ML
    importado_em        TIMESTAMPTZ DEFAULT NOW()
);

-- Índice full-text para busca rápida por descrição
CREATE INDEX IF NOT EXISTS catmat_descricao_idx
    ON catmat_medicamentos USING gin(to_tsvector('portuguese', descricao));

-- Índice para busca por prefixo de código
CREATE INDEX IF NOT EXISTS catmat_codigo_idx
    ON catmat_medicamentos (codigo_br text_pattern_ops);

-- 2. Permissões: tabela é referência pública, sem RLS restritivo
--    (anon/authenticated podem ler e escrever sem service key)
ALTER TABLE catmat_medicamentos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS catmat_select_all ON catmat_medicamentos;
CREATE POLICY catmat_select_all ON catmat_medicamentos
    FOR SELECT USING (true);

DROP POLICY IF EXISTS catmat_insert_all ON catmat_medicamentos;
CREATE POLICY catmat_insert_all ON catmat_medicamentos
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS catmat_update_all ON catmat_medicamentos;
CREATE POLICY catmat_update_all ON catmat_medicamentos
    FOR UPDATE USING (true);

-- 3. Adicionar coluna catmat_codigo à cmed_referencia (se não existir)
ALTER TABLE cmed_referencia
    ADD COLUMN IF NOT EXISTS catmat_codigo TEXT;

CREATE INDEX IF NOT EXISTS cmed_catmat_idx
    ON cmed_referencia (catmat_codigo)
    WHERE catmat_codigo IS NOT NULL;

-- Comentário
COMMENT ON TABLE catmat_medicamentos IS
    'Catálogo CATMAT (COMPRASNET/SCTOP) — importado via CSV do Portal Compras.gov.br';
