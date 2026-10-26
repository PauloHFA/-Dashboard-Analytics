import { AlertaMetrica } from '@dashboard/shared';
import { store } from '../db/store';
import { consolidarResumo } from './metricsService';

export function avaliarAlertasCliente(clienteId: string, inicio: string, fim: string): AlertaMetrica[] {
  const alertas: AlertaMetrica[] = [];
  const meta = store.metas.find((m) => m.clienteId === clienteId);
  const conexoes = store.contas.filter((c) => c.clienteId === clienteId);

  // 1. Alertas de Conexão e Frescor (RF-10)
  conexoes.forEach((c) => {
    if (c.status === 'requer_reconexao') {
      alertas.push({
        id: `alt-conn-${c.id}`,
        clienteId,
        tipo: 'conexao',
        severidade: 'critico',
        titulo: `Conexão Pendente: ${c.nome}`,
        mensagem: c.mensagemErro || 'O token de autenticação expirou. É necessária reconexão OAuth.',
        metricaAtual: 0,
        limite: 0,
        criadoEm: new Date().toISOString(),
      });
    } else if (c.status === 'erro') {
      alertas.push({
        id: `alt-conn-err-${c.id}`,
        clienteId,
        tipo: 'conexao',
        severidade: 'critico',
        titulo: `Erro na Sincronização: ${c.nome}`,
        mensagem: 'Falha de comunicação ao buscar dados mais recentes na API.',
        metricaAtual: 0,
        limite: 0,
        criadoEm: new Date().toISOString(),
      });
    }
  });

  if (!meta) {
    return alertas;
  }

  // 2. Alertas de Métricas e KPIs (RF-16)
  const resumo = consolidarResumo(clienteId, inicio, fim);

  // Alerta de CPA (Custo por Aquisição)
  if (meta.cpaMaximo > 0 && resumo.cpaMedio > meta.cpaMaximo) {
    const severidade = resumo.cpaMedio > meta.cpaMaximo * 1.25 ? 'critico' : 'aviso';
    alertas.push({
      id: `alt-cpa-${clienteId}`,
      clienteId,
      tipo: 'cpa',
      severidade,
      titulo: 'CPA Acima do Teto Definido',
      mensagem: `O custo por conversão atual de R$ ${resumo.cpaMedio.toFixed(2)} ultrapassou a meta de R$ ${meta.cpaMaximo.toFixed(2)}.`,
      metricaAtual: resumo.cpaMedio,
      limite: meta.cpaMaximo,
      criadoEm: new Date().toISOString(),
    });
  }

  // Alerta de CTR (Click-Through Rate)
  if (meta.ctrMinimo > 0 && resumo.ctrMedio < meta.ctrMinimo) {
    alertas.push({
      id: `alt-ctr-${clienteId}`,
      clienteId,
      tipo: 'ctr',
      severidade: 'aviso',
      titulo: 'CTR Abaixo da Meta',
      mensagem: `A taxa de cliques consolidada está em ${resumo.ctrMedio.toFixed(2)}%, abaixo da meta mínima de ${meta.ctrMinimo.toFixed(2)}%.`,
      metricaAtual: resumo.ctrMedio,
      limite: meta.ctrMinimo,
      criadoEm: new Date().toISOString(),
    });
  }

  // Alerta de ROAS (Retorno s/ Investimento de Anúncios)
  if (meta.roasMinimo > 0 && resumo.roas < meta.roasMinimo) {
    alertas.push({
      id: `alt-roas-${clienteId}`,
      clienteId,
      tipo: 'roas',
      severidade: 'critico',
      titulo: 'ROAS Abaixo do Esperado',
      mensagem: `O ROAS atual de ${resumo.roas.toFixed(2)}x está aquém do objetivo de rentabilidade de ${meta.roasMinimo.toFixed(2)}x.`,
      metricaAtual: resumo.roas,
      limite: meta.roasMinimo,
      criadoEm: new Date().toISOString(),
    });
  }

  return alertas;
}

