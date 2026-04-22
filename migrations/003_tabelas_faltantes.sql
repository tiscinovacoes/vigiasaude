-- =============================================================================
-- MIGRAÇÃO 003 – Tabelas Faltantes no Supabase
-- Execute no Supabase SQL Editor → Run
-- Cria (se não existir): motoristas, entregas_logistica,
--                         medicos, receitas_medicas
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. MOTORISTAS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS motoristas (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cnh              TEXT UNIQUE NOT NULL,
    nome             TEXT NOT NULL,
    placa_veiculo    TEXT NOT NULL,
    status_atividade TEXT CHECK (status_atividade IN ('ATIVO', 'INATIVO', 'EM_ROTA')) DEFAULT 'ATIVO',
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_motoristas_nome ON motoristas (nome);

ALTER TABLE motoristas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "motoristas_all_authenticated" ON motoristas;
CREATE POLICY "motoristas_all_authenticated"
    ON motoristas FOR ALL
    TO authenticated
    USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- 2. ENTREGAS_LOGISTICA
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS entregas_logistica (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dispense_id           TEXT UNIQUE NOT NULL,             -- UUID de negócio
    paciente_id           UUID REFERENCES pacientes(id),
    motorista_id          UUID REFERENCES motoristas(id),
    status_entrega        TEXT CHECK (status_entrega IN ('ENTREGUE', 'EM_ROTA', 'FALHA', 'PENDENTE')) DEFAULT 'PENDENTE',
    foto_comprovante_url  TEXT,
    assinatura_digital_url TEXT,
    lat_entrega           DECIMAL(10,8),
    lng_entrega           DECIMAL(11,8),
    created_at            TIMESTAMPTZ DEFAULT NOW(),
    updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_entregas_status       ON entregas_logistica (status_entrega);
CREATE INDEX IF NOT EXISTS idx_entregas_motorista    ON entregas_logistica (motorista_id);
CREATE INDEX IF NOT EXISTS idx_entregas_paciente     ON entregas_logistica (paciente_id);

ALTER TABLE entregas_logistica ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "entregas_all_authenticated" ON entregas_logistica;
CREATE POLICY "entregas_all_authenticated"
    ON entregas_logistica FOR ALL
    TO authenticated
    USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- 3. MÉDICOS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS medicos (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    crm            TEXT NOT NULL,
    nome           TEXT NOT NULL,
    especialidade  TEXT,
    email          TEXT,
    telefone       TEXT,
    documento_url  TEXT,
    documento_nome TEXT,
    ativo          BOOLEAN NOT NULL DEFAULT true,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_medicos_crm  ON medicos (crm);
CREATE INDEX IF NOT EXISTS idx_medicos_nome ON medicos (lower(nome));

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_medicos_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_medicos_updated_at ON medicos;
CREATE TRIGGER trg_medicos_updated_at
    BEFORE UPDATE ON medicos
    FOR EACH ROW EXECUTE FUNCTION update_medicos_updated_at();

ALTER TABLE medicos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "medicos_all_authenticated" ON medicos;
CREATE POLICY "medicos_all_authenticated"
    ON medicos FOR ALL
    TO authenticated
    USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- 4. RECEITAS MÉDICAS
-- ---------------------------------------------------------------------------

-- Enum de frequência (idempotente)
DO $$ BEGIN
    CREATE TYPE frequencia_medicamento AS ENUM (
        'UM_DIA', 'DOIS_DIA', 'TRES_DIA', 'QUATRO_DIA',
        'UMA_SEMANA', 'DUAS_SEMANA', 'QUINZENAL', 'MENSAL', 'OUTRO'
    );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS receitas_medicas (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    paciente_id      UUID        NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
    medicamento_nome TEXT        NOT NULL,
    catmat_codigo_br TEXT,
    data_inicio      DATE        NOT NULL,
    data_fim         DATE,
    frequencia_uso   frequencia_medicamento NOT NULL DEFAULT 'UM_DIA',
    medico_nome      TEXT,
    numero_receita   TEXT,
    observacoes      TEXT,
    arquivo_url      TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_receitas_paciente ON receitas_medicas (paciente_id);
CREATE INDEX IF NOT EXISTS idx_receitas_catmat   ON receitas_medicas (catmat_codigo_br);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION touch_receitas_medicas()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_receitas_updated ON receitas_medicas;
CREATE TRIGGER trg_receitas_updated
    BEFORE UPDATE ON receitas_medicas
    FOR EACH ROW EXECUTE FUNCTION touch_receitas_medicas();

ALTER TABLE receitas_medicas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "receitas_medicas_all" ON receitas_medicas;
CREATE POLICY "receitas_medicas_all" ON receitas_medicas
    FOR ALL TO authenticated
    USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- 5. VIEW – Métricas de receitas ativas
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_receitas_metricas AS
SELECT
    r.id,
    r.paciente_id,
    r.medicamento_nome,
    r.catmat_codigo_br,
    r.data_inicio,
    r.data_fim,
    r.frequencia_uso,
    CASE r.frequencia_uso
        WHEN 'UM_DIA'      THEN 1.0
        WHEN 'DOIS_DIA'    THEN 2.0
        WHEN 'TRES_DIA'    THEN 3.0
        WHEN 'QUATRO_DIA'  THEN 4.0
        WHEN 'UMA_SEMANA'  THEN 1.0 / 7.0
        WHEN 'DUAS_SEMANA' THEN 2.0 / 7.0
        WHEN 'QUINZENAL'   THEN 1.0 / 15.0
        WHEN 'MENSAL'      THEN 1.0 / 30.0
        ELSE NULL
    END AS consumo_diario,
    CASE WHEN r.data_fim IS NOT NULL
        THEN (r.data_fim - r.data_inicio)
        ELSE NULL
    END AS duracao_dias,
    r.data_inicio + INTERVAL '30 days' AS proxima_entrega_estimada,
    r.data_inicio + INTERVAL '15 days' AS prazo_compra_estimado,
    r.created_at
FROM receitas_medicas r
WHERE r.data_fim IS NULL OR r.data_fim >= CURRENT_DATE;

-- ---------------------------------------------------------------------------
-- FIM DA MIGRAÇÃO 003
-- ---------------------------------------------------------------------------
