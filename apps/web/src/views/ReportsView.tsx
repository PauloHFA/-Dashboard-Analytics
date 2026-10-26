import React, { useState, useEffect } from 'react';
import { useFilters } from '../context/FilterContext';
import { fetchApi } from '../services/api';
import { RelatorioGerado } from '@dashboard/shared';
import { FileText, Download, Clock, CheckCircle2, RefreshCw, FileSpreadsheet } from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { clienteId, clienteAtual, inicio, fim, canais, comparar } = useFilters();
  const [relatorios, setRelatorios] = useState<RelatorioGerado[]>([]);
  const [solicitando, setSolicitando] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);

  const carregarRelatorios = () => {
    fetchApi<{ relatorios: RelatorioGerado[] }>(`/relatorios?clienteId=${clienteId}`)
      .then((res) => setRelatorios(res.relatorios))
      .catch(console.error);
  };

  useEffect(() => {
    carregarRelatorios();
    const interval = setInterval(carregarRelatorios, 4000); // Polling leve para checar jobs assíncronos
    return () => clearInterval(interval);
  }, [clienteId]);

  const handleSolicitarRelatorio = async (formato: 'pdf' | 'csv') => {
    try {
      setSolicitando(true);
      const res = await fetchApi<{ status: number; mensagem: string; relatorio: RelatorioGerado }>('/relatorios', {
        method: 'POST',
        body: JSON.stringify({
          clienteId,
          formato,
          inicio,
          fim,
          canais,
          comparar,
        }),
      });

      setMensagemSucesso(res.mensagem);
      setTimeout(() => setMensagemSucesso(null), 4000);
      carregarRelatorios();
    } catch (err: any) {
      alert(err.message || 'Erro ao solicitar relatório.');
    } finally {
      setSolicitando(false);
    }
  };

  const handleDownloadCsvDireto = () => {
    const token = localStorage.getItem('auth_token') || 'usr-admin';
    window.open(`/api/v1/metricas/exportar-csv?clienteId=${clienteId}&inicio=${inicio}&fim=${fim}&token=${token}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* 1. Painel de Ações Rápidas */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Central de Relatórios & Exportações</h3>
            <p className="text-xs text-slate-500">
              Geração assíncrona de relatórios em fila e exportação direta de dados (RF-06 e RF-17 do PDF)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadCsvDireto}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-semibold shadow-xs transition"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Exportar CSV Direto (RF-17)</span>
            </button>

            <button
              onClick={() => handleSolicitarRelatorio('pdf')}
              disabled={solicitando}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow transition disabled:opacity-50"
            >
              <FileText className="w-4 h-4" />
              <span>{solicitando ? 'Enfileirando...' : 'Gerar Relatório em Background (202)'}</span>
            </button>
          </div>
        </div>

        {mensagemSucesso && (
          <div className="mb-4 flex items-center gap-2 text-xs text-blue-900 bg-blue-50 border border-blue-200 p-3 rounded-lg">
            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
            <span>{mensagemSucesso}</span>
          </div>
        )}

        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs text-slate-600">
          <div>
            <span>Cliente selecionado: </span>
            <strong className="text-slate-900">{clienteAtual?.nome}</strong>
            <span className="mx-2">•</span>
            <span>Período do relatório: </span>
            <strong className="text-slate-900">{inicio} até {fim}</strong>
          </div>
          <button
            onClick={carregarRelatorios}
            className="flex items-center gap-1 text-slate-500 hover:text-slate-800 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Atualizar lista</span>
          </button>
        </div>
      </div>

      {/* 2. Histórico de Relatórios Gerados */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900 mb-1">Histórico de Arquivos Processados</h3>
        <p className="text-xs text-slate-500 mb-4">Relatórios emitidos e disponíveis para download seguro</p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                <th className="py-2.5 px-3">Nome do Arquivo</th>
                <th className="py-2.5 px-3">Formato</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Data de Solicitação</th>
                <th className="py-2.5 px-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {relatorios.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Nenhum relatório gerado até o momento para este cliente.
                  </td>
                </tr>
              ) : (
                relatorios.map((rel) => (
                  <tr key={rel.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-medium text-slate-900 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-400" />
                      <span>{rel.nomeArquivo}</span>
                    </td>
                    <td className="py-2.5 px-3 uppercase text-[10px] font-mono font-bold text-slate-600">
                      {rel.formato}
                    </td>
                    <td className="py-2.5 px-3">
                      {rel.status === 'concluido' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> Concluído
                        </span>
                      )}
                      {rel.status === 'processando' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 animate-pulse">
                          <Clock className="w-3 h-3" /> Processando...
                        </span>
                      )}
                      {rel.status === 'erro' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                          Falha
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">
                      {new Date(rel.criadoEm).toLocaleString('pt-BR')}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {rel.status === 'concluido' ? (
                        <a
                          href={`/api/v1/relatorios/${rel.id}/download`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded transition"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Baixar</span>
                        </a>
                      ) : (
                        <span className="text-slate-400 text-xs">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

