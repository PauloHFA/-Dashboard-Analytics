-- ====================================================================
-- SEED INICIAL DE DADOS - AGÊNCIA, CLIENTES E CONTAS
-- ====================================================================

-- 1. Inserir Marca da Agência
INSERT INTO agencias (id, nome, logo_url, cor_primaria, cor_secundaria, cor_neutra, fonte, rodape_texto)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'Agência GrowMetrics Digital',
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=120&auto=format&fit=crop&q=80',
    '#2563eb',
    '#0ea5e9',
    '#64748b',
    'Inter, sans-serif',
    'Relatório confidencial gerado pela Agência GrowMetrics Digital - Todos os direitos reservados.'
) ON CONFLICT DO NOTHING;

-- 2. Inserir Clientes Principais
INSERT INTO clientes (id, nome, documento, fuso_horario, moeda, fonte_primaria_conversoes, ativo)
VALUES 
    ('c0000000-0000-0000-0000-000000000001', 'TechNova Soluções SaaS', '12.345.678/0001-90', 'America/Sao_Paulo', 'BRL', 'ga4', true),
    ('c0000000-0000-0000-0000-000000000002', 'Moda Urbana E-commerce', '23.456.789/0001-01', 'America/Sao_Paulo', 'BRL', 'ga4', true),
    ('c0000000-0000-0000-0000-000000000003', 'Clínica Saúde & Estética', '34.567.890/0001-12', 'America/Sao_Paulo', 'BRL', 'plataformas', true)
ON CONFLICT DO NOTHING;

-- Inserir os outros 57 clientes para compor a carteira de 60 clientes (Seção 1 do PDF)
DO $$
BEGIN
    FOR i IN 4..60 LOOP
        INSERT INTO clientes (id, nome, fuso_horario, moeda, fonte_primaria_conversoes, ativo)
        VALUES (
            uuid_generate_v5(uuid_ns_url(), 'cliente-' || i),
            'Cliente Corporativo ' || i || ' - Brasil',
            'America/Sao_Paulo',
            'BRL',
            'ga4',
            true
        ) ON CONFLICT DO NOTHING;
    END LOOP;
END $$;

-- 3. Inserir Usuários (Admin, Gestor, Cliente)
-- Senha padrão para testes: 'rick123', 'admin123', 'gestor123', 'cliente123'
INSERT INTO usuarios (id, nome, email, senha_hash, perfil, ativo)
VALUES
    ('u0000000-0000-0000-0000-000000000000', 'Rick (Colaborador / Admin)', 'rickphtb@gmail.com', crypt('rick123', gen_salt('bf')), 'admin', true),
    ('u0000000-0000-0000-0000-000000000001', 'Ricardo Cardoso (Diretor)', 'admin@agencia.com', crypt('admin123', gen_salt('bf')), 'admin', true),
    ('u0000000-0000-0000-0000-000000000002', 'Mariana Gestora', 'gestor@agencia.com', crypt('gestor123', gen_salt('bf')), 'gestor', true),
    ('u0000000-0000-0000-0000-000000000003', 'Carlos Mendes (TechNova)', 'carlos@technova.com.br', crypt('cliente123', gen_salt('bf')), 'cliente', true)
ON CONFLICT (email) DO NOTHING;

-- 4. Inserir Vínculos na tabela usuarios_clientes
INSERT INTO usuarios_clientes (usuario_id, cliente_id)
VALUES
    ('u0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001'),
    ('u0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002'),
    ('u0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000003'),
    ('u0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001')
ON CONFLICT DO NOTHING;

-- 5. Contas Conectadas
INSERT INTO contas_conectadas (id, cliente_id, canal, id_externo, nome, status, ultima_sincronizacao)
VALUES
    ('b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'ga4', 'properties/458921789', 'GA4 - TechNova Produção', 'conectado', NOW() - INTERVAL '15 minutes'),
    ('b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'google_ads', '849-201-9921', 'Google Ads - TechNova Institucional', 'conectado', NOW() - INTERVAL '30 minutes'),
    ('b0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 'meta_ads', 'act_98231049281', 'Meta Ads - TechNova Leads', 'conectado', NOW() - INTERVAL '45 minutes'),
    ('b0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000001', 'instagram', '178414019283749', '@technova.saas Oficial', 'conectado', NOW() - INTERVAL '2 hours')
ON CONFLICT DO NOTHING;

