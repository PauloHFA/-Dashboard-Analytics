import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useFilters } from './context/FilterContext';
import { useAuth } from './context/AuthContext';
import { fetchApi } from './services/api';
import { Header } from './components/Header';
import { FilterBar } from './components/FilterBar';
import { OverviewView } from './views/OverviewView';
import { PaidAdsView } from './views/PaidAdsView';
import { GA4View } from './views/GA4View';
import { InstagramView } from './views/InstagramView';
import { ManualEntriesView } from './views/ManualEntriesView';
import { ConnectionsView } from './views/ConnectionsView';
import { BrandSettingsView } from './views/BrandSettingsView';
import { AlertsView } from './views/AlertsView';
import { ReportsView } from './views/ReportsView';
import { ReportPrintView } from './components/ReportPrintView';
import {
  ResumoMetricas,
  VariacaoMetrica,
  PontoSerieTemporal,
  MetricasPorCanal,
  ResumoCampanha,
  InstagramMidia,
  AlertaMetrica,
} from '@dashboard/shared';
import {
  LayoutDashboard,
  Megaphone,
  Globe,
  Instagram,
  Edit3,
  Link2,
  Settings,
  AlertTriangle,
  FileText,
} from 'lucide-react';

type AbaAtiva =
  | 'visao_geral'
  | 'anuncios'
  | 'ga4'
  | 'instagram'
  | 'entradas_manuais'
  | 'conexoes'
  | 'alertas'
  | 'relatorios'
  | 'marca';

