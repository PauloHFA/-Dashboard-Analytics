import React from 'react';
import { ArrowUpRight, ArrowDownRight, Info } from 'lucide-react';
import { VariacaoMetrica } from '@dashboard/shared';

interface KpiCardProps {
  titulo: string;
  valorFormatado: string;
  variacao?: VariacaoMetrica;
  valorComparadoFormatado?: string;
  formula?: string;
  icone?: React.ReactNode;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  titulo,
  valorFormatado,
  variacao,
  valorComparadoFormatado,
  formula,
  icone,
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow transition-shadow">
      <div className="flex items-center justify-between text-slate-500 mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{titulo}</span>
          {formula && (
            <div className="group relative cursor-pointer" tabIndex={0}>
              <Info className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 transition-colors" />
              <div className="hidden group-hover:block absolute z-20 left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 p-2 bg-slate-900 text-white text-xs rounded-md shadow-lg pointer-events-none">
                <p className="font-semibold mb-0.5">Fórmula de cálculo:</p>
                <p className="text-slate-300 text-[11px] leading-tight">{formula}</p>
              </div>
            </div>
          )}
        </div>
        {icone && <div className="text-slate-400">{icone}</div>}
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <span className="text-2xl font-bold text-slate-900 tracking-tight">{valorFormatado}</span>

        {variacao && (
          <div
            className={`inline-flex items-center gap-0.5 text-xs font-medium px-2 py-0.5 rounded-full ${
              variacao.positivo
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}
          >
            {variacao.diferencaPercentual >= 0 ? (
              <ArrowUpRight className="w-3.5 h-3.5" />
            ) : (
              <ArrowDownRight className="w-3.5 h-3.5" />
            )}
            <span>
              {variacao.diferencaPercentual > 0 ? '+' : ''}
              {variacao.diferencaPercentual}%
            </span>
          </div>
        )}
      </div>

      {valorComparadoFormatado && (
        <div className="mt-2 text-xs text-slate-400">
          vs. anterior: <span className="font-medium text-slate-600">{valorComparadoFormatado}</span>
        </div>
      )}
    </div>
  );
};

