import { consolidarResumo, obterResumoComComparativo, obterCampanhas } from './metricsService';
import { avaliarAlertasCliente } from './alertService';
import { store } from '../db/store';
import { formatarMoeda, formatarPercentual } from '@dashboard/shared';

export interface ParecerIaResultado {
  clienteNome: string;
  periodo: { inicio: string; fim: string };
  resumoExecutivo: string;
  destaquesPositivos: string[];
  pontosDeAtencao: string[];
  recomendacoesEstrategicas: string[];
  scoreDesempenho: number; // 0 a 100
  geradoEm: string;
}

export function gerarParecerIa(
  clienteId: string,
  inicio: string,
  fim: string,
  canais?: string[]
): ParecerIaResultado {
  const cliente = store.clientes.find((c) => c.id === clienteId);
  const clienteNome = cliente ? cliente.nome : 'Cliente';

  const comparativo = obterResumoComComparativo({
    clienteId,
    inicio,
    fim,
    canais,
    comparar: 'anterior',
  });

  const campanhas = obterCampanhas({ clienteId, inicio, fim });
  const alertas = avaliarAlertasCliente(clienteId, inicio, fim);

  const atual = comparativo.resumoAtual;
  const anterior = comparativo.resumoComparativo;
  const variacoes = comparativo.variacoes;

  const destaquesPositivos: string[] = [];
  const pontosDeAtencao: string[] = [];
  const recomendacoes: string[] = [];
  let score = 75;

  // 1. Análise de Receita e ROAS
  if (atual.roas >= 3.5) {
    destaquesPositivos.push(
      `Excelente eficiência de mídia: ROAS atingiu ${atual.roas.toFixed(2)}x, gerando ${formatarMoeda(atual.receitaTotal)} em receita para um investimento de ${formatarMoeda(atual.investimentoTotal)}.`
    );
    score += 8;
  } else if (atual.roas < 2.5 && atual.investimentoTotal > 0) {
    pontosDeAtencao.push(
      `ROAS consolidado de ${atual.roas.toFixed(2)}x está abaixo do patamar ideal de rentabilidade (alvo: >= 3.0x).`
    );
    recomendacoes.push(
      'Rever a segmentação de público e focar investimentos nas campanhas de fundo de funil para elevar o ROAS.'
    );
    score -= 10;
  }

  // 2. Análise de Variação de CPA (Custo por Aquisição)
  if (variacoes?.cpa) {
    if (variacoes.cpa.diferencaPercentual < 0) {
      destaquesPositivos.push(
        `Otimização de custo por lead: CPA reduziu em ${Math.abs(variacoes.cpa.diferencaPercentual)}% vs. período anterior, ficando em ${formatarMoeda(atual.cpaMedio)} por conversão.`
      );
      score += 7;
    } else if (variacoes.cpa.diferencaPercentual > 15) {
      pontosDeAtencao.push(
        `Aumento de ${variacoes.cpa.diferencaPercentual}% no CPA médio em comparação com o período anterior.`
      );
      recomendacoes.push(
        'Pausar criativos saturados e testar novas variações de copy e criativos para frear a subida do CPA.'
      );
      score -= 8;
    }
  }

  // 3. Análise de CTR e Engajamento
  if (atual.ctrMedio >= 2.5) {
    destaquesPositivos.push(
      `Alta atratividade dos anúncios: CTR médio de ${formatarPercentual(atual.ctrMedio)}, indicando ótima ressonância dos criativos com a audiência.`
    );
    score += 5;
  } else if (atual.ctrMedio < 1.5 && atual.impressoesTotal > 0) {
    pontosDeAtencao.push(
      `Taxa de cliques (CTR) de ${formatarPercentual(atual.ctrMedio)} está abaixo da média do setor (>= 2.0%).`
    );
    recomendacoes.push(
      'Renovar os criativos e chamadas para ação (CTAs) em Meta Ads para combater o desgaste de frequência.'
    );
    score -= 5;
  }

  // 4. Análise de Melhores Campanhas
  if (campanhas.length > 0) {
    const melhorCampanha = campanhas.reduce((prev, curr) => (curr.conversoes > prev.conversoes ? curr : prev));
    destaquesPositivos.push(
      `Campanha destaque: "${melhorCampanha.nome}" foi o principal motor de resultados, gerando ${melhorCampanha.conversoes} conversões com CPA de ${formatarMoeda(melhorCampanha.cpa)}.`
    );
    recomendacoes.push(
      `Avaliar incremento gradual de 15% a 20% no orçamento da campanha "${melhorCampanha.nome}".`
    );
  }

  // 5. Análise de Alertas e Conexões
  if (alertas.length > 0) {
    alertas.forEach((alt) => {
      if (alt.tipo === 'conexao') {
        pontosDeAtencao.push(`Falha técnica na integração: ${alt.titulo} (${alt.mensagem})`);
        recomendacoes.push('Realizar reconexão imediata do canal para evitar lacuna no histórico de conversões.');
        score -= 15;
      }
    });
  }

  // Normalizar score entre 40 e 98
  score = Math.min(98, Math.max(40, score));

  // Geração do Resumo Executivo Conciso
  const tendenciaGeral = score >= 80 ? 'muito positiva' : score >= 65 ? 'estável com oportunidades claras' : 'desafiadora';
  const resumoExecutivo =
    `Durante o período de ${inicio} a ${fim}, a performance de marketing de ${clienteNome} apresentou trajetória ${tendenciaGeral}. ` +
    `Foram investidos ${formatarMoeda(atual.investimentoTotal)} em mídia de performance, resultando em ${atual.conversoesTotal} conversões e ${formatarMoeda(atual.receitaTotal)} em faturamento gerado. ` +
    (anterior ? `Comparado ao período anterior, as conversões variaram em ${variacoes?.conversoes?.diferencaPercentual || 0}%.` : '');

  return {
    clienteNome,
    periodo: { inicio, fim },
    resumoExecutivo,
    destaquesPositivos,
    pontosDeAtencao: pontosDeAtencao.length > 0 ? pontosDeAtencao : ['Nenhum ponto crítico de atenção identificado.'],
    recomendacoesEstrategicas: recomendacoes.length > 0 ? recomendacoes : ['Manter o plano de mídia atual monitorando a consistência do CPA.'],
    scoreDesempenho: score,
    geradoEm: new Date().toISOString(),
  };
}
