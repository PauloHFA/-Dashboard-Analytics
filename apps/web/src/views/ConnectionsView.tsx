import React, { useState, useEffect } from 'react';
import { useFilters } from '../context/FilterContext';
import { fetchApi } from '../services/api';
import { ContaConectada } from '@dashboard/shared';
import { CheckCircle2, AlertTriangle, XCircle, RefreshCw, Layers } from 'lucide-react';

export const ConnectionsView: React.FC = () => {
  const { clienteId, clienteAtual } = useFilters();
  const [conexoes, setConexoes] = useState<ContaConectada[]>([]);
  const [sincronizandoId, setSincronizandoId] = useState<string | null>(null);

  const carregarConexoes = () => {
    fetchApi<{ conexoes: ContaConectada[] }>(`/clientes/${clienteId}/conexoes`)
      .then((res) => setConexoes(res.conexoes))
      .catch(console.error);
  };

  useEffect(() => {
    carregarConexoes();
  }, [clienteId]);

  const handleSincronizar = async (contaId: string) => {
    try {
      setSincronizandoId(contaId);
      await fetchApi(`/conexoes/${contaId}/sincronizar`, { method: 'POST' });
      carregarConexoes();
    } catch (err: any) {
      alert(err.message || 'Falha ao sincronizar conta.');
      carregarConexoes();
    } finally {
      setSincronizandoId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm transition-colors">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Status das Conexões de Dados</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Monitoramento das integrações ativas de <strong>{clienteAtual?.nome}</strong> (RF-10)
            </p>
          </div>
          <button
            onClick={carregarConexoes}
            className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Atualizar Status</span>
          </button>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {conexoes.map((c) => (
            <div key={c.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 shrink-0 mt-0.5">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-sm text-slate-900 dark:text-white">{c.nome}</h4>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700">
                      {c.canal}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    ID Externo: <span className="font-mono text-slate-700 dark:text-slate-300">{c.idExterno}</span>
                  </p>

                  {c.mensagemErro && (
                    <div className="mt-2 text-xs text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded p-2 flex items-start gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                      <span>{c.mensagemErro}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 self-end sm:self-center">
                {/* Status Badge */}
                <div>
                  {c.status === 'conectado' && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Conectado
                    </span>
                  )}
                  {c.status === 'requer_reconexao' && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Requer Reconexão
                    </span>
                  )}
                  {c.status === 'erro' && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                      <XCircle className="w-3.5 h-3.5" />
                      Falha na Conexão
                    </span>
                  )}
                </div>

                {/* Sincronização sob demanda */}
                <button
                  onClick={() => handleSincronizar(c.id)}
                  disabled={sincronizandoId === c.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 transition cursor-pointer"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${sincronizandoId === c.id ? 'animate-spin text-blue-600 dark:text-blue-400' : ''}`}
                  />
                  <span>{sincronizandoId === c.id ? 'Sincronizando...' : 'Sincronizar Agora'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
