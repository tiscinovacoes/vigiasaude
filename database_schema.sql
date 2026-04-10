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
    codigo TEXT,                            -- SKU / código interno
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
    quantidade_dispensada_padrao INTEGER DEFAULT 1, -- Unidades por dispensação
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
    dados_anteriores JSONB,
    dados_novos JSONB,
    metadados JSONB,
    severidade TEXT DEFAULT 'Alta',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS para Imutabilidade (WORM)
ALTER TABLE logs_auditoria ENABLE ROW LEVEL SECURITY;

-- Política: Impede qualquer UPDATE ou DELETE (apenas INSERT é permitido)
CREATE POLICY "Logs de auditoria são imutáveis"
ON logs_auditoria FOR ALL
TO authenticated
USING (true)
WITH CHECK (false); -- Impede qualquer modificação pós-insert

-- GARANTIA WORM EXTRA: Trigger de Nível de Banco (Impede deleção mesmo por superusuário se não desabilitado)
CREATE OR REPLACE FUNCTION fn_prevent_audit_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Exclusão ou alteração física de registros de auditoria é PROIBIDA no Vigia Saúde (Padrão WORM).';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_audit_worm_protection
BEFORE DELETE OR UPDATE ON logs_auditoria
FOR EACH ROW EXECUTE FUNCTION fn_prevent_audit_modification();

-- Observer Pattern: Função genérica de auditoria
CREATE OR REPLACE FUNCTION fn_audit_observer()
RETURNS TRIGGER AS $$
DECLARE
    v_old JSONB := NULL;
    v_new JSONB := NULL;
    v_user TEXT := 'System';
BEGIN
    -- Captura o usuário do contexto Supabase se disponível
    v_user := COALESCE(auth.jwt() ->> 'email', 'System');

    IF (TG_OP = 'UPDATE') THEN
        v_old := to_jsonb(OLD);
        v_new := to_jsonb(NEW);
    ELSIF (TG_OP = 'DELETE') THEN
        v_old := to_jsonb(OLD);
    ELSIF (TG_OP = 'INSERT') THEN
        v_new := to_jsonb(NEW);
    END IF;

    INSERT INTO logs_auditoria (
        ator, 
        acao, 
        tabela_afetada, 
        dados_anteriores, 
        dados_novos, 
        metadados, 
        severidade
    )
    VALUES (
        v_user, 
        TG_OP, 
        TG_TABLE_NAME, 
        v_old, 
        v_new, 
        jsonb_build_object('trigger', TG_NAME), 
        'Alta'
    );

    IF (TG_OP = 'DELETE') THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ativar Observer nas tabelas críticas
CREATE TRIGGER trg_audit_medicamentos
AFTER INSERT OR UPDATE OR DELETE ON medicamentos
FOR EACH ROW EXECUTE FUNCTION fn_audit_observer();

CREATE TRIGGER trg_audit_lotes
AFTER INSERT OR UPDATE OR DELETE ON lotes
FOR EACH ROW EXECUTE FUNCTION fn_audit_observer();

CREATE TRIGGER trg_audit_unidades_serializadas
AFTER INSERT OR UPDATE OR DELETE ON unidades_serializadas
FOR EACH ROW EXECUTE FUNCTION fn_audit_observer();

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

-- =============================================================================
-- E. INTELIGÊNCIA LOGÍSTICA (DEMAND PLANNING)
-- =============================================================================

-- View que calcula o consumo diário médio baseado em prescrições ativas
CREATE OR REPLACE VIEW vw_consumo_diario_medicamentos AS
SELECT 
    medicamento_id,
    SUM(quantidade_dispensada_padrao::DECIMAL / NULLIF(frequencia_entrega, 0)) as consumo_diario_estimado
FROM prescricoes
WHERE data_vencimento_receita >= CURRENT_DATE
GROUP BY medicamento_id;

