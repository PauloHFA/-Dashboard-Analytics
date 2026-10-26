import React, { useState } from 'react';
import { Sparkles, CheckCircle2, AlertTriangle, Lightbulb, Copy, Check, RefreshCw } from 'lucide-react';
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

  const handleGerarParecer = async () => {
    try {
      setGerando(true);
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
      alert(err.message || 'Erro ao gerar parecer com IA.');
    } finally {
      setGerando(false);
    }
  };

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
    <div className="bg-linear-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
      {/* Detalhe de fundo */}
      <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
            <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-tight">AI Growth Copilot</h3>
              <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                IA Preditiva
              </span>
            </div>
            <p className="text-xs text-blue-200/80">
              Diagnóstico executivo automatizado e recomendações estratégicas para a agência
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {parecer && (
            <button
              onClick={handleCopiarTexto}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition border border-white/10"
            >
              {copiado ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiado ? 'Copiado para WhatsApp!' : 'Copiar Parecer'}</span>
            </button>
          )}

          <button
            onClick={handleGerarParecer}
            disabled={gerando}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 active:scale-95 text-xs font-semibold text-white transition shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${gerando ? 'animate-spin' : ''}`} />
            <span>{gerando ? 'Analisando métricas...' : parecer ? 'Regerar Análise' : 'Gerar Parecer por IA'}</span>
          </button>
        </div>
      </div>

      {/* Conteúdo Gerado pela IA */}
      {parecer ? (
        <div className="space-y-4 pt-2 border-t border-white/10 mt-3 animate-fade-in">
          {/* Resumo e Score */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
            <p className="text-xs text-slate-200 leading-relaxed max-w-3xl">{parecer.resumoExecutivo}</p>
            <div className="shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/20 border border-blue-400/20 self-start md:self-center">
              <span className="text-[11px] text-blue-200 uppercase font-semibold">Índice Geral:</span>
              <span className="text-lg font-black text-amber-300">{parecer.scoreDesempenho}/100</span>
            </div>
          </div>

          {/* Grid de Destaques, Pontos de Atenção e Recomendações */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Destaques Positivos */}
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <div className="flex items-center gap-1.5 mb-2 text-emerald-400 font-bold text-xs uppercase">
                <CheckCircle2 className="w-4 h-4" />
                <span>Destaques Positivos</span>
              </div>
              <ul className="space-y-1.5 text-xs text-emerald-100/90 leading-tight">
                {parecer.destaquesPositivos.map((d, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-emerald-400 shrink-0">•</span>
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Pontos de Atenção */}
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <div className="flex items-center gap-1.5 mb-2 text-amber-400 font-bold text-xs uppercase">
                <AlertTriangle className="w-4 h-4" />
                <span>Pontos de Atenção</span>
              </div>
              <ul className="space-y-1.5 text-xs text-amber-100/90 leading-tight">
                {parecer.pontosDeAtencao.map((p, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-amber-400 shrink-0">•</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Recomendações Estratégicas */}
            <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <div className="flex items-center gap-1.5 mb-2 text-blue-300 font-bold text-xs uppercase">
                <Lightbulb className="w-4 h-4 text-amber-300" />
                <span>Próximas Ações</span>
              </div>
              <ul className="space-y-1.5 text-xs text-blue-100/90 leading-tight">
                {parecer.recomendacoesEstrategicas.map((r, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-blue-400 shrink-0">•</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <div className="pt-2 text-xs text-blue-200/60 flex items-center gap-2">
          <span>Clique em <strong>"Gerar Parecer por IA"</strong> para cruzar dados de mídia, CPA, ROAS e campanhas em segundos.</span>
        </div>
      )}
    </div>
  );
};
