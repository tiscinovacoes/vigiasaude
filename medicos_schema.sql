-- ============================================================
-- TABELA: medicos
-- Cadastro de médicos com CRM e documento vinculado
-- ============================================================

CREATE TABLE IF NOT EXISTS medicos (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  crm             text NOT NULL,                  -- Ex: "CRM/SP 123456"
  nome            text NOT NULL,
  especialidade   text,                           -- Opcional
  email           text,
  telefone        text,
  documento_url   text,                           -- URL pública do arquivo no storage
  documento_nome  text,                           -- Nome original do arquivo
  ativo           boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Índice para busca rápida por CRM e nome
CREATE INDEX IF NOT EXISTS idx_medicos_crm  ON medicos (crm);
CREATE INDEX IF NOT EXISTS idx_medicos_nome ON medicos (lower(nome));

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_medicos_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_medicos_updated_at ON medicos;
CREATE TRIGGER trg_medicos_updated_at
  BEFORE UPDATE ON medicos
  FOR EACH ROW EXECUTE FUNCTION update_medicos_updated_at();

-- RLS
ALTER TABLE medicos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "medicos_all_authenticated" ON medicos;
CREATE POLICY "medicos_all_authenticated"
  ON medicos FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================================
-- STORAGE BUCKET: documentos-medicos
-- ============================================================
-- Execute no Supabase Dashboard > Storage > New Bucket:
--   nome: documentos-medicos
--   público: TRUE (para que a URL gerada funcione diretamente)
--
-- Ou via SQL (requer extensão pgsodium habilitada):
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('documentos-medicos', 'documentos-medicos', true)
-- ON CONFLICT DO NOTHING;
