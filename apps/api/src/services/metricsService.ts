import {
  ResumoMetricas,
  VariacaoMetrica,
  PontoSerieTemporal,
  SerieComparativa,
  MetricasPorCanal,
  ResumoCampanha,
  calcularCTR,
  calcularCPC,
  calcularCPM,
  calcularCPA,
  calcularROAS,
  calcularROI,
  calcularCAC,
  calcularTaxaEngajamento,
  calcularVariacao,
} from '@dashboard/shared';
import { store } from '../db/store';

export interface ParametrosConsultaMetricas {
  clienteId: string;
  inicio: string;
  fim: string;
  canais?: string[];
  comparar?: 'nenhum' | 'anterior' | 'ano_anterior';
  granularidade?: 'dia' | 'semana' | 'mes';
}

function filtrarPorJanela<T extends { data: string; clienteId: string }>(
  dados: T[],
  clienteId: string,
  inicio: string,
  fim: string
): T[] {
  return dados.filter((d) => d.clienteId === clienteId && d.data >= inicio && d.data <= fim);
}

function calcularDatasComparativas(inicio: string, fim: string, modo: 'anterior' | 'ano_anterior') {
  const dInicio = new Date(inicio);
  const dFim = new Date(fim);
  const duracaoMs = dFim.getTime() - dInicio.getTime();
  const diasDuracao = Math.round(duracaoMs / (1000 * 60 * 60 * 24)) + 1;

  if (modo === 'ano_anterior') {
    const dInicioAno = new Date(dInicio);
    dInicioAno.setFullYear(dInicio.getFullYear() - 1);
    const dFimAno = new Date(dFim);
    dFimAno.setFullYear(dFim.getFullYear() - 1);
    return {
      inicioComp: dInicioAno.toISOString().slice(0, 10),
      fimComp: dFimAno.toISOString().slice(0, 10),
    };
  }

  // modo 'anterior'
  const dFimAnt = new Date(dInicio);
  dFimAnt.setDate(dInicio.getDate() - 1);
  const dInicioAnt = new Date(dFimAnt);
  dInicioAnt.setDate(dFimAnt.getDate() - (diasDuracao - 1));

  return {
    inicioComp: dInicioAnt.toISOString().slice(0, 10),
    fimComp: dFimAnt.toISOString().slice(0, 10),
  };
}

export function consolidarResumo(
  clienteId: string,
  inicio: string,
  fim: string,
  canaisSelecionados?: string[]
): ResumoMetricas {
  const canais = canaisSelecionados && canaisSelecionados.length > 0 ? canaisSelecionados : ['google_ads', 'meta_ads', 'ga4', 'instagram'];

  // Ads
  const adsFiltrados = filtrarPorJanela(store.fatosAds, clienteId, inicio, fim).filter((a) =>
    canais.includes(a.canal)
  );

  let investimentoTotal = 0;
  let impressoesTotal = 0;
  let cliquesTotal = 0;
  let conversoesAds = 0;
  let valorConversaoAds = 0;

  adsFiltrados.forEach((a) => {
    investimentoTotal += a.investimento;
    impressoesTotal += a.impressoes;
    cliquesTotal += a.cliques;
    conversoesAds += a.conversoes;
    valorConversaoAds += a.valorConversao;
  });

  // GA4
  const ga4Filtrados = filtrarPorJanela(store.fatosGA4, clienteId, inicio, fim);
  let sessoesGA4 = 0;
  let usuariosGA4 = 0;
  let conversoesGA4 = 0;
  let receitaGA4 = 0;

  if (canais.includes('ga4')) {
    ga4Filtrados.forEach((g) => {
      sessoesGA4 += g.sessoes;
      usuariosGA4 += g.usuarios;
      conversoesGA4 += g.conversoes;
      receitaGA4 += g.receita;
    });
  }

  // Instagram
  const instaFiltrados = filtrarPorJanela(store.fatosInstagram, clienteId, inicio, fim);
  let viewsInstagram = 0;
  let alcanceInstagram = 0;
  let interacoesInstagram = 0;

  if (canais.includes('instagram')) {
    instaFiltrados.forEach((i) => {
      viewsInstagram += i.views;
      alcanceInstagram += i.alcance;
      interacoesInstagram += i.interacoes;
    });
  }

  // Entradas Manuais (para cálculo fiel de CAC e ROI)
  const entradas = filtrarPorJanela(store.entradasManuais, clienteId, inicio, fim);
  let receitaManual = 0;
  let novosClientesTotal = 0;
  let custosExtrasTotal = 0;

  entradas.forEach((e) => {
    receitaManual += e.receita;
    novosClientesTotal += e.novosClientes;
    custosExtrasTotal += e.custosExtras;
  });

  // Regra de atribuição do cliente (Seção 4.3 do PDF)
  const cliente = store.clientes.find((c) => c.id === clienteId);
  const conversoesTotal = cliente?.fontePrimariaConversoes === 'ga4' && sessoesGA4 > 0 ? conversoesGA4 : conversoesAds;

  const receitaTotal = receitaGA4 > 0 ? receitaGA4 : (valorConversaoAds + receitaManual);
  const custosTotais = investimentoTotal + custosExtrasTotal;

  return {
    investimentoTotal: Number(investimentoTotal.toFixed(2)),
    impressoesTotal,
    cliquesTotal,
    ctrMedio: calcularCTR(cliquesTotal, impressoesTotal),
    cpcMedio: calcularCPC(investimentoTotal, cliquesTotal),
    cpmMedio: calcularCPM(investimentoTotal, impressoesTotal),
    conversoesTotal,
    cpaMedio: calcularCPA(investimentoTotal, conversoesTotal),
    receitaTotal: Number(receitaTotal.toFixed(2)),
    roas: calcularROAS(receitaTotal, investimentoTotal),
    roi: calcularROI(receitaTotal, custosTotais),
    cac: calcularCAC(investimentoTotal, novosClientesTotal),
    novosClientes: novosClientesTotal,
    sessoesGA4,
    usuariosGA4,
    viewsInstagram,
    alcanceInstagram,
    engajamentoInstagram: calcularTaxaEngajamento(interacoesInstagram, alcanceInstagram),
  };
}

