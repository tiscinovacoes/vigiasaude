-- =============================================================================
-- AUTH & RLS SCHEMA - VIGIA SAÚDE
-- Controle de Acesso Baseado em Perfis (RBAC) e Segurança de Colunas
-- =============================================================================

-- 1. Tabela de Perfis
CREATE TABLE IF NOT EXISTS perfis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT UNIQUE NOT NULL, -- 'ADMIN', 'OPERADOR', 'FARMACEUTICO'
    descricao TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Vinculação Usuário -> Perfil
CREATE TABLE IF NOT EXISTS usuarios_sistema (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    perfil_id UUID REFERENCES perfis(id),
    cpf TEXT UNIQUE,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Habilitar RLS na tabela de lotes
ALTER TABLE lotes ENABLE ROW LEVEL SECURITY;

-- 4. Função para verificar se o usuário é Admin
CREATE OR REPLACE FUNCTION fn_is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM usuarios_sistema us
        JOIN perfis p ON us.perfil_id = p.id
        WHERE us.auth_user_id = auth.uid()
          AND p.slug = 'ADMIN'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Policies de RLS para Lotes
-- Operadores e Farmacêuticos podem ver os lotes, mas a lógica de coluna será na View
CREATE POLICY "Lotes são visíveis por usuários autenticados"
ON lotes FOR SELECT
TO authenticated
USING (true);

-- 6. View Segura para Proteção de Custos (Column-Level Security)
-- Esta view deve ser usada pela aplicação para garantir que o custo não vaze
CREATE OR REPLACE VIEW vw_lotes_protegidos AS
SELECT 
    id,
    codigo_lote_fabricante,
    medicamento_id,
    data_validade,
    quantidade_disponivel,
    quantidade_reservada,
    status,
    CASE 
        WHEN fn_is_admin() THEN custo_unitario_compra 
        ELSE NULL 
    END AS custo_unitario_compra,
    created_at,
    updated_at
FROM lotes;

-- Garantir permissões na View
GRANT SELECT ON vw_lotes_protegidos TO authenticated;
