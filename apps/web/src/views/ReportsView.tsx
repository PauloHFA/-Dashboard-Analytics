import React, { useState, useEffect } from 'react';
import { useFilters } from '../context/FilterContext';
import { useAuth } from '../context/AuthContext';
import { fetchApi } from '../services/api';
import { RelatorioGerado, AgendamentoRelatorio } from '@dashboard/shared';
import {
  FileText,
  Download,
  Clock,
  CheckCircle2,
  RefreshCw,
  FileSpreadsheet,
  Calendar,
  Send,
  Trash2,
  PlusCircle,
  MessageSquare,
  Mail,
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { clienteId, clienteAtual, inicio, fim, canais, comparar } = useFilters();
  const { usuario } = useAuth();
  const [relatorios, setRelatorios] = useState<RelatorioGerado[]>([]);
  const [agendamentos, setAgendamentos] = useState<AgendamentoRelatorio[]>([]);
  const [solicitando, setSolicitando] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);

  // Form de novo agendamento
  const [exibirFormAgendamento, setExibirFormAgendamento] = useState(false);
  const [novoTitulo, setNovoTitulo] = useState('');
  const [novaFrequencia, setNovaFrequencia] = useState<'semanal' | 'quinzenal' | 'mensal'>('mensal');
  const [novosEmails, setNovosEmails] = useState('');
  const [novoWhatsapp, setNovoWhatsapp] = useState('');
  const [novoFormato, setNovoFormato] = useState<'pdf' | 'csv' | 'ambos'>('pdf');

  const carregarRelatorios = () => {
    fetchApi<{ relatorios: RelatorioGerado[] }>(`/relatorios?clienteId=${clienteId}`)
      .then((res) => setRelatorios(res.relatorios))
      .catch(console.error);

    fetchApi<{ agendamentos: AgendamentoRelatorio[] }>(`/clientes/${clienteId}/agendamentos`)
      .then((res) => setAgendamentos(res.agendamentos))
      .catch(console.error);
  };

  useEffect(() => {
    carregarRelatorios();
    const interval = setInterval(carregarRelatorios, 4000);
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

  const handleCriarAgendamento = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const emailsArray = novosEmails.split(',').map((e) => e.trim()).filter(Boolean);
      await fetchApi(`/clientes/${clienteId}/agendamentos`, {
        method: 'POST',
        body: JSON.stringify({
          titulo: novoTitulo,
          frequencia: novaFrequencia,
          diaEnvio: 1,
          horaEnvio: '08:00',
          destinatariosEmail: emailsArray,
          webhookWhatsapp: novoWhatsapp || undefined,
          formato: novoFormato,
          ativo: true,
        }),
      });

      setNovoTitulo('');
      setNovosEmails('');
      setNovoWhatsapp('');
      setExibirFormAgendamento(false);
      setMensagemSucesso('Novo agendamento programado com sucesso!');
      setTimeout(() => setMensagemSucesso(null), 4000);
      carregarRelatorios();
    } catch (err: any) {
      alert(err.message || 'Erro ao criar agendamento.');
    }
  };

  const handleTestarAgendamento = async (id: string) => {
    try {
      const res = await fetchApi<{ mensagem: string }>(`/agendamentos/${id}/testar`, { method: 'POST' });
      alert(res.mensagem);
      carregarRelatorios();
    } catch (err: any) {
      alert(err.message || 'Falha ao testar disparo.');
    }
  };

  const handleExcluirAgendamento = async (id: string) => {
    if (!confirm('Deseja realmente remover este agendamento?')) return;
    try {
      await fetchApi(`/agendamentos/${id}`, { method: 'DELETE' });
      carregarRelatorios();
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir.');
    }
  };

  const handleDownloadCsvDireto = () => {
    const token = localStorage.getItem('auth_token') || 'usr-rick';
    window.open(`/api/v1/metricas/exportar-csv?clienteId=${clienteId}&inicio=${inicio}&fim=${fim}&token=${token}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* 1. Painel de Ações Rápidas */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Central de Relatórios & Exportações</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Geração assíncrona de relatórios em fila e exportação direta de dados (RF-06 e RF-17 do PDF)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadCsvDireto}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Exportar CSV Direto (RF-17)</span>
            </button>

            <button
              onClick={() => handleSolicitarRelatorio('pdf')}
              disabled={solicitando}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow transition disabled:opacity-50 cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>{solicitando ? 'Enfileirando...' : 'Gerar Relatório em Background (202)'}</span>
            </button>
          </div>
        </div>

        {mensagemSucesso && (
          <div className="mb-4 flex items-center gap-2 text-xs text-blue-900 dark:text-blue-200 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 p-3 rounded-lg">
            <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <span>{mensagemSucesso}</span>
          </div>
        )}

        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
          <div>
            <span>Cliente selecionado: </span>
            <strong className="text-slate-900 dark:text-white">{clienteAtual?.nome}</strong>
            <span className="mx-2">•</span>
            <span>Período do relatório: </span>
            <strong className="text-slate-900 dark:text-white">{inicio} até {fim}</strong>
          </div>
          <button
            onClick={carregarRelatorios}
            className="flex items-center gap-1 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Atualizar lista</span>
          </button>
        </div>
      </div>

      {/* 2. Histórico de Relatórios Gerados */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm transition-colors">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">Histórico de Arquivos Processados</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Relatórios emitidos e disponíveis para download seguro</p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-semibold">
                <th className="py-2.5 px-3">Nome do Arquivo</th>
                <th className="py-2.5 px-3">Formato</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Data de Solicitação</th>
                <th className="py-2.5 px-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {relatorios.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 dark:text-slate-500">
                    Nenhum relatório gerado até o momento para este cliente.
                  </td>
                </tr>
              ) : (
                relatorios.map((rel) => (
                  <tr key={rel.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                      <span>{rel.nomeArquivo}</span>
                    </td>
                    <td className="py-2.5 px-3 uppercase text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300">
                      {rel.formato}
                    </td>
                    <td className="py-2.5 px-3">
                      {rel.status === 'concluido' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="w-3 h-3" /> Concluído
                        </span>
                      )}
                      {rel.status === 'processando' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800 animate-pulse">
                          <Clock className="w-3 h-3" /> Processando...
                        </span>
                      )}
                      {rel.status === 'erro' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-800">
                          Falha
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400">
                      {new Date(rel.criadoEm).toLocaleString('pt-BR')}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {rel.status === 'concluido' ? (
                        <a
                          href={`/api/v1/relatorios/${rel.id}/download`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 px-2.5 py-1 rounded transition"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Baixar</span>
                        </a>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500 text-xs">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Agendamento Automático de Relatórios e WhatsApp (RF-15 do PDF) */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">Agendamento e Envio Automático</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Envio programado recorrente por E-mail e Webhook de WhatsApp (RF-15)
            </p>
          </div>

          {usuario?.perfil !== 'cliente' && (
            <button
              onClick={() => setExibirFormAgendamento(!exibirFormAgendamento)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-lg text-xs font-semibold transition cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{exibirFormAgendamento ? 'Cancelar' : 'Novo Agendamento'}</span>
            </button>
          )}
        </div>

        {/* Formulário de Novo Agendamento */}
        {exibirFormAgendamento && (
          <form onSubmit={handleCriarAgendamento} className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl mb-6 space-y-4">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">Configurar Nova Rotina de Envio</h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Título da Rotina</label>
                <input
                  type="text"
                  value={novoTitulo}
                  onChange={(e) => setNovoTitulo(e.target.value)}
                  placeholder="Ex: Fechamento Quinzenal de Leads"
                  className="w-full text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Frequência de Disparo</label>
                <select
                  value={novaFrequencia}
                  onChange={(e) => setNovaFrequencia(e.target.value as any)}
                  className="w-full text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="mensal" className="bg-white dark:bg-slate-800">Mensal (Todo dia 1º às 08:00)</option>
                  <option value="quinzenal" className="bg-white dark:bg-slate-800">Quinzenal (Dias 1º e 15 às 08:00)</option>
                  <option value="semanal" className="bg-white dark:bg-slate-800">Semanal (Toda Segunda-feira às 08:00)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">E-mails dos Destinatários (separados por vírgula)</label>
                <input
                  type="text"
                  value={novosEmails}
                  onChange={(e) => setNovosEmails(e.target.value)}
                  placeholder="cliente@empresa.com, gestor@agencia.com"
                  className="w-full text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Webhook de WhatsApp (Opcional)</label>
                <input
                  type="url"
                  value={novoWhatsapp}
                  onChange={(e) => setNovoWhatsapp(e.target.value)}
                  placeholder="https://api.whatsapp-service.com/webhook/..."
                  className="w-full text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Formato do Relatório</label>
                <select
                  value={novoFormato}
                  onChange={(e) => setNovoFormato(e.target.value as any)}
                  className="w-full text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pdf" className="bg-white dark:bg-slate-800">Apenas PDF</option>
                  <option value="csv" className="bg-white dark:bg-slate-800">Apenas CSV</option>
                  <option value="ambos" className="bg-white dark:bg-slate-800">Ambos (PDF e CSV)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setExibirFormAgendamento(false)}
                className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow cursor-pointer"
              >
                Salvar Agendamento
              </button>
            </div>
          </form>
        )}

        {/* Tabela de Agendamentos Ativos */}
        <div className="space-y-3">
          {agendamentos.map((agd) => (
            <div
              key={agd.id}
              className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-300 dark:hover:border-slate-700 transition"
            >
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white">{agd.titulo}</h4>
                  <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    {agd.frequencia}
                  </span>
                  <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {agd.formato.toUpperCase()}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                    {agd.destinatariosEmail.join(', ')}
                  </span>
                  {agd.webhookWhatsapp && (
                    <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium">
                      <MessageSquare className="w-3.5 h-3.5" />
                      WhatsApp Ativo
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  onClick={() => handleTestarAgendamento(agd.id)}
                  title="Simular disparo de teste agora"
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 transition cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Testar Disparo</span>
                </button>

                {usuario?.perfil !== 'cliente' && (
                  <button
                    onClick={() => handleExcluirAgendamento(agd.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition rounded cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