export function obterResumoComComparativo(params: ParametrosConsultaMetricas): {
  resumoAtual: ResumoMetricas;
  resumoComparativo?: ResumoMetricas;
  variacoes?: Record<string, VariacaoMetrica>;
  periodoAtual: { inicio: string; fim: string };
  periodoComparativo?: { inicio: string; fim: string };
} {
  const resumoAtual = consolidarResumo(params.clienteId, params.inicio, params.fim, params.canais);

  if (!params.comparar || params.comparar === 'nenhum') {
    return { resumoAtual, periodoAtual: { inicio: params.inicio, fim: params.fim } };
  }

  const { inicioComp, fimComp } = calcularDatasComparativas(params.inicio, params.fim, params.comparar);
  const resumoComparativo = consolidarResumo(params.clienteId, inicioComp, fimComp, params.canais);

  // Mapeamento das variações com semântica de cores apropriada
  const variacoes: Record<string, VariacaoMetrica> = {
    investimento: calcularVariacao(resumoAtual.investimentoTotal, resumoComparativo.investimentoTotal, false),
    cliques: calcularVariacao(resumoAtual.cliquesTotal, resumoComparativo.cliquesTotal, false),
    ctr: calcularVariacao(resumoAtual.ctrMedio, resumoComparativo.ctrMedio, false),
    cpc: calcularVariacao(resumoAtual.cpcMedio, resumoComparativo.cpcMedio, true), // Menor é melhor (positivo se cair)
    conversoes: calcularVariacao(resumoAtual.conversoesTotal, resumoComparativo.conversoesTotal, false),
    cpa: calcularVariacao(resumoAtual.cpaMedio, resumoComparativo.cpaMedio, true), // Menor é melhor
    receita: calcularVariacao(resumoAtual.receitaTotal, resumoComparativo.receitaTotal, false),
    roas: calcularVariacao(resumoAtual.roas, resumoComparativo.roas, false),
    roi: calcularVariacao(resumoAtual.roi, resumoComparativo.roi, false),
    cac: calcularVariacao(resumoAtual.cac, resumoComparativo.cac, true), // Menor é melhor
    sessoes: calcularVariacao(resumoAtual.sessoesGA4, resumoComparativo.sessoesGA4, false),
    viewsInstagram: calcularVariacao(resumoAtual.viewsInstagram, resumoComparativo.viewsInstagram, false),
  };

  return {
    resumoAtual,
    resumoComparativo,
    variacoes,
    periodoAtual: { inicio: params.inicio, fim: params.fim },
    periodoComparativo: { inicio: inicioComp, fim: fimComp },
  };
}

export function gerarSerieTemporal(params: ParametrosConsultaMetricas): SerieComparativa {
  const canais = params.canais && params.canais.length > 0 ? params.canais : ['google_ads', 'meta_ads', 'ga4', 'instagram'];

  function agruparPorData(inicio: string, fim: string): PontoSerieTemporal[] {
    const pontosMap = new Map<string, PontoSerieTemporal>();

    // Inicializar todos os dias do intervalo
    const dAtual = new Date(inicio);
    const dFim = new Date(fim);
    while (dAtual <= dFim) {
      const dStr = dAtual.toISOString().slice(0, 10);
      const partes = dStr.split('-');
      const labelFormatado = `${partes[2]}/${partes[1]}`;
      pontosMap.set(dStr, {
        data: labelFormatado,
        dataCompleta: dStr,
        investimento: 0,
        cliques: 0,
        impressoes: 0,
        conversoes: 0,
        receita: 0,
        sessoes: 0,
        viewsInstagram: 0,
      });
      dAtual.setDate(dAtual.getDate() + 1);
    }

    // Acumular Ads
    const ads = filtrarPorJanela(store.fatosAds, params.clienteId, inicio, fim).filter((a) =>
      canais.includes(a.canal)
    );
    ads.forEach((a) => {
      const p = pontosMap.get(a.data);
      if (p) {
        p.investimento += a.investimento;
        p.cliques += a.cliques;
        p.impressoes += a.impressoes;
        p.conversoes += a.conversoes;
        p.receita += a.valorConversao;
      }
    });

    // Acumular GA4
    if (canais.includes('ga4')) {
      const ga4 = filtrarPorJanela(store.fatosGA4, params.clienteId, inicio, fim);
      ga4.forEach((g) => {
        const p = pontosMap.get(g.data);
        if (p) {
          p.sessoes += g.sessoes;
          if (g.receita > 0) p.receita += g.receita;
        }
      });
    }

    // Acumular Instagram
    if (canais.includes('instagram')) {
      const insta = filtrarPorJanela(store.fatosInstagram, params.clienteId, inicio, fim);
      insta.forEach((i) => {
        const p = pontosMap.get(i.data);
        if (p) {
          p.viewsInstagram += i.views;
        }
      });
    }

    return Array.from(pontosMap.values());
  }

  const serieAtual = agruparPorData(params.inicio, params.fim);

  let serieComparativa: PontoSerieTemporal[] = [];
  if (params.comparar && params.comparar !== 'nenhum') {
    const { inicioComp, fimComp } = calcularDatasComparativas(params.inicio, params.fim, params.comparar);
    serieComparativa = agruparPorData(inicioComp, fimComp);
  }

  return {
    atual: serieAtual,
    comparativo: serieComparativa,
  };
}

