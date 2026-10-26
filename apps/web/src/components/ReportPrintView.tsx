import React from 'react';
import {
  ResumoMetricas,
  PontoSerieTemporal,
  ResumoCampanha,
  formatarMoeda,
  formatarNumero,
  Cliente,
} from '@dashboard/shared';
import { TrendChart } from './charts/TrendChart';

interface Props {
  cliente?: Cliente;
  inicio: string;
  fim: string;
  resumoAtual: ResumoMetricas;
  serieAtual: PontoSerieTemporal[];
  campanhas: ResumoCampanha[];
  onFechar: () => void;
}

export const ReportPrintView: React.FC<Props> = ({
  cliente,
  inicio,
  fim,
  resumoAtual,
  serieAtual,
  campanhas,
  onFechar,
}) => {
  return (
    <div className="fixed inset-0 bg-slate-900/60 z-50 flex justify-center overflow-y-auto p-4 sm:p-6">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full p-8 text-slate-900 space-y-6 my-auto print:m-0 print:p-0 print:shadow-none print:max-w-none">
        {/* Barra de Ação (Apenas na tela, oculta na impressão) */}
        <div className="flex items-center justify-between border-b pb-4 no-print">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Prévia do Relatório em PDF</h2>
            <p className="text-xs text-slate-500">Formato A4 com identidade visual da agência</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onFechar}
              className="text-xs font-semibold px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700"
            >
              Fechar
            </button>
            <button
              onClick={() => window.print()}
              className="text-xs font-semibold px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow"
            >
              Imprimir / Salvar como PDF
            </button>
          </div>
        </div>

        {/* Cabeçalho do Relatório com Identidade Visual */}
        <div className="border-b-2 border-blue-600 pb-4 flex justify-between items-end">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold text-xl text-blue-600 tracking-tight">GrowMetrics Digital</span>
              <span className="text-xs text-slate-400">|</span>
              <span className="text-xs font-medium text-slate-600">Analytics & Performance</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900">Relatório Executivo de Resultados</h1>
            <p className="text-sm font-semibold text-slate-700 mt-1">Cliente: {cliente?.nome}</p>
          </div>
          <div className="text-right text-xs text-slate-500">
            <p>
              Período: <strong className="text-slate-800">{inicio} a {fim}</strong>
            </p>
            <p>Gerado em: {new Date().toLocaleDateString('pt-BR')}</p>
          </div>
        </div>

        {/* Grid de Resumo Executivo */}
        <div className="grid grid-cols-4 gap-4 page-break-avoid">
          <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Investimento Total</span>
            <p className="text-lg font-bold text-slate-900 mt-1">{formatarMoeda(resumoAtual.investimentoTotal)}</p>
          </div>
          <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Receita Gerada</span>
            <p className="text-lg font-bold text-emerald-700 mt-1">{formatarMoeda(resumoAtual.receitaTotal)}</p>
          </div>
          <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">ROAS</span>
            <p className="text-lg font-bold text-blue-700 mt-1">{resumoAtual.roas.toFixed(2)}x</p>
          </div>
          <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Conversões</span>
            <p className="text-lg font-bold text-slate-900 mt-1">{formatarNumero(resumoAtual.conversoesTotal)}</p>
          </div>
        </div>

        {/* Gráfico de Evolução */}
        <div className="page-break-avoid border border-slate-200 rounded-lg p-4">
          <h3 className="text-xs font-bold text-slate-700 uppercase mb-3">Evolução Diária do Investimento</h3>
          <TrendChart atual={serieAtual} metrica="investimento" />
        </div>

        {/* Campanhas Principais */}
        <div className="page-break-avoid border border-slate-200 rounded-lg p-4">
          <h3 className="text-xs font-bold text-slate-700 uppercase mb-3">Top Campanhas no Período</h3>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-600">
                <th className="py-2 px-2">Campanha</th>
                <th className="py-2 px-2">Canal</th>
                <th className="py-2 px-2 text-right">Investimento</th>
                <th className="py-2 px-2 text-right">Conversões</th>
                <th className="py-2 px-2 text-right">CPA</th>
                <th className="py-2 px-2 text-right">ROAS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {campanhas.slice(0, 5).map((c) => (
                <tr key={c.id}>
                  <td className="py-2 px-2 font-medium">{c.nome}</td>
                  <td className="py-2 px-2 uppercase text-[10px]">{c.canal === 'google_ads' ? 'Google' : 'Meta'}</td>
                  <td className="py-2 px-2 text-right">{formatarMoeda(c.investimento)}</td>
                  <td className="py-2 px-2 text-right">{formatarNumero(c.conversoes)}</td>
                  <td className="py-2 px-2 text-right">{formatarMoeda(c.cpa)}</td>
                  <td className="py-2 px-2 text-right font-bold">{c.roas.toFixed(2)}x</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Rodapé Oficial da Agência (RF-06 e Seção 12) */}
        <div className="border-t border-slate-200 pt-4 flex justify-between items-center text-[10px] text-slate-400 page-break-avoid">
          <span>Relatório confidencial emitido pela GrowMetrics Digital para {cliente?.nome}.</span>
          <span>Página 1 de 1</span>
        </div>
      </div>
    </div>
  );
};
