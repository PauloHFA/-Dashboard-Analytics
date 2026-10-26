# Dashboard Analytics Personalizado para Agência de Marketing Digital

Sistema completo de BI e Analytics Multicliente desenvolvido com base nas especificações do documento de requisitos (**React, TypeScript, Chart.js e API REST**).

---

## 🏗 Arquitetura do Projeto (Monorepo)

```
DashBoardAnalytics/
├── packages/
│   └── shared/                 # Contratos, tipos TypeScript, esquemas Zod e Dicionário de Métricas
│       ├── src/
│       │   ├── types/          # Tipos (Cliente, Usuário, Fatos, Conectores, etc.)
│       │   ├── utils/          # Fórmulas de métricas (CAC, ROI, ROAS, CTR, CPA, CPC)
│       │   └── schemas/        # Validações Zod (OpenAPI/RFC 7807)
│       └── test/               # Testes unitários de cálculos e agregação de razões
├── apps/
│   ├── api/                    # Servidor REST (Node.js, Express, TypeScript)
│   │   ├── src/
│   │   │   ├── connectors/     # Implementação da interface Conector (GA4, Google Ads, Meta Ads, Instagram)
│   │   │   ├── db/             # Store e simulação da carteira com mais de 60 clientes
│   │   │   ├── middleware/     # Defesa em camadas e isolamento multitenant (anti-IDOR)
│   │   │   ├── services/       # Motor de agregações, comparativos de períodos e séries temporais
│   │   │   └── server.ts       # Rotas REST padronizadas /api/v1/*
│   │   └── test/               # Testes automatizados de segurança e isolamento multi-tenant
│   └── web/                    # Front-end moderno (React 18, Vite, Tailwind CSS, Chart.js)
│       ├── src/
│       │   ├── components/     # Header, FilterBar, KpiCard, TrendChart, ChannelDonut, ReportPrintView
│       │   ├── views/          # Visão Geral, Anúncios, GA4, Instagram, Entradas Manuais, Conexões, Marca
│       │   └── context/        # AuthContext (com seletor rápido de perfil) e FilterContext
```

---

## ⚡ Como Executar o Projeto

### 1. Pré-requisitos
* Node.js v20+ ou v24+
* npm ou Docker Desktop

### 2. Executar via Docker Compose (Produção/Ambiente Isolado)
Para subir todos os serviços (PostgreSQL 16 com RLS, Redis 7, Backend API e Front-end Web):
```bash
docker compose up -d --build
```
* **Frontend Web**: `http://localhost:3000`
* **API REST**: `http://localhost:3001`
* **PostgreSQL**: porta 5432 (banco `dashboard_analytics`)

### 3. Executar em Modo de Desenvolvimento Local (sem Docker)
1. Rodar os testes:
```bash
npm test
```
2. Iniciar o Backend (Terminal 1):
```bash
npm run dev:api
```
3. Iniciar o Frontend (Terminal 2):
```bash
npm run dev:web
```

---

## 🎯 Módulos & Requisitos Implementados Conforme o PDF

| Módulo / Requisito | Status | Descrição |
|---|---|---|
| **RF-01 / RF-08 Conectores de Dados** | ✅ Implementado | Conectores para GA4, Google Ads, Meta Ads e Instagram Insights implementando a interface comum `Conector`. |
| **RF-02 Gráficos Interativos** | ✅ Implementado | Construído com `Chart.js` (`react-chartjs-2`), tooltips por índice, paleta consistente e linhas tracejadas `[6, 4]` para o período comparativo. |
| **RF-03 Dicionário de Métricas** | ✅ Implementado | Fórmulas formais de **CAC, ROI, ROAS, CTR, CPC, CPM, CPA** e conversões, aplicando a regra estrita de soma(numerador)/soma(denominador). |
| **RF-04 & RF-05 Filtros & Comparativos** | ✅ Implementado | Barra de filtros fixa com atalhos (7D, 30D, 90D, Este Mês), filtro de canais e comparativo de períodos com variação absoluta e percentual com semântica de cores invertida para métricas de custo (queda de CPA é verde). |
| **RF-06 Exportação em PDF** | ✅ Implementado | Layout de impressão A4 com a identidade visual da agência, evitando quebras de gráficos (`page-break-inside: avoid`). |
| **RF-07 & RF-08 Multitenancy & Perfis** | ✅ Implementado | Perfis de Administrador, Gestor e Cliente. Teste automatizado garante que o Cliente A não consegue ler dados do Cliente B. |
| **RF-10 Tela de Conexões** | ✅ Implementado | Monitoramento da saúde de cada conta, data/hora da última sincronização, alerta visual em falhas e botão de sincronização sob demanda. |
| **RF-11 "Quase Tempo Real"** | ✅ Implementado | Indicador visual de *"Atualizado há X minutos"* e polling com TanStack Query a cada 60 segundos e ao refocar a aba. |
| **RF-12 Entradas Manuais** | ✅ Implementado | Interface para registro manual de receita, novos clientes e custos extras para clientes sem CRM integrado, viabilizando o cálculo real de CAC e ROI. |
| **RF-13 Detalhe por Campanha e Instagram** | ✅ Implementado | Tabela de campanhas de Ads com métricas detalhadas e cards de publicações de maior desempenho do Instagram (utilizando a métrica moderna *Views*). |
| **RF-14 Marca da Agência** | ✅ Implementado | Personalização configurável pela agência de logo, cores (primária, secundária) e rodapé do relatório. |
| **RF-16 Metas e Alertas Inteligentes** | ✅ Implementado | Monitoramento de teto de CPA, piso de CTR, meta de ROAS e alertas de conectividade com badges visuais. |
| **RF-17 Exportação de Dados em CSV** | ✅ Implementado | Endpoint direto e central de relatórios com geração de arquivo CSV com BOM UTF-8 compatível com Excel no Brasil. |
| **Plus 1: AI Growth Copilot** | 🚀 Inovação | Diagnóstico executivo automático por IA com score de saúde, anomalias e recomendações estratégicas. |
| **Plus 2: Agendamento & Disparo (RF-15)** | 🚀 Inovação | Rotinas programadas recorrentes com envio automático por e-mail e webhook de WhatsApp. |
| **Plus 3: Budget Pacing & Run-rate** | 🚀 Inovação | Projeção financeira do fechamento do mês e controle diário para evitar estouro de verba de mídia. |
| **Plus 4: Webhook Nativo de CRM** | 🚀 Inovação | Endpoint para recepção em tempo real de vendas de RD Station, HubSpot ou PipeRun. |
| **Plus 5: Dark Mode & Modo Reunião (RNF-07)** | 🚀 Inovação | Alternância de tema claro/escuro e modo apresentação em tela cheia para TVs e projetores. |

---

## 📚 Documentações Técnicas e de Operação
* [**Manual de Operação e Diretrizes de Manutenção**](docs/MANUAL_E_DIRETRIZES.md): Fórmulas de métricas, adição de novos conectores (TikTok/LinkedIn) e runbook de incidentes.
* [**Extensões e Inovações Além do Escopo Base**](docs/EXTENSOES_E_MELHORIAS.md): Detalhamento técnico aprofundado dos 5 módulos de valor agregado implementados.