-- View de Previsão de Ruptura (Stockout Risk)
CREATE OR REPLACE VIEW vw_previsao_ruptura AS
WITH estoque_total AS (
    SELECT 
        medicamento_id,
        SUM(quantidade_disponivel) as total_em_estoque
    FROM lotes
    WHERE status = 'ATIVO'
      AND data_validade >= CURRENT_DATE
    GROUP BY medicamento_id
)
SELECT 
    m.id as medicamento_id,
    m.nome as medicamento_nome,
    COALESCE(e.total_em_estoque, 0) as estoque_atual,
    COALESCE(c.consumo_diario_estimado, 0) as consumo_diario,
    m.estoque_minimo,
    CASE 
        WHEN COALESCE(c.consumo_diario_estimado, 0) = 0 THEN 999 -- Dias infinitos se não há consumo
        ELSE (COALESCE(e.total_em_estoque, 0) / c.consumo_diario_estimado)::INTEGER
    END as dias_restantes_estoque,
    CASE 
        WHEN COALESCE(e.total_em_estoque, 0) = 0 THEN 'CRÍTICO (ZERADO)'
        WHEN COALESCE(c.consumo_diario_estimado, 0) > 0 AND (COALESCE(e.total_em_estoque, 0) / c.consumo_diario_estimado) <= 7 THEN 'ALERTA (MENOS DE 7 DIAS)'
        WHEN COALESCE(e.total_em_estoque, 0) < m.estoque_minimo THEN 'ABAIXO DO MÍNIMO'
        ELSE 'SAUDÁVEL'
    END as status_logistico
FROM medicamentos m
LEFT JOIN estoque_total e ON m.id = e.medicamento_id
LEFT JOIN vw_consumo_diario_medicamentos c ON m.id = c.medicamento_id;

-- =============================================================================
-- F. RESILIÊNCIA E AUTOMAÇÃO DE COMPRAS
-- =============================================================================

CREATE TABLE IF NOT EXISTS notificacoes_fila (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    paciente_id UUID REFERENCES pacientes(id),
    mensagem TEXT NOT NULL,
    canal TEXT DEFAULT 'WHATSAPP',
    status TEXT CHECK (status IN ('PENDENTE', 'ENVIADO', 'FALHA', 'AGUARDANDO_API')) DEFAULT 'PENDENTE',
    log_erro TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS compras_registro (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    medicamento_id UUID REFERENCES medicamentos(id),
    fornecedor_id UUID REFERENCES fornecedores(id),
    quantidade INTEGER NOT NULL,
    valor_unitario DECIMAL(10,2),
    status TEXT CHECK (status IN ('SUGERIDO', 'SOLICITADO', 'EMPENHADO', 'ENTREGUE', 'DESCARTADO')) DEFAULT 'SUGERIDO',
    motivo_sugestao TEXT,
    data_solicitacao DATE,
    data_entrega_prevista DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Função para gerar sugestão de compra baseada em ruptura
CREATE OR REPLACE FUNCTION fn_trigger_sugestao_compra()
RETURNS TRIGGER AS $$
DECLARE
    v_status_logistico TEXT;
    v_consumo_diario DECIMAL;
    v_lead_time INTEGER;
    v_qtd_sugerida INTEGER;
    v_fornecedor_id UUID;
BEGIN
    -- Busca o status atual na view de ruptura
    SELECT status_logistico, consumo_diario 
    INTO v_status_logistico, v_consumo_diario
    FROM vw_previsao_ruptura 
    WHERE medicamento_id = NEW.medicamento_id;

    -- Se o status for ALERTA ou CRÍTICO, e não houver sugestão PENDENTE/SUGERIDA ativa
    IF v_status_logistico IN ('CRÍTICO (ZERADO)', 'ALERTA (MENOS DE 7 DIAS)') THEN
        IF NOT EXISTS (
            SELECT 1 FROM compras_registro 
            WHERE medicamento_id = NEW.medicamento_id 
            AND status IN ('SUGERIDO', 'SOLICITADO')
        ) THEN
            -- Seleciona o melhor fornecedor (maior pontualidade)
            SELECT id, lead_time_medio INTO v_fornecedor_id, v_lead_time
            FROM fornecedores 
            ORDER BY pontualidade_percentual DESC 
            LIMIT 1;

            -- Cálculo: (Lead Time + 15 dias de segurança) * Consumo Diário
            v_qtd_sugerida := CEIL((COALESCE(v_lead_time, 15) + 15) * v_consumo_diario);

            IF v_qtd_sugerida > 0 THEN
                INSERT INTO compras_registro (medicamento_id, fornecedor_id, quantidade, motivo_sugestao, status)
                VALUES (NEW.medicamento_id, v_fornecedor_id, v_qtd_sugerida, 'Ruptura Detectada: ' || v_status_logistico, 'SUGERIDO');
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Gatilho ativado sempre que o estoque de um lote é alterado
CREATE TRIGGER trg_verificar_ruptura_compra
AFTER UPDATE OF quantidade_disponivel ON lotes
FOR EACH ROW
EXECUTE FUNCTION fn_trigger_sugestao_compra();
