import React, { useState, useEffect } from 'react';
import { Sparkles, CheckCircle2, AlertTriangle, Lightbulb, Copy, Check, RefreshCw, Activity, ArrowUpRight } from 'lucide-react';
import { fetchApi } from '../services/api';

interface ParecerData {
  clienteNome: string;
  periodo: { inicio: string; fim: string };
  resumoExecutivo: string;
  destaquesPositivos: string[];
  pontosDeAtencao: string[];
  recomendacoesEstrategicas: string[];
  scoreDesempenho: number;
}

interface Props {
  clienteId: string;
  inicio: string;
  fim: string;
  canais: string[];
}

export const AiExecutiveSummaryCard: React.FC<Props> = ({ clienteId, inicio, fim, canais }) => {
  const [parecer, setParecer] = useState<ParecerData | null>(null);
  const [gerando, setGerando] = useState(false);
  const [copiado, setCopiado] = useState(false);

  const carregarParecer = async (silencioso = false) => {
    try {
      if (!silencioso) setGerando(true);
      const res = await fetchApi<{ parecer: ParecerData }>('/ia/parecer', {
        method: 'POST',
        body: JSON.stringify({
          clienteId,
          inicio,
          fim,
          canais,
        }),
      });
      setParecer(res.parecer);
    } catch (err: any) {
      if (!silencioso) {
        alert(err.message || 'Erro ao gerar parecer com IA.');
      }
    } finally {
      setGerando(false);
    }
  };

  // Carrega automaticamente o parecer na montagem e ao trocar cliente/datas
  useEffect(() => {
    carregarParecer(true);
  }, [clienteId, inicio, fim, canais.join(',')]);

  const handleCopiarTexto = () => {
    if (!parecer) return;

    const textoFormatado = `📊 *PARECER EXECUTIVO DE PERFORMANCE - ${parecer.clienteNome.toUpperCase()}*
Período: ${inicio} a ${fim}
Índice de Saúde: ${parecer.scoreDesempenho}/100

📝 *Resumo Geral:*
${parecer.resumoExecutivo}

✅ *Destaques Positivos:*
${parecer.destaquesPositivos.map((d) => `• ${d}`).join('\n')}

⚠️ *Pontos de Atenção:*
${parecer.pontosDeAtencao.map((p) => `• ${p}`).join('\n')}

💡 *Próximas Recomendações Estratégicas:*
${parecer.recomendacoesEstrategicas.map((r) => `• ${r}`).join('\n')}

_Emitido automaticamente pelo AI Growth Copilot - Agência GrowMetrics Digital_`;

    navigator.clipboard.writeText(textoFormatado);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-indigo-100 dark:border-slate-800 p-6 shadow-sm hover:shadow-md transition-all">
      {/* Cabeçalho do Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-200 dark:shadow-none">
            <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">AI Growth Copilot</h3>
              <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                IA Preditiva & Diagnóstico
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Diagnóstico executivo automatizado e recomendações estratégicas para a agência
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {parecer && (
            <button
              onClick={handleCopiarTexto}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-xs font-semibold text-emerald-800 dark:text-emerald-300 transition border border-emerald-200 dark:border-emerald-800 cursor-pointer"
            >
              {copiado ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiado ? 'Copiado para WhatsApp!' : 'Copiar Parecer'}</span>
            </button>
          )}

          <button
            onClick={() => carregarParecer(false)}
            disabled={gerando}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 active:scale-95 text-xs font-semibold text-white transition shadow-sm disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${gerando ? 'animate-spin' : ''}`} />
            <span>{gerando ? 'Analisando métricas...' : parecer ? 'Regerar Análise' : 'Gerar Parecer por IA'}</span>
          </button>
        </div>
      </div>

      {/* Conteúdo Analítico */}
      {parecer ? (
        <div className="space-y-4 pt-1">
          {/* Caixa de Resumo Narrativo e Score */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                Resumo Executivo do Período
              </span>
              <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-normal">
                {parecer.resumoExecutivo}
              </p>
            </div>

            <div className="shrink-0 flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xs self-start md:self-center">
              <div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider block">
                  Índice de Saúde
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-blue-600 dark:text-blue-400">{parecer.scoreDesempenho}</span>
                  <span className="text-xs font-semibold text-slate-400">/100</span>
                </div>
              </div>
              <span
                className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                  parecer.scoreDesempenho >= 75
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : parecer.scoreDesempenho >= 50
                    ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                    : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                }`}
              >
                {parecer.scoreDesempenho >= 75 ? 'Excelente' : parecer.scoreDesempenho >= 50 ? 'Estável' : 'Crítico'}
              </span>
            </div>
          </div>

          {/* Grid de 3 Pilares: Destaques, Atenção e Recomendações */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Destaques Positivos */}
            <div className="p-4 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/25 border border-emerald-200 dark:border-emerald-800/60">
              <div className="flex items-center gap-1.5 mb-2.5 text-emerald-800 dark:text-emerald-300 font-bold text-xs uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Destaques Positivos</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {parecer.destaquesPositivos.map((d, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0">•</span>
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Pontos de Atenção */}
            <div className="p-4 rounded-xl bg-amber-50/80 dark:bg-amber-950/25 border border-amber-200 dark:border-amber-800/60">
              <div className="flex items-center gap-1.5 mb-2.5 text-amber-800 dark:text-amber-300 font-bold text-xs uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Pontos de Atenção</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {parecer.pontosDeAtencao.map((p, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-amber-600 dark:text-amber-400 font-bold shrink-0">•</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Recomendações Estratégicas */}
            <div className="p-4 rounded-xl bg-blue-50/80 dark:bg-blue-950/25 border border-blue-200 dark:border-blue-800/60">
              <div className="flex items-center gap-1.5 mb-2.5 text-blue-800 dark:text-blue-300 font-bold text-xs uppercase tracking-wider">
                <Lightbulb className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Próximas Ações</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {parecer.recomendacoesEstrategicas.map((r, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <ArrowUpRight className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-6 text-center bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
          <Sparkles className="w-8 h-8 text-indigo-500 mx-auto mb-2 animate-bounce" />
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Parecer de Desempenho Inteligente
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-3">
            O Copilot cruza automaticamente investimentos, retorno sobre anúncios (ROAS), variações de CPA e saúde das campanhas.
          </p>
          <button
            onClick={() => carregarParecer(false)}
            disabled={gerando}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition shadow cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${gerando ? 'animate-spin' : ''}`} />
            <span>{gerando ? 'Processando análise...' : 'Gerar Parecer Agora'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
