-- =============================================================================
-- receitas_medicas_schema.sql
-- Cria (ou recria) a tabela receitas_medicas com período de uso e frequência
-- Execute no Supabase SQL Editor
-- =============================================================================

-- Tipo de frequência padronizado
DO $$ BEGIN
  CREATE TYPE frequencia_medicamento AS ENUM (
    'UM_DIA',           -- 1 vez ao dia
    'DOIS_DIA',         -- 2 vezes ao dia
    'TRES_DIA',         -- 3 vezes ao dia
    'QUATRO_DIA',       -- 4 vezes ao dia
    'UMA_SEMANA',       -- 1 vez na semana
    'DUAS_SEMANA',      -- 2 vezes na semana
    'QUINZENAL',        -- 1 vez a cada 15 dias
    'MENSAL',           -- 1 vez ao mês
    'OUTRO'             -- outro (descrever em observações)
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Tabela principal
CREATE TABLE IF NOT EXISTS receitas_medicas (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id         uuid        NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  medicamento_nome    text        NOT NULL,
  catmat_codigo_br    text,                          -- código BR selecionado no CATMAT
  data_inicio         date        NOT NULL,          -- início do uso
  data_fim            date,                          -- fim previsto (pode ser aberto)
  frequencia_uso      frequencia_medicamento NOT NULL DEFAULT 'UM_DIA',
  medico_nome         text,
  numero_receita      text,
  observacoes         text,
  arquivo_url         text,                          -- URL do arquivo no Supabase Storage
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- Índices de performance
CREATE INDEX IF NOT EXISTS receitas_medicas_paciente_idx ON receitas_medicas(paciente_id);
CREATE INDEX IF NOT EXISTS receitas_medicas_catmat_idx   ON receitas_medicas(catmat_codigo_br);

-- Trigger: atualiza updated_at
CREATE OR REPLACE FUNCTION touch_receitas_medicas()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
DROP TRIGGER IF EXISTS trg_receitas_updated ON receitas_medicas;
CREATE TRIGGER trg_receitas_updated
  BEFORE UPDATE ON receitas_medicas
  FOR EACH ROW EXECUTE FUNCTION touch_receitas_medicas();

-- RLS
ALTER TABLE receitas_medicas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "receitas_medicas_all" ON receitas_medicas;
CREATE POLICY "receitas_medicas_all" ON receitas_medicas
  USING (true) WITH CHECK (true);

-- Bucket para arquivos de receita (execute apenas uma vez)
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('receitas', 'receitas', false)
-- ON CONFLICT DO NOTHING;

-- =============================================================================
-- VIEW: métricas de estoque por receita ativa
-- Calcula: qtd/dia, dias restantes, próxima entrega, prazo de compra
-- =============================================================================
CREATE OR REPLACE VIEW v_receitas_metricas AS
SELECT
  r.id,
  r.paciente_id,
  r.medicamento_nome,
  r.catmat_codigo_br,
  r.data_inicio,
  r.data_fim,
  r.frequencia_uso,
  -- Consumo diário (unidades por dia)
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
  -- Duração total em dias
  CASE WHEN r.data_fim IS NOT NULL
    THEN (r.data_fim - r.data_inicio)
    ELSE NULL
  END AS duracao_dias,
  -- Quantidade total necessária
  CASE WHEN r.data_fim IS NOT NULL
    THEN CEIL(
      (r.data_fim - r.data_inicio) *
      CASE r.frequencia_uso
        WHEN 'UM_DIA'      THEN 1.0
        WHEN 'DOIS_DIA'    THEN 2.0
        WHEN 'TRES_DIA'    THEN 3.0
        WHEN 'QUATRO_DIA'  THEN 4.0
        WHEN 'UMA_SEMANA'  THEN 1.0 / 7.0
        WHEN 'DUAS_SEMANA' THEN 2.0 / 7.0
        WHEN 'QUINZENAL'   THEN 1.0 / 15.0
        WHEN 'MENSAL'      THEN 1.0 / 30.0
        ELSE 0
      END
    )
    ELSE NULL
  END AS qtd_total_necessaria,
  -- Data da próxima entrega (30 dias após início ou após última entrega)
  r.data_inicio + INTERVAL '30 days' AS proxima_entrega_estimada,
  -- Prazo para compra (lead time de 15 dias antes da próxima entrega)
  r.data_inicio + INTERVAL '15 days' AS prazo_compra_estimado,
  r.created_at
FROM receitas_medicas r
WHERE r.data_fim IS NULL OR r.data_fim >= CURRENT_DATE;
