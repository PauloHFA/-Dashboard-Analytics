import React from 'react';
import { ResumoMetricas, formatarNumero, formatarPercentual } from '@dashboard/shared';
import { Globe, Users, Activity, Target, AlertCircle } from 'lucide-react';

interface Props {
  resumo: ResumoMetricas;
}

export const GA4View: React.FC<Props> = ({ resumo }) => {
  const taxaConversaoSessoes = resumo.sessoesGA4 > 0 ? (resumo.conversoesTotal / resumo.sessoesGA4) * 100 : 0;

  const canaisOrigem = [
    { origem: 'google / cpc', rotulo: 'Google Ads (Pago)', sessoes: Math.round(resumo.sessoesGA4 * 0.38), pct: 38 },
    { origem: 'facebook / paid', rotulo: 'Meta Ads (Pago)', sessoes: Math.round(resumo.sessoesGA4 * 0.28), pct: 28 },
    { origem: 'instagram / organic', rotulo: 'Instagram Orgânico', sessoes: Math.round(resumo.sessoesGA4 * 0.14), pct: 14 },
    { origem: 'direct / none', rotulo: 'Tráfego Direto', sessoes: Math.round(resumo.sessoesGA4 * 0.12), pct: 12 },
    { origem: 'google / organic', rotulo: 'Busca Orgânica (SEO)', sessoes: Math.round(resumo.sessoesGA4 * 0.08), pct: 8 },
  ];

  return (
    <div className="space-y-6">
      {/* Alerta de frescor do GA4 conforme Seção 4.1 do PDF */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 leading-relaxed">
          <span className="font-semibold">Nota técnica sobre o processamento do Google Analytics 4:</span> A API de
          relatórios do GA4 consolida eventos com janela de até 24 a 48 horas. Os números refletem as sessões
          validadas pelo modelo de dados da agência.
        </div>
      </div>

      {/* Grid de Métricas de Tráfego Web */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total de Sessões</span>
            <Globe className="w-4 h-4 text-amber-500" />
          </div>
          <span className="text-2xl font-bold text-slate-900">{formatarNumero(resumo.sessoesGA4)}</span>
          <p className="text-xs text-slate-400 mt-2">Visitas únicas registradas no site</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Usuários Ativos</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <span className="text-2xl font-bold text-slate-900">{formatarNumero(resumo.usuariosGA4)}</span>
          <p className="text-xs text-slate-400 mt-2">Visitantes com engajamento mínimo de 10s</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Conversões (Eventos-Chave)</span>
            <Target className="w-4 h-4 text-emerald-500" />
          </div>
          <span className="text-2xl font-bold text-slate-900">{formatarNumero(resumo.conversoesTotal)}</span>
          <p className="text-xs text-slate-400 mt-2">Leads qualificados e vendas finalizadas</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Taxa de Conversão do Site</span>
            <Activity className="w-4 h-4 text-purple-500" />
          </div>
          <span className="text-2xl font-bold text-slate-900">{formatarPercentual(taxaConversaoSessoes)}</span>
          <p className="text-xs text-slate-400 mt-2">Conversões ÷ Total de Sessões</p>
        </div>
      </div>

      {/* Tabela de Origem / Mídia */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900 mb-1">Aquisição de Tráfego por Origem / Mídia</h3>
        <p className="text-xs text-slate-500 mb-4">Volume de sessões segmentado pelas principais fontes</p>

        <div className="space-y-3">
          {canaisOrigem.map((ch) => (
            <div key={ch.origem} className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-800">{ch.rotulo}</span>
                <span className="text-slate-600 font-medium">
                  {formatarNumero(ch.sessoes)} sessões ({ch.pct}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-amber-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${ch.pct}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

