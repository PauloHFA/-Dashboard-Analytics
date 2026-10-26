-- ====================================================================
-- MIGRAÇÃO INICIAL - DASHBOARD ANALYTICS MULTICLIENTE
-- Especificação Técnica: Seção 7 (Modelo de Dados) e Seção 9.2 (RLS)
-- ====================================================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Tabela: agencias (Marca e White Label)
CREATE TABLE IF NOT EXISTS agencias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    logo_url TEXT,
    cor_primaria VARCHAR(7) DEFAULT '#2563eb',
    cor_secundaria VARCHAR(7) DEFAULT '#0ea5e9',
    cor_neutra VARCHAR(7) DEFAULT '#64748b',
    fonte VARCHAR(100) DEFAULT 'Inter, sans-serif',
    rodape_texto TEXT,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabela: clientes (Tenants da Agência)
CREATE TABLE IF NOT EXISTS clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    documento VARCHAR(30),
    fuso_horario VARCHAR(50) DEFAULT 'America/Sao_Paulo',
    moeda VARCHAR(3) DEFAULT 'BRL',
    fonte_primaria_conversoes VARCHAR(20) DEFAULT 'ga4' CHECK (fonte_primaria_conversoes IN ('ga4', 'plataformas')),
    ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabela: usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    perfil VARCHAR(20) NOT NULL CHECK (perfil IN ('admin', 'gestor', 'cliente')),
    ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabela: usuarios_clientes (Vínculo de Clientes Permitidos para Gestores e Clientes Finais)
CREATE TABLE IF NOT EXISTS usuarios_clientes (
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (usuario_id, cliente_id)
);

-- 5. Tabela: contas_conectadas (Conexões externas GA4, Google Ads, Meta Ads, Instagram)
CREATE TABLE IF NOT EXISTS contas_conectadas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    canal VARCHAR(30) NOT NULL CHECK (canal IN ('ga4', 'google_ads', 'meta_ads', 'instagram')),
    id_externo VARCHAR(255) NOT NULL,
    nome VARCHAR(255) NOT NULL,
    moeda VARCHAR(3) DEFAULT 'BRL',
    fuso VARCHAR(50) DEFAULT 'America/Sao_Paulo',
    credencial_cifrada TEXT, -- Tokens criptografados com AES-256-GCM fora do banco (Seção 9.3)
    status VARCHAR(30) DEFAULT 'conectado' CHECK (status IN ('conectado', 'erro', 'requer_reconexao', 'sincronizando')),
    ultima_sincronizacao TIMESTAMP WITH TIME ZONE,
    mensagem_erro TEXT,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unq_cliente_canal_externo UNIQUE (cliente_id, canal, id_externo)
);

-- 6. Tabela: campanhas (Dimensão)
CREATE TABLE IF NOT EXISTS campanhas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conta_id UUID NOT NULL REFERENCES contas_conectadas(id) ON DELETE CASCADE,
    id_externo VARCHAR(255) NOT NULL,
    nome VARCHAR(255) NOT NULL,
    canal VARCHAR(30) NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unq_conta_campanha_externo UNIQUE (conta_id, id_externo)
);

-- 7. Tabela Fato: fato_ads_diario (Google Ads e Meta Ads)
CREATE TABLE IF NOT EXISTS fato_ads_diario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    conta_id UUID NOT NULL REFERENCES contas_conectadas(id) ON DELETE CASCADE,
    canal VARCHAR(30) NOT NULL,
    data DATE NOT NULL,
    campanha_id UUID REFERENCES campanhas(id) ON DELETE SET NULL,
    campanha_nome VARCHAR(255),
    investimento NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    impressoes BIGINT NOT NULL DEFAULT 0,
    cliques BIGINT NOT NULL DEFAULT 0,
    conversoes NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    valor_conversao NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unq_ads_fato UNIQUE (cliente_id, conta_id, data, canal, campanha_nome)
);

-- 8. Tabela Fato: fato_ga4_diario (Google Analytics 4)
CREATE TABLE IF NOT EXISTS fato_ga4_diario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    conta_id UUID NOT NULL REFERENCES contas_conectadas(id) ON DELETE CASCADE,
    data DATE NOT NULL,
    origem_midia VARCHAR(255) NOT NULL,
    sessoes BIGINT NOT NULL DEFAULT 0,
    usuarios BIGINT NOT NULL DEFAULT 0,
    novos_usuarios BIGINT NOT NULL DEFAULT 0,
    conversoes NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    receita NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unq_ga4_fato UNIQUE (cliente_id, conta_id, data, origem_midia)
);

-- 9. Tabela Fato: fato_instagram_diario (Instagram Insights com métrica moderna 'views')
CREATE TABLE IF NOT EXISTS fato_instagram_diario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    conta_id UUID NOT NULL REFERENCES contas_conectadas(id) ON DELETE CASCADE,
    data DATE NOT NULL,
    views BIGINT NOT NULL DEFAULT 0,
    alcance BIGINT NOT NULL DEFAULT 0,
    visitas_perfil BIGINT NOT NULL DEFAULT 0,
    novos_seguidores INT NOT NULL DEFAULT 0,
    interacoes BIGINT NOT NULL DEFAULT 0,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unq_insta_fato UNIQUE (cliente_id, conta_id, data)
);

