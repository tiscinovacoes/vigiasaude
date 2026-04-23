-- =============================================================================
-- MIGRAÇÃO 005 – WMS Recebimento Operacional
-- Fluxo: Compra → Recebimento → Conferência por Barcode → Avarias → Lotes
-- Execute no Supabase SQL Editor → Run
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Colunas adicionais na tabela COMPRAS
-- ---------------------------------------------------------------------------

ALTER TABLE compras
    ADD COLUMN IF NOT EXISTS numero_po          TEXT,
    ADD COLUMN IF NOT EXISTS tipo_entrada       TEXT NOT NULL DEFAULT 'MANUAL'
                             CHECK (tipo_entrada IN ('MANUAL','NF')),
    ADD COLUMN IF NOT EXISTS numero_nf          TEXT,
    ADD COLUMN IF NOT EXISTS status_recebimento TEXT NOT NULL DEFAULT 'PENDENTE'
                             CHECK (status_recebimento IN ('PENDENTE','EM_CONFERENCIA','FINALIZADO','CANCELADO')),
    ADD COLUMN IF NOT EXISTS data_entrega_real  DATE;

-- índice para pesquisa por PO
CREATE UNIQUE INDEX IF NOT EXISTS idx_compras_numero_po ON compras (numero_po)
    WHERE numero_po IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 2. RECEBIMENTOS_COMPRA – cabeçalho do processo de recebimento
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS recebimentos_compra (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    compra_id   UUID        NOT NULL REFERENCES compras(id) ON DELETE CASCADE,
    status      TEXT        NOT NULL DEFAULT 'EM_CONFERENCIA'
                            CHECK (status IN ('EM_CONFERENCIA','FINALIZADO','CANCELADO')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recebimentos_compra_id ON recebimentos_compra (compra_id);
CREATE INDEX IF NOT EXISTS idx_recebimentos_status    ON recebimentos_compra (status);

ALTER TABLE recebimentos_compra ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "recebimentos_compra_all" ON recebimentos_compra;
CREATE POLICY "recebimentos_compra_all" ON recebimentos_compra
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- 3. RECEBIMENTO_ITENS – cada unidade / lote conferido via barcode
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS recebimento_itens (
    id                  UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    recebimento_id      UUID    NOT NULL REFERENCES recebimentos_compra(id) ON DELETE CASCADE,
    compra_id           UUID    NOT NULL REFERENCES compras(id) ON DELETE CASCADE,
    medicamento_id      UUID    NOT NULL REFERENCES medicamentos(id),
    barcode             TEXT,                -- código de barras lido, opcional
    lote                TEXT    NOT NULL,
    validade            DATE    NOT NULL,
    quantidade_recebida INT     NOT NULL DEFAULT 1 CHECK (quantidade_recebida > 0),
    status_item         TEXT    NOT NULL DEFAULT 'CONFERIDO'
                        CHECK (status_item IN ('CONFERIDO','AVARIA','PENDENTE')),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rec_itens_recebimento ON recebimento_itens (recebimento_id);
CREATE INDEX IF NOT EXISTS idx_rec_itens_compra      ON recebimento_itens (compra_id);
CREATE INDEX IF NOT EXISTS idx_rec_itens_status      ON recebimento_itens (status_item);

ALTER TABLE recebimento_itens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "recebimento_itens_all" ON recebimento_itens;
CREATE POLICY "recebimento_itens_all" ON recebimento_itens
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- 4. AVARIAS_RECEBIMENTO (tabela operacional, independente da NF)
--    Observação: a migração 004 já criou avarias_recebimento vinculada a
--    nf_itens. Esta tabela é a versão operacional para o fluxo de barcode.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS avarias_recebimento_op (
    id               UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    recebimento_id   UUID    NOT NULL REFERENCES recebimentos_compra(id) ON DELETE CASCADE,
    item_id          UUID    NOT NULL REFERENCES recebimento_itens(id) ON DELETE CASCADE,
    quantidade_avaria INT    NOT NULL CHECK (quantidade_avaria > 0),
    observacao       TEXT,
    foto_url         TEXT,
    status           TEXT    NOT NULL DEFAULT 'PENDENTE'
                     CHECK (status IN ('PENDENTE','RESOLVIDO','DESCARTADO')),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_avarias_op_recebimento ON avarias_recebimento_op (recebimento_id);
CREATE INDEX IF NOT EXISTS idx_avarias_op_item        ON avarias_recebimento_op (item_id);

ALTER TABLE avarias_recebimento_op ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "avarias_op_all" ON avarias_recebimento_op;
CREATE POLICY "avarias_op_all" ON avarias_recebimento_op
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- 5. Coluna origem_compra_id em LOTES (se não existir)
-- ---------------------------------------------------------------------------

ALTER TABLE lotes
    ADD COLUMN IF NOT EXISTS origem_compra_id UUID REFERENCES compras(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_lotes_origem_compra ON lotes (origem_compra_id)
    WHERE origem_compra_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 6. Trigger updated_at para recebimentos_compra
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION set_updated_at_recebimento()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_recebimentos_updated_at ON recebimentos_compra;
CREATE TRIGGER trg_recebimentos_updated_at
    BEFORE UPDATE ON recebimentos_compra
    FOR EACH ROW EXECUTE FUNCTION set_updated_at_recebimento();

-- ---------------------------------------------------------------------------
-- 7. VIEW – dashboard de recebimentos operacionais
-- ---------------------------------------------------------------------------

CREATE OR REPLACE VIEW v_recebimentos_dashboard AS
SELECT
    rc.id,
    rc.status,
    rc.created_at,
    c.numero_po,
    c.id AS compra_id,
    c.status_recebimento,
    f.razao_social AS fornecedor,
    m.nome         AS medicamento,
    COUNT(ri.id)                                        AS total_itens,
    SUM(ri.quantidade_recebida)                         AS qtd_total,
    COUNT(ri.id) FILTER (WHERE ri.status_item = 'AVARIA') AS itens_avariados
FROM recebimentos_compra rc
JOIN compras           c  ON c.id  = rc.compra_id
JOIN fornecedores      f  ON f.id  = c.fornecedor_id
JOIN medicamentos      m  ON m.id  = c.medicamento_id
LEFT JOIN recebimento_itens ri ON ri.recebimento_id = rc.id
GROUP BY rc.id, rc.status, rc.created_at, c.numero_po, c.id, c.status_recebimento, f.razao_social, m.nome;

-- ---------------------------------------------------------------------------
-- FIM DA MIGRAÇÃO 005
-- ---------------------------------------------------------------------------
