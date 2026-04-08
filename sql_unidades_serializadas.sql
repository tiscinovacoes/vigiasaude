-- #############################################################################
-- SCRIPT DE INFRAESTRUTURA: UNIDADES SERIALIZADAS (S/N)
-- Vigia Saúde - Municipio Teste/MS
-- #############################################################################

-- 1. Criação do Tipo ENUM para Status de Unidade
DO $$ BEGIN
    CREATE TYPE status_unidade_enum AS ENUM (
        'ESTOQUE', 'EM_TRANSPORTE', 'ENTREGUE', 'BLOQUEADO', 'EXTRAVIADO', 'DESCARTE'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Criação da Tabela unidades_serializadas
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

-- 3. Trigger de Bloqueio em Cascata (Recall)
-- Quando um lote entra em RECALL, todas as unidades em estoque são bloqueadas.
CREATE OR REPLACE FUNCTION trg_bloqueio_recall_em_cascata()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'RECALL' AND OLD.status <> 'RECALL' THEN
        UPDATE unidades_serializadas
        SET status_unidade = 'BLOQUEADO'
        WHERE lote_id = NEW.id AND status_unidade = 'ESTOQUE';
        
        -- Log de Auditoria WORM
        INSERT INTO logs_auditoria (acao, tabela_afetada, metadados, severidade)
        VALUES (
            'BLOQUEIO_CASCATA_RECALL', 
            'unidades_serializadas', 
            jsonb_build_object('lote_id', NEW.id, 'lote_codigo', NEW.codigo_lote_fabricante), 
            'Crítica'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_lote_recall_cascata ON lotes;
CREATE TRIGGER trg_lote_recall_cascata
AFTER UPDATE ON lotes
FOR EACH ROW EXECUTE FUNCTION trg_bloqueio_recall_em_cascata();

-- 4. Gatilho de Validação FEFO (Hard Rule com Justificativa)
CREATE OR REPLACE FUNCTION validate_fefo_granular()
RETURNS TRIGGER AS $$
DECLARE
    validade_atual DATE;
    validade_mais_antiga DATE;
BEGIN
    -- Só valida na saída para transporte ou entrega direta
    IF NEW.status_unidade NOT IN ('EM_TRANSPORTE', 'ENTREGUE') THEN
        RETURN NEW;
    END IF;

    -- Busca validade do lote atual
    SELECT data_validade INTO validade_atual FROM lotes WHERE id = NEW.lote_id;

    -- Busca a validade mais antiga disponível para o mesmo medicamento
    SELECT MIN(l.data_validade) INTO validade_mais_antiga
    FROM lotes l
    WHERE l.medicamento_id = (SELECT medicamento_id FROM lotes WHERE id = NEW.lote_id)
      AND l.quantidade_disponivel > 0
      AND l.status = 'ATIVO';

    IF validade_atual > validade_mais_antiga THEN
        -- Verifica se há justificativa registrada nos últimos 10 minutos
        IF NOT EXISTS (
            SELECT 1 FROM logs_auditoria 
            WHERE acao = 'JUSTIFICATIVA_OPERACIONAL' 
            AND metadados->>'motivo' = 'FEFO_BYPASS'
            AND created_at > NOW() - INTERVAL '10 minutes'
        ) THEN
            RAISE EXCEPTION '⚠️ VIOLAÇÃO FEFO: Existe lote com validade % disponível. Registre uma Justificativa de Auditoria para usar o lote %.', validade_mais_antiga, validade_atual;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_fefo_sn ON unidades_serializadas;
CREATE TRIGGER trg_validate_fefo_sn
BEFORE UPDATE ON unidades_serializadas
FOR EACH ROW WHEN (NEW.status_unidade = 'EM_TRANSPORTE' AND OLD.status_unidade = 'ESTOQUE')
EXECUTE FUNCTION validate_fefo_granular();

-- 5. Função de Rastreio de Pacientes por Lote (Recall)
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
        us.updated_at as data_entrega
    FROM unidades_serializadas us
    JOIN lotes l ON us.lote_id = l.id
    JOIN pacientes p ON us.paciente_id = p.id
    WHERE l.codigo_lote_fabricante = batch_codigo
      AND us.status_unidade = 'ENTREGUE';
END;
$$ LANGUAGE plpgsql;

-- 6. Índices de Performance
CREATE INDEX IF NOT EXISTS idx_sn_lookup ON unidades_serializadas (serial_number);
CREATE INDEX IF NOT EXISTS idx_sn_lote_status ON unidades_serializadas (lote_id, status_unidade);
