-- =============================================================================
-- MIGRAÇÃO 004 – WMS Módulo de Compras: Recebimento de NF e Avarias
-- Execute no Supabase SQL Editor → Run
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. NF_RECEBIMENTO – cabeçalho da nota fiscal
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS nf_recebimento (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_nf           TEXT NOT NULL,
    serie_nf            TEXT NOT NULL DEFAULT '1',
    compra_id           UUID REFERENCES compras(id) ON DELETE SET NULL,
    fornecedor_id       UUID NOT NULL REFERENCES fornecedores(id),
    data_emissao        DATE NOT NULL,
    data_recebimento    DATE NOT NULL DEFAULT CURRENT_DATE,
    valor_total         NUMERIC(14,2) NOT NULL DEFAULT 0,
    status              TEXT NOT NULL DEFAULT 'PENDENTE'
                        CHECK (status IN ('PENDENTE','CONFERINDO','CONCLUIDO','DIVERGENTE')),
    observacoes         TEXT,
    recebido_por        TEXT,                  -- e-mail do usuário que recebeu
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (numero_nf, serie_nf, fornecedor_id)
);

CREATE INDEX IF NOT EXISTS idx_nf_compra     ON nf_recebimento (compra_id);
CREATE INDEX IF NOT EXISTS idx_nf_fornecedor ON nf_recebimento (fornecedor_id);
CREATE INDEX IF NOT EXISTS idx_nf_status     ON nf_recebimento (status);

ALTER TABLE nf_recebimento ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "nf_recebimento_all_auth" ON nf_recebimento;
CREATE POLICY "nf_recebimento_all_auth" ON nf_recebimento
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- 2. NF_ITENS – itens da nota fiscal (um por linha / medicamento)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS nf_itens (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nf_id               UUID NOT NULL REFERENCES nf_recebimento(id) ON DELETE CASCADE,
    medicamento_id      UUID NOT NULL REFERENCES medicamentos(id),
    codigo_lote         TEXT NOT NULL,
    data_validade       DATE NOT NULL,
    quantidade_nf       INT  NOT NULL CHECK (quantidade_nf > 0),
    quantidade_recebida INT  NOT NULL DEFAULT 0,
    custo_unitario      NUMERIC(14,4) NOT NULL DEFAULT 0,
    lote_id             UUID  REFERENCES lotes(id) ON DELETE SET NULL,   -- preenchido após dar entrada
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nf_itens_nf          ON nf_itens (nf_id);
CREATE INDEX IF NOT EXISTS idx_nf_itens_medicamento  ON nf_itens (medicamento_id);

ALTER TABLE nf_itens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "nf_itens_all_auth" ON nf_itens;
CREATE POLICY "nf_itens_all_auth" ON nf_itens
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- 3. AVARIAS_RECEBIMENTO – itens avariados separados na conferência
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS avarias_recebimento (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nf_item_id          UUID NOT NULL REFERENCES nf_itens(id) ON DELETE CASCADE,
    nf_id               UUID NOT NULL REFERENCES nf_recebimento(id) ON DELETE CASCADE,
    medicamento_id      UUID NOT NULL REFERENCES medicamentos(id),
    codigo_lote         TEXT NOT NULL,
    quantidade          INT  NOT NULL CHECK (quantidade > 0),
    tipo_avaria         TEXT NOT NULL
                        CHECK (tipo_avaria IN (
                           'EMBALAGEM_DANIFICADA','TEMPERATURA_INCORRETA',
                           'PRAZO_VALIDADE_CURTO','PRODUTO_DIFERENTE','OUTRO'
                        )),
    descricao           TEXT,
    foto_url            TEXT,
    status              TEXT NOT NULL DEFAULT 'ABERTA'
                        CHECK (status IN ('ABERTA','DEVOLVIDO_FORNECEDOR','DESCARTADO','APROVEITADO')),
    registrado_por      TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_avarias_nf          ON avarias_recebimento (nf_id);
CREATE INDEX IF NOT EXISTS idx_avarias_medicamento  ON avarias_recebimento (medicamento_id);
CREATE INDEX IF NOT EXISTS idx_avarias_status       ON avarias_recebimento (status);

ALTER TABLE avarias_recebimento ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "avarias_all_auth" ON avarias_recebimento;
CREATE POLICY "avarias_all_auth" ON avarias_recebimento
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- 4. Trigger updated_at – reaproveitando função genérica
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_nf_updated_at        ON nf_recebimento;
DROP TRIGGER IF EXISTS trg_avarias_updated_at   ON avarias_recebimento;

CREATE TRIGGER trg_nf_updated_at
    BEFORE UPDATE ON nf_recebimento
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_avarias_updated_at
    BEFORE UPDATE ON avarias_recebimento
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- 5. VIEW auxiliar para dashboard de recebimento
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_nf_recebimento_resumo AS
SELECT
    n.id,
    n.numero_nf,
    n.serie_nf,
    n.status,
    n.data_recebimento,
    n.valor_total,
    f.razao_social AS fornecedor_nome,
    COUNT(i.id)                                        AS total_itens,
    COALESCE(SUM(av.quantidade), 0)                    AS total_avarias,
    COALESCE(SUM(i.quantidade_nf), 0)                  AS qtd_nf_total,
    COALESCE(SUM(i.quantidade_recebida), 0)            AS qtd_recebida_total
FROM nf_recebimento n
JOIN fornecedores   f  ON f.id = n.fornecedor_id
LEFT JOIN nf_itens  i  ON i.nf_id = n.id
LEFT JOIN avarias_recebimento av ON av.nf_id = n.id AND av.status = 'ABERTA'
GROUP BY n.id, n.numero_nf, n.serie_nf, n.status, n.data_recebimento, n.valor_total, f.razao_social;

-- ---------------------------------------------------------------------------
-- FIM DA MIGRAÇÃO 004
-- ---------------------------------------------------------------------------
