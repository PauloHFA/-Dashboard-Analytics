import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '../services/api';
import { formatarMoeda } from '@dashboard/shared';
import { Gauge, Clock } from 'lucide-react';

interface PacingData {
  mesReferencia: string;
  verbaMensalContratada: number;
  gastoAtualAteHoje: number;
  gastoEsperadoAteHoje: number;
  projecaoFimDoMes: number;
  ritmoDiarioMedioAtual: number;
  ritmoDiarioRecomendado: number;
  diasDecorridos: number;
  diasRestantes: number;
  diasNoMes: number;
  desvioPercentual: number;
  status: 'no_ritmo' | 'acelerado' | 'lento';
  mensagemRecomendacao: string;
}

interface Props {
  clienteId: string;
}

export const BudgetPacingCard: React.FC<Props> = ({ clienteId }) => {
  const { data, isLoading } = useQuery({
    queryKey: ['pacing', clienteId],
    queryFn: async () => {
      const res = await fetchApi<{ pacing: PacingData }>(`/clientes/${clienteId}/pacing`);
      return res.pacing;
    },
  });

  if (isLoading || !data) return null;

  const pctConsumido = Math.min(100, (data.gastoAtualAteHoje / data.verbaMensalContratada) * 100);
  const pctEsperado = Math.min(100, (data.gastoEsperadoAteHoje / data.verbaMensalContratada) * 100);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Gauge className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Previsão de Ritmo de Verba (Budget Pacing)</h3>
              <span
                className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                  data.status === 'no_ritmo'
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : data.status === 'acelerado'
                    ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                    : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                }`}
              >
                {data.status === 'no_ritmo'
                  ? 'No Ritmo Ideal'
                  : data.status === 'acelerado'
                  ? 'Gasto Acelerado'
                  : 'Gasto Abaixo'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Mês de referência: <strong>{data.mesReferencia}</strong> • Dia {data.diasDecorridos} de {data.diasNoMes} ({data.diasRestantes} dias restantes)
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs text-slate-400 dark:text-slate-500">Projeção Fim do Mês (Run-rate)</span>
          <p className="text-base font-bold text-slate-900 dark:text-white">{formatarMoeda(data.projecaoFimDoMes)}</p>
        </div>
      </div>

      {/* Barra Dupla de Progresso: Gasto Real vs Ritmo Esperado */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-xs font-semibold">
          <span className="text-slate-700 dark:text-slate-300">Consumo Atual: {formatarMoeda(data.gastoAtualAteHoje)} ({pctConsumido.toFixed(1)}%)</span>
          <span className="text-slate-500 dark:text-slate-400">Teto Contratado: {formatarMoeda(data.verbaMensalContratada)}</span>
        </div>

        <div className="relative w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
          {/* Marcação do ritmo esperado */}
          <div
            className="absolute top-0 bottom-0 border-r-2 border-slate-900 dark:border-slate-100 z-10"
            style={{ left: `${pctEsperado}%` }}
            title={`Ritmo esperado para hoje: ${pctEsperado.toFixed(1)}%`}
          ></div>

          {/* Barra de gasto real */}
          <div
            className={`h-3 rounded-full transition-all duration-700 ${
              data.status === 'no_ritmo'
                ? 'bg-emerald-500'
                : data.status === 'acelerado'
                ? 'bg-rose-500'
                : 'bg-amber-500'
            }`}
            style={{ width: `${pctConsumido}%` }}
          ></div>
        </div>

        <div className="flex justify-between text-[11px] text-slate-400 dark:text-slate-500">
          <span>Início do mês</span>
          <span className="text-slate-600 dark:text-slate-400 font-medium">Marcador vertical = Meta esperada para o dia ({formatarMoeda(data.gastoEsperadoAteHoje)})</span>
          <span>100% da verba</span>
        </div>
      </div>

      {/* Grid de Métricas de Pacing Diário */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
          <span className="text-slate-500 dark:text-slate-400 block mb-0.5">Ritmo Diário Atual</span>
          <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{formatarMoeda(data.ritmoDiarioMedioAtual)}/dia</span>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
          <span className="text-slate-500 dark:text-slate-400 block mb-0.5">Ritmo Recomendado</span>
          <span className="font-bold text-blue-700 dark:text-blue-400 text-sm">{formatarMoeda(data.ritmoDiarioRecomendado)}/dia</span>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
          <span className="text-slate-500 dark:text-slate-400 block mb-0.5">Variação Projetada</span>
          <span
            className={`font-bold text-sm ${
              data.desvioPercentual > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {data.desvioPercentual > 0 ? `+${data.desvioPercentual}%` : `${data.desvioPercentual}%`}
          </span>
        </div>
      </div>

      {/* Recomendação da Inteligência de Pacing */}
      <div className="mt-3 p-3 rounded-lg bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 flex items-start gap-2 text-xs text-blue-900 dark:text-blue-200 leading-relaxed">
        <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <span><strong>Diretriz do Pacing:</strong> {data.mensagemRecomendacao}</span>
      </div>
    </div>
  );
};