export function obterMetricasPorCanal(params: ParametrosConsultaMetricas): MetricasPorCanal[] {
  const ads = filtrarPorJanela(store.fatosAds, params.clienteId, params.inicio, params.fim);
  const ga4 = filtrarPorJanela(store.fatosGA4, params.clienteId, params.inicio, params.fim);

  const dadosGAds = ads.filter((a) => a.canal === 'google_ads');
  const dadosMeta = ads.filter((a) => a.canal === 'meta_ads');

  const calcCanalAds = (dados: typeof ads, canal: 'google_ads' | 'meta_ads', nome: string): MetricasPorCanal => {
    let inv = 0, cli = 0, conv = 0, rec = 0;
    dados.forEach((d) => {
      inv += d.investimento;
      cli += d.cliques;
      conv += d.conversoes;
      rec += d.valorConversao;
    });
    return {
      canal,
      nomeExibicao: nome,
      investimento: Number(inv.toFixed(2)),
      cliques: cli,
      conversoes: conv,
      cpa: calcularCPA(inv, conv),
      roas: calcularROAS(rec, inv),
      participacaoInvestimento: 0,
    };
  };

  const gads = calcCanalAds(dadosGAds, 'google_ads', 'Google Ads');
  const meta = calcCanalAds(dadosMeta, 'meta_ads', 'Meta Ads');

  const totalInv = gads.investimento + meta.investimento;
  if (totalInv > 0) {
    gads.participacaoInvestimento = Number(((gads.investimento / totalInv) * 100).toFixed(1));
    meta.participacaoInvestimento = Number(((meta.investimento / totalInv) * 100).toFixed(1));
  }

  // Canal GA4 (Tráfego Orgânico / Direto)
  let sessoesGA4 = 0, convGA4 = 0, recGA4 = 0;
  ga4.forEach((g) => {
    sessoesGA4 += g.sessoes;
    convGA4 += g.conversoes;
    recGA4 += g.receita;
  });

  const ga4Item: MetricasPorCanal = {
    canal: 'ga4',
    nomeExibicao: 'GA4 (Web Analytics)',
    investimento: 0,
    cliques: sessoesGA4,
    conversoes: convGA4,
    cpa: 0,
    roas: 0,
    participacaoInvestimento: 0,
  };

  return [gads, meta, ga4Item];
}

export function obterCampanhas(params: ParametrosConsultaMetricas): ResumoCampanha[] {
  const ads = filtrarPorJanela(store.fatosAds, params.clienteId, params.inicio, params.fim);

  const campanhasMap = new Map<string, ResumoCampanha>();

  ads.forEach((a) => {
    let cmp = campanhasMap.get(a.campanhaId);
    if (!cmp) {
      cmp = {
        id: a.campanhaId,
        nome: a.campanhaNome,
        canal: a.canal,
        investimento: 0,
        impressoes: 0,
        cliques: 0,
        ctr: 0,
        cpc: 0,
        conversoes: 0,
        cpa: 0,
        valorConversao: 0,
        roas: 0,
      };
      campanhasMap.set(a.campanhaId, cmp);
    }

    cmp.investimento += a.investimento;
    cmp.impressoes += a.impressoes;
    cmp.cliques += a.cliques;
    cmp.conversoes += a.conversoes;
    cmp.valorConversao += a.valorConversao;
  });

  const lista = Array.from(campanhasMap.values());
  lista.forEach((c) => {
    c.investimento = Number(c.investimento.toFixed(2));
    c.ctr = calcularCTR(c.cliques, c.impressoes);
    c.cpc = calcularCPC(c.investimento, c.cliques);
    c.cpa = calcularCPA(c.investimento, c.conversoes);
    c.roas = calcularROAS(c.valorConversao, c.investimento);
  });

  // Ordenar por maior investimento
  return lista.sort((a, b) => b.investimento - a.investimento);
}

