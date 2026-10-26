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
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Diagnóstico e Alertas de Desempenho</h3>
            <p className="text-xs text-slate-500">
              Monitoramento automático em tempo real para <strong>{clienteAtual?.nome}</strong> (RF-16 do PDF)
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
            {alertas.length} {alertas.length === 1 ? 'alerta detectado' : 'alertas detectados'}
          </span>
        </div>

        {alertas.length === 0 ? (
          <div className="p-8 text-center bg-emerald-50/60 border border-emerald-200 rounded-xl">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-emerald-900">Tudo operando dentro das metas estabelecidas!</h4>
            <p className="text-xs text-emerald-700 mt-1">
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
                    ? 'bg-rose-50/80 border-rose-200 text-rose-950'
                    : 'bg-amber-50/80 border-amber-200 text-amber-950'
                }`}
              >
                {alt.severidade === 'critico' ? (
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-xs uppercase tracking-wider">{alt.titulo}</h4>
                    <span
                      className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                        alt.severidade === 'critico' ? 'bg-rose-200 text-rose-900' : 'bg-amber-200 text-amber-900'
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
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <Target className="w-5 h-5 text-blue-600" />
          <h3 className="text-base font-semibold text-slate-900">Limites e Metas de Performance</h3>
        </div>
        <p className="text-xs text-slate-500 mb-6">
          Defina os limites de segurança contratuais. Sempre que uma métrica ultrapassar estes valores, alertas serão gerados no painel.
        </p>

        {meta && (
          <form onSubmit={handleSalvarMetas} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">CPA Máximo Permitido (R$)</label>
                <input
                  type="number"
                  step="0.5"
                  value={meta.cpaMaximo}
                  onChange={(e) => setMeta({ ...meta, cpaMaximo: Number(e.target.value) })}
                  disabled={usuario?.perfil === 'cliente'}
                  className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
                  required
                />
                <span className="text-[11px] text-slate-400 mt-1 block">Alerta dispara se o CPA médio superar este valor</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">CTR Mínimo Desejado (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={meta.ctrMinimo}
                  onChange={(e) => setMeta({ ...meta, ctrMinimo: Number(e.target.value) })}
                  disabled={usuario?.perfil === 'cliente'}
                  className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
                  required
                />
                <span className="text-[11px] text-slate-400 mt-1 block">Alerta dispara se a taxa de cliques for menor</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ROAS Mínimo Aceitável</label>
                <input
                  type="number"
                  step="0.1"
                  value={meta.roasMinimo}
                  onChange={(e) => setMeta({ ...meta, roasMinimo: Number(e.target.value) })}
                  disabled={usuario?.perfil === 'cliente'}
                  className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
                  required
                />
                <span className="text-[11px] text-slate-400 mt-1 block">Meta de rentabilidade mínima sobre os anúncios</span>
              </div>
            </div>

            {sucesso && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Metas contratuais atualizadas com sucesso!</span>
              </div>
            )}

            {usuario?.perfil !== 'cliente' && (
              <button
                type="submit"
                disabled={salvando}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow transition disabled:opacity-50"
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
