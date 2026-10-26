import React, { useState } from 'react';
import { ResumoCampanha, formatarMoeda, formatarNumero, formatarPercentual } from '@dashboard/shared';
import { Search } from 'lucide-react';

interface Props {
  campanhas: ResumoCampanha[];
}

export const PaidAdsView: React.FC<Props> = ({ campanhas }) => {
  const [busca, setBusca] = useState('');
  const [filtroCanal, setFiltroCanal] = useState<'todos' | 'google_ads' | 'meta_ads'>('todos');

  const campanhasFiltradas = campanhas.filter((c) => {
    const matchBusca = c.nome.toLowerCase().includes(busca.toLowerCase());
    const matchCanal = filtroCanal === 'todos' || c.canal === filtroCanal;
    return matchBusca && matchCanal;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Desempenho por Campanha</h3>
            <p className="text-xs text-slate-500">
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
                className="pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 w-48 sm:w-64"
              />
            </div>

            {/* Filtro por Canal */}
            <select
              value={filtroCanal}
              onChange={(e) => setFiltroCanal(e.target.value as any)}
              className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 outline-none"
            >
              <option value="todos">Todos os canais</option>
              <option value="google_ads">Google Ads</option>
              <option value="meta_ads">Meta Ads</option>
            </select>
          </div>
        </div>

        {/* Tabela de Campanhas */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
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
            <tbody className="divide-y divide-slate-100">
              {campanhasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    Nenhuma campanha encontrada para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                campanhasFiltradas.map((cmp) => (
                  <tr key={cmp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 font-medium text-slate-900 max-w-xs truncate">
                      {cmp.nome}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                          cmp.canal === 'google_ads'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-sky-50 text-sky-700 border border-sky-200'
                        }`}
                      >
                        {cmp.canal === 'google_ads' ? 'Google Ads' : 'Meta Ads'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-semibold text-slate-800">
                      {formatarMoeda(cmp.investimento)}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-600">
                      {formatarNumero(cmp.impressoes)}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-600">
                      {formatarNumero(cmp.cliques)}
                    </td>
                    <td className="py-3 px-3 text-right font-medium text-slate-700">
                      {formatarPercentual(cmp.ctr)}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-600">
                      {formatarMoeda(cmp.cpc)}
                    </td>
                    <td className="py-3 px-3 text-right font-semibold text-emerald-600">
                      {formatarNumero(cmp.conversoes)}
                    </td>
                    <td className="py-3 px-3 text-right font-medium text-slate-700">
                      {formatarMoeda(cmp.cpa)}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-slate-900">
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
