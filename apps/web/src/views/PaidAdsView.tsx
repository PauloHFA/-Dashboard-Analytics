import React, { useState } from 'react';
import { ResumoCampanha, formatarMoeda, formatarNumero, formatarPercentual } from '@dashboard/shared';
import { Search } from 'lucide-react';
import { BudgetPacingCard } from '../components/BudgetPacingCard';
import { useFilters } from '../context/FilterContext';

interface Props {
  campanhas: ResumoCampanha[];
}

export const PaidAdsView: React.FC<Props> = ({ campanhas }) => {
  const { clienteId } = useFilters();
  const [busca, setBusca] = useState('');
  const [filtroCanal, setFiltroCanal] = useState<'todos' | 'google_ads' | 'meta_ads'>('todos');

  const campanhasFiltradas = campanhas.filter((c) => {
    const matchBusca = c.nome.toLowerCase().includes(busca.toLowerCase());
    const matchCanal = filtroCanal === 'todos' || c.canal === filtroCanal;
    return matchBusca && matchCanal;
  });

  return (
    <div className="space-y-6">
      {/* 1. Previsão de Ritmo de Gasto (Budget Pacing & Run-rate) */}
      <BudgetPacingCard clienteId={clienteId} />

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Desempenho por Campanha</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Detalhamento de campanhas ativas em Google Ads e Meta Ads no período selecionado
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Input de busca */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar campanha..."
                className="pl-9 pr-3 py-1.5 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 w-48 sm:w-64"
              />
            </div>

            {/* Filtro por Canal */}
            <select
              value={filtroCanal}
              onChange={(e) => setFiltroCanal(e.target.value as any)}
              className="text-xs border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 outline-none"
            >
              <option value="todos" className="bg-white dark:bg-slate-800">Todos os canais</option>
              <option value="google_ads" className="bg-white dark:bg-slate-800">Google Ads</option>
              <option value="meta_ads" className="bg-white dark:bg-slate-800">Meta Ads</option>
            </select>
          </div>
        </div>

        {/* Tabela de Campanhas */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-semibold">
                <th className="py-3 px-3">Campanha</th>
                <th className="py-3 px-3">Canal</th>
                <th className="py-3 px-3 text-right">Investimento</th>
                <th className="py-3 px-3 text-right">Impressões</th>
                <th className="py-3 px-3 text-right">Cliques</th>
                <th className="py-3 px-3 text-right">CTR</th>
                <th className="py-3 px-3 text-right">CPC</th>
                <th className="py-3 px-3 text-right">Conversões</th>
                <th className="py-3 px-3 text-right">CPA</th>
                <th className="py-3 px-3 text-right">ROAS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {campanhasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400 dark:text-slate-500">
                    Nenhuma campanha encontrada para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                campanhasFiltradas.map((cmp) => (
                  <tr key={cmp.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 font-medium text-slate-900 dark:text-slate-100 max-w-xs truncate">
                      {cmp.nome}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                          cmp.canal === 'google_ads'
                            ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                            : 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800'
                        }`}
                      >
                        {cmp.canal === 'google_ads' ? 'Google Ads' : 'Meta Ads'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-semibold text-slate-800 dark:text-slate-200">
                      {formatarMoeda(cmp.investimento)}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-600 dark:text-slate-400">
                      {formatarNumero(cmp.impressoes)}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-600 dark:text-slate-400">
                      {formatarNumero(cmp.cliques)}
                    </td>
                    <td className="py-3 px-3 text-right font-medium text-slate-700 dark:text-slate-300">
                      {formatarPercentual(cmp.ctr)}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-600 dark:text-slate-400">
                      {formatarMoeda(cmp.cpc)}
                    </td>
                    <td className="py-3 px-3 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatarNumero(cmp.conversoes)}
                    </td>
                    <td className="py-3 px-3 text-right font-medium text-slate-700 dark:text-slate-300">
                      {formatarMoeda(cmp.cpa)}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-slate-900 dark:text-white">
                      {cmp.roas > 0 ? `${cmp.roas.toFixed(2)}x` : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
