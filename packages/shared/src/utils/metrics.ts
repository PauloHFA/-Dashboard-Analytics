import { VariacaoMetrica } from '../types';

/**
 * Funções seguras de divisão matemática para evitar Infinity ou NaN
 */
export function divisaoSegura(numerador: number, denominador: number, padrao: number = 0): number {
  if (!denominador || isNaN(denominador) || denominador === 0) {
    return padrao;
  }
  return numerador / denominador;
}

/**
 * Cálculo de CTR (Click-Through Rate em %)
 * Fórmula: (Cliques / Impressões) * 100
 */
export function calcularCTR(cliques: number, impressoes: number): number {
  return Number((divisaoSegura(cliques, impressoes) * 100).toFixed(2));
}

/**
 * Cálculo de CPC (Custo por Clique em R$)
 * Fórmula: Custo / Cliques
 */
export function calcularCPC(custo: number, cliques: number): number {
  return Number(divisaoSegura(custo, cliques).toFixed(2));
}

/**
 * Cálculo de CPM (Custo por Mil Impressões em R$)
 * Fórmula: (Custo / Impressões) * 1000
 */
export function calcularCPM(custo: number, impressoes: number): number {
  return Number((divisaoSegura(custo, impressoes) * 1000).toFixed(2));
}

/**
 * Cálculo de CPA (Custo por Aquisição / Conversão em R$)
 * Fórmula: Custo / Conversões
 */
export function calcularCPA(custo: number, conversoes: number): number {
  return Number(divisaoSegura(custo, conversoes).toFixed(2));
}

/**
 * Cálculo de ROAS (Return on Ad Spend)
 * Fórmula: Receita / Custo de Mídia
 */
export function calcularROAS(receita: number, custoMidia: number): number {
  return Number(divisaoSegura(receita, custoMidia).toFixed(2));
}

/**
 * Cálculo de ROI (Retorno sobre Investimento total em %)
 * Fórmula: ((Receita - Custos Totais) / Custos Totais) * 100
 */
export function calcularROI(receita: number, custosTotais: number): number {
  if (!custosTotais || custosTotais === 0) return 0;
  return Number((((receita - custosTotais) / custosTotais) * 100).toFixed(2));
}

/**
 * Cálculo de CAC (Custo de Aquisição de Cliente em R$)
 * Requer novos clientes vindos de CRM ou entradas manuais
 * Fórmula: Investimento / Novos Clientes
 */
export function calcularCAC(investimento: number, novosClientes: number): number {
  return Number(divisaoSegura(investimento, novosClientes).toFixed(2));
}

/**
 * Cálculo de Taxa de Conversão em %
 * Fórmula: (Conversões / Total de Sessões ou Cliques) * 100
 */
export function calcularTaxaConversao(conversoes: number, sessoesOuCliques: number): number {
  return Number((divisaoSegura(conversoes, sessoesOuCliques) * 100).toFixed(2));
}

/**
 * Cálculo de Taxa de Engajamento Instagram em %
 * Fórmula: (Interações / Alcance) * 100
 */
export function calcularTaxaEngajamento(interacoes: number, alcance: number): number {
  return Number((divisaoSegura(interacoes, alcance) * 100).toFixed(2));
}

/**
 * Calcula a variação absoluta e percentual entre dois períodos
 * @param atual Valor no período atual
 * @param anterior Valor no período de comparação
 * @param menorMelhor Se true (ex: CPA, CPC, Custos), uma queda de valor é considerada POSITIVA (verde)
 */
export function calcularVariacao(atual: number, anterior: number, menorMelhor: boolean = false): VariacaoMetrica {
  const diferencaAbsoluta = atual - anterior;
  let diferencaPercentual = 0;

  if (anterior !== 0) {
    diferencaPercentual = Number(((diferencaAbsoluta / Math.abs(anterior)) * 100).toFixed(1));
  } else if (atual > 0) {
    diferencaPercentual = 100;
  }

  // Se 'menorMelhor' for true (CPA, CPC, CAC), então valor diminuiu => positivo (bom)
  const positivo = menorMelhor ? diferencaAbsoluta <= 0 : diferencaAbsoluta >= 0;

  return {
    atual,
    anterior,
    diferencaAbsoluta: Number(diferencaAbsoluta.toFixed(2)),
    diferencaPercentual,
    positivo,
  };
}

/**
 * Formatação de moeda no padrão brasileiro (R$ 1.234,56)
 */
export function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor || 0);
}

/**
 * Formatação de números inteiros no padrão brasileiro (1.234)
 */
export function formatarNumero(valor: number): string {
  return new Intl.NumberFormat('pt-BR').format(valor || 0);
}

/**
 * Formatação de percentual (12,34%)
 */
export function formatarPercentual(valor: number): string {
  return `${(valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}%`;
}

