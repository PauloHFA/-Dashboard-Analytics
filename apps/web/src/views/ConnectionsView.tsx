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
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Status das Conexões de Dados</h3>
            <p className="text-xs text-slate-500">
              Monitoramento das integrações ativas de <strong>{clienteAtual?.nome}</strong> (RF-10)
            </p>
          </div>
          <button
            onClick={carregarConexoes}
            className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg font-medium transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Atualizar Status</span>
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {conexoes.map((c) => (
            <div key={c.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 shrink-0 mt-0.5">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-sm text-slate-900">{c.nome}</h4>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                      {c.canal}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    ID Externo: <span className="font-mono text-slate-700">{c.idExterno}</span>
                  </p>

                  {c.mensagemErro && (
                    <div className="mt-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded p-2 flex items-start gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <span>{c.mensagemErro}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 self-end sm:self-center">
                {/* Status Badge */}
                <div>
                  {c.status === 'conectado' && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Conectado
                    </span>
                  )}
                  {c.status === 'requer_reconexao' && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Requer Reconexão
                    </span>
                  )}
                  {c.status === 'erro' && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                      <XCircle className="w-3.5 h-3.5" />
                      Falha na Conexão
                    </span>
                  )}
                </div>

                {/* Sincronização sob demanda */}
                <button
                  onClick={() => handleSincronizar(c.id)}
                  disabled={sincronizandoId === c.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${sincronizandoId === c.id ? 'animate-spin text-blue-600' : ''}`}
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