-- 10. Tabela: instagram_midias (Top posts, reels, carrosséis)
CREATE TABLE IF NOT EXISTS instagram_midias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    conta_id UUID NOT NULL REFERENCES contas_conectadas(id) ON DELETE CASCADE,
    id_midia VARCHAR(255) NOT NULL,
    tipo VARCHAR(30) NOT NULL,
    legenda TEXT,
    permalink TEXT,
    thumbnail_url TEXT,
    publicado_em TIMESTAMP WITH TIME ZONE NOT NULL,
    views BIGINT DEFAULT 0,
    alcance BIGINT DEFAULT 0,
    interacoes BIGINT DEFAULT 0,
    curtidas BIGINT DEFAULT 0,
    comentarios BIGINT DEFAULT 0,
    compartilhamentos BIGINT DEFAULT 0,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. Tabela: entradas_manuais (Receita CRM, novos clientes e custos para CAC e ROI - RF-12)
CREATE TABLE IF NOT EXISTS entradas_manuais (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    data DATE NOT NULL,
    receita NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    novos_clientes INT NOT NULL DEFAULT 0,
    custos_extras NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    observacao TEXT,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unq_entrada_manual UNIQUE (cliente_id, data)
);

-- 12. Tabela: relatorios (Histórico de PDFs e exportações)
CREATE TABLE IF NOT EXISTS relatorios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    parametros JSONB NOT NULL,
    status VARCHAR(30) DEFAULT 'pendente' CHECK (status IN ('pendente', 'processando', 'concluido', 'erro')),
    arquivo_url TEXT,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 13. Tabela: sincronizacoes (Observabilidade e depuração - RF-10)
CREATE TABLE IF NOT EXISTS sincronizacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conta_id UUID NOT NULL REFERENCES contas_conectadas(id) ON DELETE CASCADE,
    janela_inicio DATE NOT NULL,
    janela_fim DATE NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('sucesso', 'erro', 'em_andamento')),
    inicio TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fim TIMESTAMP WITH TIME ZONE,
    linhas_afetadas INT DEFAULT 0,
    erro TEXT
);

-- 14. Tabela: auditoria (Trilha de auditoria LGPD / OWASP - Seção 9.3)
CREATE TABLE IF NOT EXISTS auditoria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    acao VARCHAR(100) NOT NULL,
    entidade VARCHAR(100) NOT NULL,
    entidade_id UUID,
    detalhes JSONB,
    ip VARCHAR(45),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ====================================================================
-- ÍNDICES DE PERFORMANCE (Seção 7 e 11: consultas de 12 meses < 1.5s)
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_fato_ads_cliente_data ON fato_ads_diario (cliente_id, data DESC);
CREATE INDEX IF NOT EXISTS idx_fato_ga4_cliente_data ON fato_ga4_diario (cliente_id, data DESC);
CREATE INDEX IF NOT EXISTS idx_fato_insta_cliente_data ON fato_instagram_diario (cliente_id, data DESC);
CREATE INDEX IF NOT EXISTS idx_entradas_cliente_data ON entradas_manuais (cliente_id, data DESC);
CREATE INDEX IF NOT EXISTS idx_contas_cliente ON contas_conectadas (cliente_id);
CREATE INDEX IF NOT EXISTS idx_relatorios_cliente ON relatorios (cliente_id, criado_em DESC);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) - ISOLAMENTO MULTITENANT NO BANCO (Seção 9.2)
-- ====================================================================

-- 1. Habilitar RLS em todas as tabelas de dados de clientes
ALTER TABLE fato_ads_diario ENABLE ROW LEVEL SECURITY;
ALTER TABLE fato_ga4_diario ENABLE ROW LEVEL SECURITY;
ALTER TABLE fato_instagram_diario ENABLE ROW LEVEL SECURITY;
ALTER TABLE instagram_midias ENABLE ROW LEVEL SECURITY;
ALTER TABLE entradas_manuais ENABLE ROW LEVEL SECURITY;
ALTER TABLE contas_conectadas ENABLE ROW LEVEL SECURITY;
ALTER TABLE relatorios ENABLE ROW LEVEL SECURITY;

-- 2. Políticas de segurança baseadas na variável de sessão 'app.cliente_ids'
-- A aplicação deve executar: SET LOCAL app.cliente_ids = 'id1,id2,...';
CREATE POLICY isolamento_fato_ads ON fato_ads_diario
    USING (cliente_id = ANY (string_to_array(current_setting('app.cliente_ids', true), ',')::uuid[]));

CREATE POLICY isolamento_fato_ga4 ON fato_ga4_diario
    USING (cliente_id = ANY (string_to_array(current_setting('app.cliente_ids', true), ',')::uuid[]));

CREATE POLICY isolamento_fato_instagram ON fato_instagram_diario
    USING (cliente_id = ANY (string_to_array(current_setting('app.cliente_ids', true), ',')::uuid[]));

CREATE POLICY isolamento_midias ON instagram_midias
    USING (cliente_id = ANY (string_to_array(current_setting('app.cliente_ids', true), ',')::uuid[]));

CREATE POLICY isolamento_entradas_manuais ON entradas_manuais
    USING (cliente_id = ANY (string_to_array(current_setting('app.cliente_ids', true), ',')::uuid[]));

CREATE POLICY isolamento_contas_conectadas ON contas_conectadas
    USING (cliente_id = ANY (string_to_array(current_setting('app.cliente_ids', true), ',')::uuid[]));

CREATE POLICY isolamento_relatorios ON relatorios
    USING (cliente_id = ANY (string_to_array(current_setting('app.cliente_ids', true), ',')::uuid[]));

-- ====================================================================
-- USUÁRIO DA APLICAÇÃO (Não Superuser - para que RLS não seja ignorado)
-- ====================================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'dashboard_app_user') THEN
        CREATE ROLE dashboard_app_user WITH LOGIN PASSWORD 'dashboard_app_pass_secret';
    END IF;
END $$;

GRANT CONNECT ON DATABASE postgres TO dashboard_app_user;
GRANT USAGE ON SCHEMA public TO dashboard_app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO dashboard_app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO dashboard_app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO dashboard_app_user;

