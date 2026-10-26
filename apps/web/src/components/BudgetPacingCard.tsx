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
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Gauge className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">Previsão de Ritmo de Verba (Budget Pacing)</h3>
              <span
                className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                  data.status === 'no_ritmo'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : data.status === 'acelerado'
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}
              >
                {data.status === 'no_ritmo'
                  ? 'No Ritmo Ideal'
                  : data.status === 'acelerado'
                  ? 'Gasto Acelerado'
                  : 'Gasto Abaixo'}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Mês de referência: <strong>{data.mesReferencia}</strong> • Dia {data.diasDecorridos} de {data.diasNoMes} ({data.diasRestantes} dias restantes)
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs text-slate-400">Projeção Fim do Mês (Run-rate)</span>
          <p className="text-base font-bold text-slate-900">{formatarMoeda(data.projecaoFimDoMes)}</p>
        </div>
      </div>

      {/* Barra Dupla de Progresso: Gasto Real vs Ritmo Esperado */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-xs font-semibold">
          <span className="text-slate-700">Consumo Atual: {formatarMoeda(data.gastoAtualAteHoje)} ({pctConsumido.toFixed(1)}%)</span>
          <span className="text-slate-500">Teto Contratado: {formatarMoeda(data.verbaMensalContratada)}</span>
        </div>

        <div className="relative w-full bg-slate-100 rounded-full h-3 overflow-hidden">
          {/* Marcação do ritmo esperado */}
          <div
            className="absolute top-0 bottom-0 border-r-2 border-slate-900 z-10"
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

        <div className="flex justify-between text-[11px] text-slate-400">
          <span>Início do mês</span>
          <span className="text-slate-600 font-medium">Marcador preto = Meta esperada para o dia ({formatarMoeda(data.gastoEsperadoAteHoje)})</span>
          <span>100% da verba</span>
        </div>
      </div>

      {/* Grid de Métricas de Pacing Diário */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-xs">
        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
          <span className="text-slate-500 block mb-0.5">Ritmo Diário Atual</span>
          <span className="font-bold text-slate-800 text-sm">{formatarMoeda(data.ritmoDiarioMedioAtual)}/dia</span>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
          <span className="text-slate-500 block mb-0.5">Ritmo Recomendado</span>
          <span className="font-bold text-blue-700 text-sm">{formatarMoeda(data.ritmoDiarioRecomendado)}/dia</span>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
          <span className="text-slate-500 block mb-0.5">Variação Projetada</span>
          <span
            className={`font-bold text-sm ${
              data.desvioPercentual > 0 ? 'text-rose-600' : 'text-emerald-600'
            }`}
          >
            {data.desvioPercentual > 0 ? `+${data.desvioPercentual}%` : `${data.desvioPercentual}%`}
          </span>
        </div>
      </div>

      {/* Recomendação da Inteligência de Pacing */}
      <div className="mt-3 p-3 rounded-lg bg-blue-50/70 border border-blue-100 flex items-start gap-2 text-xs text-blue-900 leading-relaxed">
        <Clock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <span><strong>Diretriz do Pacing:</strong> {data.mensagemRecomendacao}</span>
      </div>
    </div>
  );
};
