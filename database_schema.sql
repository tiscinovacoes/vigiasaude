-- #############################################################################
-- ARQUITETURA DE BANCO DE DADOS VIGIA SAÚDE - MUNICIPIO TESTE/MS
-- Engenharia de Dados Sênior | PostgreSQL / Supabase
-- #############################################################################

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- A. GESTÃO DE UNIDADES E FORNECEDORES (INFRAESTRUTURA)
-- =============================================================================

CREATE TABLE IF NOT EXISTS unidades_saude (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT NOT NULL,
    tipo TEXT CHECK (tipo IN ('CD', 'UBS', 'HOSPITAL')) NOT NULL,
    geolocalizacao JSONB, -- { "lat": -22.22, "lng": -54.81 }
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fornecedores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cnpj TEXT UNIQUE NOT NULL,
    razao_social TEXT NOT NULL,
    pontualidade_percentual DECIMAL(5,2) DEFAULT 100.00,
    lead_time_medio INTEGER DEFAULT 0, -- em dias
    valor_total_contratado DECIMAL(15,2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- B. CATÁLOGO E ESTOQUE (INTELIGÊNCIA FARMACÊUTICA)
-- =============================================================================

CREATE TABLE IF NOT EXISTS medicamentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT NOT NULL,
    dosagem TEXT,
    estoque_minimo INTEGER DEFAULT 0,
    preco_teto_cmed DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo_lote_fabricante TEXT NOT NULL,
    medicamento_id UUID REFERENCES medicamentos(id) ON DELETE CASCADE,
    data_validade DATE NOT NULL,
    quantidade_disponivel INTEGER DEFAULT 0,
    quantidade_reservada INTEGER DEFAULT 0,
    custo_unitario_compra DECIMAL(10,2) NOT NULL,
    status TEXT DEFAULT 'ATIVO' CHECK (status IN ('ATIVO', 'RECALL', 'BLOQUEADO', 'VENCIDO')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- C. PACIENTES E PRONTUÁRIO LOGÍSTICO
-- =============================================================================

CREATE TABLE IF NOT EXISTS pacientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cpf TEXT UNIQUE NOT NULL,
    nome_completo TEXT NOT NULL,
    endereco_completo TEXT NOT NULL,
    geolocalizacao JSONB,
    janela_entrega TEXT, -- Ex: "Manhã (08:00 - 12:00)"
    telefone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS prescricoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    paciente_id UUID REFERENCES pacientes(id) ON DELETE CASCADE,
    medicamento_id UUID REFERENCES medicamentos(id),
    data_vencimento_receita DATE NOT NULL,
    frequencia_entrega INTEGER DEFAULT 30, -- em dias
    dosagem_prescrita TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- D. OPERAÇÃO LOGÍSTICA E RASTREABILIDADE
-- =============================================================================

CREATE TABLE IF NOT EXISTS motoristas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cnh TEXT UNIQUE NOT NULL,
    nome TEXT NOT NULL,
    placa_veiculo TEXT NOT NULL,
    status_atividade TEXT CHECK (status_atividade IN ('ATIVO', 'INATIVO', 'EM_ROTA')) DEFAULT 'ATIVO',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS entregas_logistica (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dispense_id TEXT UNIQUE NOT NULL, -- UUID de negócio
    paciente_id UUID REFERENCES pacientes(id),
    motorista_id UUID REFERENCES motoristas(id),
    status_entrega TEXT CHECK (status_entrega IN ('ENTREGUE', 'EM_ROTA', 'FALHA', 'PENDENTE')) DEFAULT 'PENDENTE',
    foto_comprovante_url TEXT,
    assinatura_digital_url TEXT,
    lat_entrega DECIMAL(10,8),
    lng_entrega DECIMAL(11,8),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Nível granular máximo de rastreabilidade (Serial Number)
CREATE TYPE status_unidade_enum AS ENUM ('ESTOQUE', 'EM_TRANSPORTE', 'ENTREGUE', 'BLOQUEADO', 'EXTRAVIADO', 'DESCARTE');

CREATE TABLE IF NOT EXISTS unidades_serializadas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    serial_number VARCHAR(50) UNIQUE NOT NULL,
    lote_id UUID NOT NULL REFERENCES lotes(id) ON DELETE CASCADE,
    entrega_id UUID REFERENCES entregas_logistica(id),
    paciente_id UUID REFERENCES pacientes(id),
    status_unidade status_unidade_enum DEFAULT 'ESTOQUE',
    ultima_temperatura_registrada DECIMAL(4,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- 3. LÓGICA DE AUDITORIA E VIEWS
-- =============================================================================

CREATE TABLE IF NOT EXISTS logs_auditoria (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID, -- Referência ao auth.users do Supabase se necessário
    ator TEXT NOT NULL DEFAULT 'System',
    acao TEXT NOT NULL,
    tabela_afetada TEXT NOT NULL,
    metadados JSONB,
    severidade TEXT DEFAULT 'Alta',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- View para Recall Instantâneo
CREATE OR REPLACE VIEW vw_relatorio_recall AS
SELECT 
    l.codigo_lote_fabricante,
    m.nome AS medicamento_nome,
    p.nome_completo AS paciente_nome,
    p.telefone AS paciente_telefone,
    p.endereco_completo,
    us.serial_number,
    el.status_entrega,
    el.created_at AS data_entrega
FROM unidades_serializadas us
JOIN lotes l ON us.lote_id = l.id
JOIN medicamentos m ON l.medicamento_id = m.id
JOIN entregas_logistica el ON us.entrega_id = el.id
JOIN pacientes p ON el.paciente_id = p.id;

-- Gatilho de Bloqueio em Cascata (Recall)
CREATE OR REPLACE FUNCTION trg_bloqueio_recall_em_cascata()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'RECALL' AND OLD.status <> 'RECALL' THEN
        UPDATE unidades_serializadas
        SET status_unidade = 'BLOQUEADO'
        WHERE lote_id = NEW.id AND status_unidade = 'ESTOQUE';
        
        INSERT INTO logs_auditoria (acao, tabela_afetada, metadados, severidade)
        VALUES ('BLOQUEIO_CASCATA_RECALL', 'unidades_serializadas', jsonb_build_object('lote_id', NEW.id, 'serial_number_count', 'ALL_IN_STOCK'), 'Crítica');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_lote_recall_cascata
AFTER UPDATE ON lotes
FOR EACH ROW EXECUTE FUNCTION trg_bloqueio_recall_em_cascata();

-- Validação FEFO no Insert/Update de Unidades Serializadas
CREATE OR REPLACE FUNCTION validate_fefo_granular()
RETURNS TRIGGER AS $$
BEGIN
    DECLARE
        lote_mais_antigo_id UUID;
        validade_mais_antiga DATE;
        validade_atual DATE;
    BEGIN
        -- Ignora se estiver apenas movendo para BLOQUEADO ou DESCARTE
        IF NEW.status_unidade NOT IN ('EM_TRANSPORTE', 'ENTREGUE') THEN
            RETURN NEW;
        END IF;

        -- Busca a validade do lote atual
        SELECT data_validade INTO validade_atual FROM lotes WHERE id = NEW.lote_id;

        -- Busca a validade mais antiga disponível para este medicamento
        SELECT l.id, l.data_validade INTO lote_mais_antigo_id, validade_mais_antiga
        FROM lotes l
        JOIN medicamentos m ON l.medicamento_id = m.id
        WHERE m.id = (SELECT medicamento_id FROM lotes WHERE id = NEW.lote_id)
          AND l.quantidade_disponivel > 0
          AND l.status = 'ATIVO'
        ORDER BY l.data_validade ASC
        LIMIT 1;

        IF validade_atual > validade_mais_antiga THEN
            -- Verifica se existe uma justificativa recente para bypassar o FEFO
            IF NOT EXISTS (
                SELECT 1 FROM logs_auditoria 
                WHERE acao = 'JUSTIFICATIVA_OPERACIONAL' 
                AND metadados->>'motivo' = 'FEFO_BYPASS'
                AND created_at > NOW() - INTERVAL '10 minutes'
            ) THEN
                RAISE EXCEPTION '⚠️ Violação de Regra FEFO: O lote selecionado (Venc: %) não é o mais antigo disponível (Venc: %). Registre uma justificativa técnica primeiro.', validade_atual, validade_mais_antiga;
            END IF;
        END IF;
        
        RETURN NEW;
    END;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_fefo_sn
BEFORE UPDATE ON unidades_serializadas
FOR EACH ROW WHEN (NEW.status_unidade = 'EM_TRANSPORTE' AND OLD.status_unidade = 'ESTOQUE')
EXECUTE FUNCTION validate_fefo_granular();

-- Função de Rastreio de Pacientes por Lote (Recall)
CREATE OR REPLACE FUNCTION fn_rastrear_pacientes_por_lote(batch_codigo TEXT)
RETURNS TABLE (
    paciente_nome TEXT,
    paciente_cpf TEXT,
    paciente_telefone TEXT,
    serial_number VARCHAR(50),
    data_entrega TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.nome_completo,
        p.cpf,
        p.telefone,
        us.serial_number,
        us.updated_at
    FROM unidades_serializadas us
    JOIN lotes l ON us.lote_id = l.id
    JOIN pacientes p ON us.paciente_id = p.id
    WHERE l.codigo_lote_fabricante = batch_codigo
      AND us.status_unidade = 'ENTREGUE';
END;
$$ LANGUAGE plpgsql;

-- Check de Segurança: Entrega Concluída exige Foto/Assinatura/GPS
ALTER TABLE entregas_logistica DROP CONSTRAINT IF EXISTS chk_entrega_completa;
ALTER TABLE entregas_logistica ADD CONSTRAINT chk_entrega_completa
CHECK (
    (status_entrega <> 'ENTREGUE') OR 
    (status_entrega = 'ENTREGUE' AND foto_comprovante_url IS NOT NULL AND assinatura_digital_url IS NOT NULL AND lat_entrega IS NOT NULL AND lng_entrega IS NOT NULL)
);

-- =============================================================================
-- ÍNDICES PARA ALTA PERFORMANCE
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_lotes_validade ON lotes(data_validade);
CREATE INDEX IF NOT EXISTS idx_sn_lookup ON unidades_serializadas(serial_number);
CREATE INDEX IF NOT EXISTS idx_sn_lote_status ON unidades_serializadas(lote_id, status_unidade);
CREATE INDEX IF NOT EXISTS idx_entregas_status ON entregas_logistica(status_entrega);
CREATE INDEX IF NOT EXISTS idx_pacientes_cpf ON pacientes(cpf);
