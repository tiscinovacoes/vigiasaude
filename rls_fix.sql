-- =============================================================================
-- PATCH RLS - Vigia Saúde
-- Corrige políticas de Row Level Security para permitir operações CRUD
-- pelos usuários autenticados em todas as tabelas operacionais.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 0. ADICIONAR COLUNA 'codigo' EM MEDICAMENTOS (se não existir)
-- Referenciada pelo app mas ausente no schema original.
-- -----------------------------------------------------------------------------
ALTER TABLE medicamentos ADD COLUMN IF NOT EXISTS codigo TEXT;

-- -----------------------------------------------------------------------------
-- 1. CORRIGIR logs_auditoria
-- O `WITH CHECK (false)` bloqueia INSERTs. A intenção é bloquear UPDATE/DELETE,
-- não INSERT. Precisamos recriar a policy corretamente.
-- -----------------------------------------------------------------------------

-- Remove a policy incorreta
DROP POLICY IF EXISTS "Logs de auditoria são imutáveis" ON logs_auditoria;

-- Nova policy: permite apenas SELECT e INSERT (não UPDATE/DELETE = comportamento WORM)
CREATE POLICY "Logs: SELECT permitido"
ON logs_auditoria FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Logs: INSERT permitido (WORM)"
ON logs_auditoria FOR INSERT
TO authenticated
WITH CHECK (true);

-- UPDATE e DELETE ficam sem policy = bloqueados por padrão (RLS WORM garantido)

-- -----------------------------------------------------------------------------
-- 2. HABILITAR RLS e criar policies em PACIENTES
-- -----------------------------------------------------------------------------
ALTER TABLE pacientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pacientes: SELECT por autenticados"
ON pacientes FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Pacientes: INSERT por autenticados"
ON pacientes FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Pacientes: UPDATE por autenticados"
ON pacientes FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- 3. HABILITAR RLS e criar policies em FORNECEDORES
-- -----------------------------------------------------------------------------
ALTER TABLE fornecedores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Fornecedores: SELECT por autenticados"
ON fornecedores FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Fornecedores: INSERT por autenticados"
ON fornecedores FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Fornecedores: UPDATE por autenticados"
ON fornecedores FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- 4. HABILITAR RLS e criar policies em MEDICAMENTOS
-- -----------------------------------------------------------------------------
ALTER TABLE medicamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Medicamentos: SELECT por autenticados"
ON medicamentos FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Medicamentos: INSERT/UPDATE apenas ADMIN"
ON medicamentos FOR INSERT
TO authenticated
WITH CHECK (fn_is_admin());

CREATE POLICY "Medicamentos: UPDATE apenas ADMIN"
ON medicamentos FOR UPDATE
TO authenticated
USING (fn_is_admin())
WITH CHECK (fn_is_admin());

-- -----------------------------------------------------------------------------
-- 5. POLICIES para LOTES (complementar ao auth_schema.sql)
-- Já tem SELECT. Adicionar INSERT/UPDATE para autenticados.
-- -----------------------------------------------------------------------------
CREATE POLICY "Lotes: INSERT por autenticados"
ON lotes FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Lotes: UPDATE por autenticados"
ON lotes FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- 6. HABILITAR RLS em COMPRAS_REGISTRO
-- -----------------------------------------------------------------------------
ALTER TABLE compras_registro ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Compras: SELECT por autenticados"
ON compras_registro FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Compras: INSERT por autenticados"
ON compras_registro FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Compras: UPDATE por autenticados"
ON compras_registro FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- 7. HABILITAR RLS em ENTREGAS_LOGISTICA
-- -----------------------------------------------------------------------------
ALTER TABLE entregas_logistica ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Entregas: SELECT por autenticados"
ON entregas_logistica FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Entregas: INSERT por autenticados"
ON entregas_logistica FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Entregas: UPDATE por autenticados"
ON entregas_logistica FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- 8. HABILITAR RLS em NOTIFICACOES_FILA
-- -----------------------------------------------------------------------------
ALTER TABLE notificacoes_fila ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Notificacoes: SELECT por autenticados"
ON notificacoes_fila FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Notificacoes: INSERT por autenticados"
ON notificacoes_fila FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Notificacoes: UPDATE por autenticados"
ON notificacoes_fila FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- 9. HABILITAR RLS em UNIDADES_SERIALIZADAS
-- -----------------------------------------------------------------------------
ALTER TABLE unidades_serializadas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Unidades: SELECT por autenticados"
ON unidades_serializadas FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Unidades: INSERT por autenticados"
ON unidades_serializadas FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Unidades: UPDATE por autenticados"
ON unidades_serializadas FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- 10. HABILITAR RLS em USUARIOS_SISTEMA e PERFIS
-- -----------------------------------------------------------------------------
ALTER TABLE usuarios_sistema ENABLE ROW LEVEL SECURITY;

CREATE POLICY "UsuariosSistema: SELECT próprio usuário"
ON usuarios_sistema FOR SELECT
TO authenticated
USING (auth_user_id = auth.uid() OR fn_is_admin());

CREATE POLICY "UsuariosSistema: INSERT apenas ADMIN"
ON usuarios_sistema FOR INSERT
TO authenticated
WITH CHECK (fn_is_admin());

ALTER TABLE perfis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Perfis: SELECT por autenticados"
ON perfis FOR SELECT
TO authenticated
USING (true);
