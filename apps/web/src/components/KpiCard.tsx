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
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow transition-all">
      <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{titulo}</span>
          {formula && (
            <div className="group relative cursor-pointer" tabIndex={0}>
              <Info className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors" />
              <div className="hidden group-hover:block absolute z-20 left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 p-2 bg-slate-900 dark:bg-slate-800 text-white text-xs rounded-md shadow-lg pointer-events-none border border-slate-700">
                <p className="font-semibold mb-0.5">Fórmula de cálculo:</p>
                <p className="text-slate-300 text-[11px] leading-tight">{formula}</p>
              </div>
            </div>
          )}
        </div>
        {icone && <div className="text-slate-400 dark:text-slate-500">{icone}</div>}
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <span className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{valorFormatado}</span>

        {variacao && (
          <div
            className={`inline-flex items-center gap-0.5 text-xs font-medium px-2 py-0.5 rounded-full ${
              variacao.positivo
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
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
        <div className="mt-2 text-xs text-slate-400 dark:text-slate-500">
          vs. anterior: <span className="font-medium text-slate-600 dark:text-slate-300">{valorComparadoFormatado}</span>
        </div>
      )}
    </div>
  );
};
