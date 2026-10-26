import React, { useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  Target,
  Users,
  MousePointer,
  ShoppingBag,
  Percent,
} from 'lucide-react';
import {
  ResumoMetricas,
  VariacaoMetrica,
  PontoSerieTemporal,
  MetricasPorCanal,
  formatarMoeda,
  formatarNumero,
  formatarPercentual,
} from '@dashboard/shared';
import { KpiCard } from '../components/KpiCard';
import { TrendChart } from '../components/charts/TrendChart';
import { ChannelDonutChart } from '../components/charts/ChannelDonutChart';

interface Props {
  resumoAtual: ResumoMetricas;
  resumoComparativo?: ResumoMetricas;
  variacoes?: Record<string, VariacaoMetrica>;
  serieAtual: PontoSerieTemporal[];
  serieComparativa?: PontoSerieTemporal[];
  canais: MetricasPorCanal[];
}

export const OverviewView: React.FC<Props> = ({
  resumoAtual,
  resumoComparativo,
  variacoes,
  serieAtual,
  serieComparativa,
  canais,
}) => {
  const [metricaGrafico, setMetricaGrafico] = useState<'investimento' | 'conversoes' | 'receita' | 'cliques'>(
    'investimento'
  );

  return (
    <div className="space-y-6">
      {/* Grid de KPIs Principais (RF-03 e Seção 13 do PDF) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          titulo="Investimento em Mídia"
          valorFormatado={formatarMoeda(resumoAtual.investimentoTotal)}
          variacao={variacoes?.investimento}
          valorComparadoFormatado={resumoComparativo ? formatarMoeda(resumoComparativo.investimentoTotal) : undefined}
          formula="Soma dos custos de mídia (Google Ads + Meta Ads)"
          icone={<DollarSign className="w-5 h-5 text-blue-500" />}
        />

        <KpiCard
          titulo="Receita Gerada"
          valorFormatado={formatarMoeda(resumoAtual.receitaTotal)}
          variacao={variacoes?.receita}
          valorComparadoFormatado={resumoComparativo ? formatarMoeda(resumoComparativo.receitaTotal) : undefined}
          formula="Receita reportada pelo GA4 (e-commerce) + Entradas Manuais/CRM"
          icone={<ShoppingBag className="w-5 h-5 text-emerald-500" />}
        />

        <KpiCard
          titulo="ROAS Geral"
          valorFormatado={`${resumoAtual.roas.toFixed(2)}x`}
          variacao={variacoes?.roas}
          valorComparadoFormatado={resumoComparativo ? `${resumoComparativo.roas.toFixed(2)}x` : undefined}
          formula="Receita Total ÷ Investimento em Mídia"
          icone={<TrendingUp className="w-5 h-5 text-indigo-500" />}
        />

        <KpiCard
          titulo="ROI (Retorno s/ Inv.)"
          valorFormatado={formatarPercentual(resumoAtual.roi)}
          variacao={variacoes?.roi}
          valorComparadoFormatado={resumoComparativo ? formatarPercentual(resumoComparativo.roi) : undefined}
          formula="((Receita - Custos Totais) ÷ Custos Totais) × 100"
          icone={<Percent className="w-5 h-5 text-teal-500" />}
        />

        <KpiCard
          titulo="Conversões Totais"
          valorFormatado={formatarNumero(resumoAtual.conversoesTotal)}
          variacao={variacoes?.conversoes}
          valorComparadoFormatado={resumoComparativo ? formatarNumero(resumoComparativo.conversoesTotal) : undefined}
          formula="Eventos de conversão conforme fonte primária definida para o cliente"
          icone={<Target className="w-5 h-5 text-amber-500" />}
        />

        <KpiCard
          titulo="CPA Médio"
          valorFormatado={formatarMoeda(resumoAtual.cpaMedio)}
          variacao={variacoes?.cpa}
          valorComparadoFormatado={resumoComparativo ? formatarMoeda(resumoComparativo.cpaMedio) : undefined}
          formula="Investimento ÷ Conversões (Queda é positiva)"
          icone={<DollarSign className="w-5 h-5 text-purple-500" />}
        />

        <KpiCard
          titulo="CAC (Aquisição Cliente)"
          valorFormatado={resumoAtual.cac > 0 ? formatarMoeda(resumoAtual.cac) : 'N/D'}
          variacao={resumoAtual.cac > 0 ? variacoes?.cac : undefined}
          valorComparadoFormatado={resumoComparativo && resumoComparativo.cac > 0 ? formatarMoeda(resumoComparativo.cac) : undefined}
          formula="Investimento ÷ Novos Clientes (calculado a partir de CRM/Entradas manuais)"
          icone={<Users className="w-5 h-5 text-rose-500" />}
        />

        <KpiCard
          titulo="CTR Médio"
          valorFormatado={formatarPercentual(resumoAtual.ctrMedio)}
          variacao={variacoes?.ctr}
          valorComparadoFormatado={resumoComparativo ? formatarPercentual(resumoComparativo.ctrMedio) : undefined}
          formula="(Total de Cliques ÷ Total de Impressões) × 100"
          icone={<MousePointer className="w-5 h-5 text-sky-500" />}
        />
      </div>

      {/* Linha dos Gráficos: Tendência Interativa + Distribuição por Canal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Evolução Temporal no Período</h3>
              <p className="text-xs text-slate-500">
                Linha contínua: período atual | Linha tracejada: comparativo
              </p>
            </div>

            {/* Alternador de Métrica do Gráfico */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
              {(
                [
                  { id: 'investimento', label: 'Investimento' },
                  { id: 'conversoes', label: 'Conversões' },
                  { id: 'receita', label: 'Receita' },
                  { id: 'cliques', label: 'Cliques' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setMetricaGrafico(tab.id)}
                  className={`text-xs px-2.5 py-1 rounded font-medium transition ${
                    metricaGrafico === tab.id
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <TrendChart
            atual={serieAtual}
            comparativo={serieComparativa}
            metrica={metricaGrafico}
          />
        </div>

        {/* Divisão de Investimento por Canal */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900 mb-1">Distribuição de Mídia</h3>
            <p className="text-xs text-slate-500 mb-4">Participação no investimento total</p>
            <ChannelDonutChart canais={canais} />
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs">
            {canais
              .filter((c) => c.investimento > 0)
              .map((c) => (
                <div key={c.canal} className="flex justify-between items-center text-slate-600">
                  <span className="font-medium">{c.nomeExibicao}</span>
                  <span className="font-semibold text-slate-900">
                    {formatarMoeda(c.investimento)} ({c.participacaoInvestimento}%)
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