export const App: React.FC = () => {
  const { clienteId, inicio, fim, canais, comparar, clienteAtual } = useFilters();
  const { usuario } = useAuth();
  const [abaAtiva, setAbaAtiva] = useState<AbaAtiva>('visao_geral');
  const [exibirRelatorioPdf, setExibirRelatorioPdf] = useState(false);
  const [minutosDesdeAtualizacao, setMinutosDesdeAtualizacao] = useState(0);

  // Contador de frescor (Seção 11.4)
  useEffect(() => {
    const timer = setInterval(() => {
      setMinutosDesdeAtualizacao((prev) => prev + 1);
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // TanStack Query: polling a cada 60s conforme RFC da Seção 11.4 do PDF
  const queryChave = ['metricas', clienteId, inicio, fim, canais.join(','), comparar];

  const {
    data: dadosResumo,
    isLoading: carregandoResumo,
    refetch,
  } = useQuery({
    queryKey: queryChave,
    queryFn: async () => {
      const params = new URLSearchParams({
        clienteId,
        inicio,
        fim,
        canais: canais.join(','),
        comparar,
      });
      const res = await fetchApi<{
        resumoAtual: ResumoMetricas;
        resumoComparativo?: ResumoMetricas;
        variacoes?: Record<string, VariacaoMetrica>;
      }>(`/metricas/resumo?${params.toString()}`);
      setMinutosDesdeAtualizacao(0);
      return res;
    },
    refetchInterval: 60000, // 60 segundos
  });

  const { data: dadosSerie } = useQuery({
    queryKey: ['serie', clienteId, inicio, fim, canais.join(','), comparar],
    queryFn: async () => {
      const params = new URLSearchParams({
        clienteId,
        inicio,
        fim,
        canais: canais.join(','),
        comparar,
      });
      return fetchApi<{ atual: PontoSerieTemporal[]; comparativo: PontoSerieTemporal[] }>(
        `/metricas/serie?${params.toString()}`
      );
    },
  });

  const { data: dadosCanais } = useQuery({
    queryKey: ['por-canal', clienteId, inicio, fim],
    queryFn: async () => {
      const params = new URLSearchParams({ clienteId, inicio, fim });
      return fetchApi<{ canais: MetricasPorCanal[] }>(`/metricas/por-canal?${params.toString()}`);
    },
  });

  const { data: dadosCampanhas } = useQuery({
    queryKey: ['campanhas', clienteId, inicio, fim],
    queryFn: async () => {
      const params = new URLSearchParams({ clienteId, inicio, fim });
      return fetchApi<{ campanhas: ResumoCampanha[] }>(`/metricas/campanhas?${params.toString()}`);
    },
  });

  const { data: dadosInstagram } = useQuery({
    queryKey: ['instagram-midias', clienteId],
    queryFn: async () => {
      return fetchApi<{ midias: InstagramMidia[] }>(`/instagram/midias?clienteId=${clienteId}`);
    },
  });

  const { data: dadosAlertas } = useQuery({
    queryKey: ['alertas', clienteId, inicio, fim],
    queryFn: async () => {
      return fetchApi<{ alertas: AlertaMetrica[]; total: number }>(`/clientes/${clienteId}/alertas?inicio=${inicio}&fim=${fim}`);
    },
    refetchInterval: 30000,
  });

  const abas = [
    { id: 'visao_geral', label: 'Visão Geral', icone: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'anuncios', label: 'Anúncios', icone: <Megaphone className="w-4 h-4" /> },
    { id: 'ga4', label: 'Site (GA4)', icone: <Globe className="w-4 h-4" /> },
    { id: 'instagram', label: 'Instagram', icone: <Instagram className="w-4 h-4" /> },
    { id: 'entradas_manuais', label: 'Entradas Manuais', icone: <Edit3 className="w-4 h-4" /> },
    { id: 'conexoes', label: 'Conexões & Status', icone: <Link2 className="w-4 h-4" /> },
    {
      id: 'alertas',
      label: 'Alertas & Metas',
      icone: <AlertTriangle className="w-4 h-4" />,
      badge: (dadosAlertas?.total || 0) > 0 ? dadosAlertas?.total : undefined,
    },
    { id: 'relatorios', label: 'Relatórios & CSV', icone: <FileText className="w-4 h-4" /> },
    ...(usuario?.perfil === 'admin'
      ? [{ id: 'marca', label: 'Marca da Agência', icone: <Settings className="w-4 h-4" /> }]
      : []),
  ];

  const handleExportCsv = () => {
    const token = localStorage.getItem('auth_token') || 'usr-admin';
    window.open(`/api/v1/metricas/exportar-csv?clienteId=${clienteId}&inicio=${inicio}&fim=${fim}&token=${token}`, '_blank');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header
        minutosDesdeAtualizacao={minutosDesdeAtualizacao}
        onRefresh={() => {
          refetch();
          setMinutosDesdeAtualizacao(0);
        }}
        onExportPdf={() => setExibirRelatorioPdf(true)}
        onExportCsv={handleExportCsv}
      />

      <FilterBar />

      {/* Navegação Secundária por Abas */}
      <div className="bg-white border-b border-slate-200 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-6 overflow-x-auto py-2">
            {abas.map((aba) => (
              <button
                key={aba.id}
                onClick={() => setAbaAtiva(aba.id as AbaAtiva)}
                className={`flex items-center gap-1.5 py-2 px-1 border-b-2 text-xs font-semibold whitespace-nowrap transition ${
                  abaAtiva === aba.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                {aba.icone}
                <span>{aba.label}</span>
                {'badge' in aba && aba.badge !== undefined && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                    {aba.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {carregandoResumo && !dadosResumo ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-xs font-medium">Consolidando métricas multicliente...</p>
          </div>
        ) : (
          dadosResumo && (
            <>
              {abaAtiva === 'visao_geral' && (
                <OverviewView
                  resumoAtual={dadosResumo.resumoAtual}
                  resumoComparativo={dadosResumo.resumoComparativo}
                  variacoes={dadosResumo.variacoes}
                  serieAtual={dadosSerie?.atual || []}
                  serieComparativa={dadosSerie?.comparativo}
                  canais={dadosCanais?.canais || []}
                />
              )}

              {abaAtiva === 'anuncios' && <PaidAdsView campanhas={dadosCampanhas?.campanhas || []} />}

              {abaAtiva === 'ga4' && <GA4View resumo={dadosResumo.resumoAtual} />}

              {abaAtiva === 'instagram' && (
                <InstagramView resumo={dadosResumo.resumoAtual} midias={dadosInstagram?.midias || []} />
              )}

              {abaAtiva === 'entradas_manuais' && <ManualEntriesView />}

              {abaAtiva === 'conexoes' && <ConnectionsView />}

              {abaAtiva === 'alertas' && <AlertsView />}

              {abaAtiva === 'relatorios' && <ReportsView />}

              {abaAtiva === 'marca' && <BrandSettingsView />}
            </>
          )
        )}
      </main>

      {/* Modal / Layout para Impressão em PDF */}
      {exibirRelatorioPdf && dadosResumo && (
        <ReportPrintView
          cliente={clienteAtual}
          inicio={inicio}
          fim={fim}
          resumoAtual={dadosResumo.resumoAtual}
          serieAtual={dadosSerie?.atual || []}
          campanhas={dadosCampanhas?.campanhas || []}
          onFechar={() => setExibirRelatorioPdf(false)}
        />
      )}
    </div>
  );
};
