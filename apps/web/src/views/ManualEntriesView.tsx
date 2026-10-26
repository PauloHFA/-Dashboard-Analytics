import React, { useState, useEffect } from 'react';
import { useFilters } from '../context/FilterContext';
import { useAuth } from '../context/AuthContext';
import { fetchApi } from '../services/api';
import { EntradaManual, formatarMoeda, formatarNumero } from '@dashboard/shared';
import { PlusCircle, HelpCircle, CheckCircle2, Webhook, Copy, Check, Zap } from 'lucide-react';

export const ManualEntriesView: React.FC = () => {
  const { clienteId, clienteAtual } = useFilters();
  const { usuario } = useAuth();
  const [entradas, setEntradas] = useState<EntradaManual[]>([]);
  const [sucesso, setSucesso] = useState(false);
  const [copiadoWebhook, setCopiadoWebhook] = useState(false);
  const [simulandoWebhook, setSimulandoWebhook] = useState(false);
  const [mensagemWebhook, setMensagemWebhook] = useState<string | null>(null);

  // Form state
  const [data, setData] = useState(new Date().toISOString().slice(0, 10));
  const [receita, setReceita] = useState('');
  const [novosClientes, setNovosClientes] = useState('');
  const [custosExtras, setCustosExtras] = useState('');
  const [observacao, setObservacao] = useState('');

  const carregarEntradas = () => {
    fetchApi<{ entradas: EntradaManual[] }>(`/clientes/${clienteId}/entradas`)
      .then((res) => setEntradas(res.entradas))
      .catch(console.error);
  };

  useEffect(() => {
    carregarEntradas();
  }, [clienteId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetchApi(`/clientes/${clienteId}/entradas`, {
        method: 'POST',
        body: JSON.stringify({
          data,
          receita: Number(receita) || 0,
          novosClientes: Number(novosClientes) || 0,
          custosExtras: Number(custosExtras) || 0,
          observacao,
        }),
      });
      setSucesso(true);
      setTimeout(() => setSucesso(false), 3000);
      setReceita('');
      setNovosClientes('');
      setCustosExtras('');
      setObservacao('');
      carregarEntradas();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSimularWebhook = async () => {
    try {
      setSimulandoWebhook(true);
      const valor = Math.floor(Math.random() * 2000) + 1500;
      const res = await fetch(`/api/v1/webhooks/crm/${clienteId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          evento: 'oportunidade_ganha_crm',
          receita: valor,
          novosClientes: 1,
          custosExtras: 0,
          contato: { nome: `Lead CRM #${Math.floor(Math.random() * 900) + 100}`, email: 'lead@exemplo.com' },
        }),
      });
      await res.json();
      setMensagemWebhook(`Sucesso! Venda de R$ ${valor},00 recebida via Webhook e somada ao CAC/ROI.`);
      setTimeout(() => setMensagemWebhook(null), 4000);
      carregarEntradas();
    } catch (err: any) {
      alert(err.message || 'Falha no webhook');
    } finally {
      setSimulandoWebhook(false);
    }
  };

  const webhookUrl = `${window.location.origin}/api/v1/webhooks/crm/${clienteId}`;

  return (
    <div className="space-y-6">
      {/* Banner Explicativo (Seção 4.2 do PDF) */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <HelpCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-xs text-blue-900 leading-relaxed">
          <span className="font-semibold">Por que registrar entradas manuais?</span> As APIs de anúncios (Google e Meta)
          não informam novos clientes reais nem a receita final de empresas de serviços/SaaS. Esta tela permite alimentar
          os dados do CRM ou ERP para viabilizar o cálculo exato de <strong>CAC (Custo de Aquisição)</strong> e{' '}
          <strong>ROI (Retorno do Negócio)</strong>.
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário de Lançamento */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900 mb-1">Novo Lançamento Manual</h3>
          <p className="text-xs text-slate-500 mb-4">Cliente: {clienteAtual?.nome}</p>

          {usuario?.perfil === 'cliente' ? (
            <p className="text-xs text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-200">
              Apenas membros da equipe da agência (Admin ou Gestor) podem lançar métricas manuais.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Data da Venda/Registro</label>
                <input
                  type="date"
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Receita Faturada (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={receita}
                  onChange={(e) => setReceita(e.target.value)}
                  placeholder="Ex: 5000.00"
                  className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Novos Clientes Fechados</label>
                <input
                  type="number"
                  value={novosClientes}
                  onChange={(e) => setNovosClientes(e.target.value)}
                  placeholder="Ex: 3"
                  className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Custos Extras / Taxas (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={custosExtras}
                  onChange={(e) => setCustosExtras(e.target.value)}
                  placeholder="Ex: 300.00"
                  className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Observações</label>
                <input
                  type="text"
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  placeholder="Ex: Campanha de fechamento trimestral"
                  className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {sucesso && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Entrada adicionada com sucesso!</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow transition"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Salvar Lançamento</span>
              </button>
            </form>
          )}
        </div>

        {/* Tabela de Lançamentos Recentes */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900 mb-1">Histórico de Entradas Manuais</h3>
          <p className="text-xs text-slate-500 mb-4">Dados integrados para apuração de CAC e ROI</p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                  <th className="py-2.5 px-3">Data</th>
                  <th className="py-2.5 px-3 text-right">Receita</th>
                  <th className="py-2.5 px-3 text-right">Novos Clientes</th>
                  <th className="py-2.5 px-3 text-right">Custos Extras</th>
                  <th className="py-2.5 px-3">Observação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {entradas.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      Nenhuma entrada manual cadastrada para este cliente.
                    </td>
                  </tr>
                ) : (
                  entradas.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-medium text-slate-800">{e.data}</td>
                      <td className="py-2.5 px-3 text-right font-semibold text-emerald-600">
                        {formatarMoeda(e.receita)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold text-blue-600">
                        {formatarNumero(e.novosClientes)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-600">
                        {formatarMoeda(e.custosExtras)}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 max-w-xs truncate">{e.observacao || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Integração Nativa via Webhook de CRM (RD Station, HubSpot, PipeRun) */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Webhook className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">Integração Direta com CRM & E-commerce (Webhook)</h3>
                <span className="text-[10px] font-mono uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                  Automação em Tempo Real
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Receba vendas ganhas do RD Station, HubSpot ou PipeRun e atualize o CAC/ROI sem esforço manual
              </p>
            </div>
          </div>

          <button
            onClick={handleSimularWebhook}
            disabled={simulandoWebhook}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow transition disabled:opacity-50"
          >
            <Zap className={`w-3.5 h-3.5 ${simulandoWebhook ? 'animate-bounce' : ''}`} />
            <span>{simulandoWebhook ? 'Enviando payload...' : 'Simular Venda do CRM'}</span>
          </button>
        </div>

        {mensagemWebhook && (
          <div className="mb-4 flex items-center gap-2 text-xs text-emerald-900 bg-emerald-50 border border-emerald-200 p-3 rounded-lg">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{mensagemWebhook}</span>
          </div>
        )}

        <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700">Endpoint Webhook do Cliente:</span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(webhookUrl);
                setCopiadoWebhook(true);
                setTimeout(() => setCopiadoWebhook(false), 2000);
              }}
              className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium"
            >
              {copiadoWebhook ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiadoWebhook ? 'Copiado!' : 'Copiar URL'}</span>
            </button>
          </div>
          <p className="font-mono text-xs bg-white border border-slate-200 rounded p-2 text-slate-800 break-all select-all">
            {webhookUrl}
          </p>
          <p className="text-[11px] text-slate-400">
            Configure este endpoint no seu CRM para disparar eventos de <strong>Oportunidade Ganha / Venda Fechada</strong>.
          </p>
        </div>
      </div>
    </div>
  );
};
