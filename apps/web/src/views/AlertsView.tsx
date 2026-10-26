import React, { useState, useEffect } from 'react';
import { useFilters } from '../context/FilterContext';
import { useAuth } from '../context/AuthContext';
import { fetchApi } from '../services/api';
import { AlertaMetrica, MetaCliente } from '@dashboard/shared';
import { AlertTriangle, AlertCircle, Target, CheckCircle2, Save } from 'lucide-react';

export const AlertsView: React.FC = () => {
  const { clienteId, clienteAtual, inicio, fim } = useFilters();
  const { usuario } = useAuth();
  const [alertas, setAlertas] = useState<AlertaMetrica[]>([]);
  const [meta, setMeta] = useState<MetaCliente | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  const carregarDados = () => {
    fetchApi<{ alertas: AlertaMetrica[] }>(`/clientes/${clienteId}/alertas?inicio=${inicio}&fim=${fim}`)
      .then((res) => setAlertas(res.alertas))
      .catch(console.error);

    fetchApi<{ meta: MetaCliente }>(`/clientes/${clienteId}/metas`)
      .then((res) => setMeta(res.meta))
      .catch(console.error);
  };

  useEffect(() => {
    carregarDados();
  }, [clienteId, inicio, fim]);

  const handleSalvarMetas = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meta) return;

    try {
      setSalvando(true);
      await fetchApi(`/clientes/${clienteId}/metas`, {
        method: 'PUT',
        body: JSON.stringify(meta),
      });
      setSucesso(true);
      setTimeout(() => setSucesso(false), 3000);
      carregarDados();
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar metas.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Diagnóstico e Alertas Ativos */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm transition-colors">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Diagnóstico e Alertas de Desempenho</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Monitoramento automático em tempo real para <strong>{clienteAtual?.nome}</strong> (RF-16 do PDF)
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            {alertas.length} {alertas.length === 1 ? 'alerta detectado' : 'alertas detectados'}
          </span>
        </div>

        {alertas.length === 0 ? (
          <div className="p-8 text-center bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">Tudo operando dentro das metas estabelecidas!</h4>
            <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1">
              Nenhuma anomalia de CPA, CTR, ROAS ou conectividade foi identificada no período selecionado.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {alertas.map((alt) => (
              <div
                key={alt.id}
                className={`p-4 rounded-xl border flex items-start gap-3.5 transition-all ${
                  alt.severidade === 'critico'
                    ? 'bg-rose-50/80 dark:bg-rose-950/50 border-rose-200 dark:border-rose-900/60 text-rose-950 dark:text-rose-200'
                    : 'bg-amber-50/80 dark:bg-amber-950/50 border-amber-200 dark:border-amber-900/60 text-amber-950 dark:text-amber-200'
                }`}
              >
                {alt.severidade === 'critico' ? (
                  <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-xs uppercase tracking-wider">{alt.titulo}</h4>
                    <span
                      className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                        alt.severidade === 'critico' ? 'bg-rose-200 dark:bg-rose-900 text-rose-900 dark:text-rose-100' : 'bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100'
                      }`}
                    >
                      {alt.severidade}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed opacity-90">{alt.mensagem}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. Definição de Metas Contratuais */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm transition-colors">
        <div className="flex items-center gap-2 mb-2">
          <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">Limites e Metas de Performance</h3>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
          Defina os limites de segurança contratuais. Sempre que uma métrica ultrapassar estes valores, alertas serão gerados no painel.
        </p>

        {meta && (
          <form onSubmit={handleSalvarMetas} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">CPA Máximo Permitido (R$)</label>
                <input
                  type="number"
                  step="0.5"
                  value={meta.cpaMaximo}
                  onChange={(e) => setMeta({ ...meta, cpaMaximo: Number(e.target.value) })}
                  disabled={usuario?.perfil === 'cliente'}
                  className="w-full text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 dark:disabled:bg-slate-800/40"
                  required
                />
                <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 block">Alerta dispara se o CPA médio superar este valor</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">CTR Mínimo Desejado (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={meta.ctrMinimo}
                  onChange={(e) => setMeta({ ...meta, ctrMinimo: Number(e.target.value) })}
                  disabled={usuario?.perfil === 'cliente'}
                  className="w-full text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 dark:disabled:bg-slate-800/40"
                  required
                />
                <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 block">Alerta dispara se a taxa de cliques for menor</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">ROAS Mínimo Aceitável</label>
                <input
                  type="number"
                  step="0.1"
                  value={meta.roasMinimo}
                  onChange={(e) => setMeta({ ...meta, roasMinimo: Number(e.target.value) })}
                  disabled={usuario?.perfil === 'cliente'}
                  className="w-full text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 dark:disabled:bg-slate-800/40"
                  required
                />
                <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 block">Meta de rentabilidade mínima sobre os anúncios</span>
              </div>
            </div>

            {sucesso && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 p-2.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Metas contratuais atualizadas com sucesso!</span>
              </div>
            )}

            {usuario?.perfil !== 'cliente' && (
              <button
                type="submit"
                disabled={salvando}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow transition disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{salvando ? 'Salvando...' : 'Salvar Configurações de Metas'}</span>
              </button>
            )}
          </form>
        )}
      </div>
    </div>
  );
};
