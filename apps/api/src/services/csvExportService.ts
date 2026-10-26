import { store } from '../db/store';
import { calcularCTR, calcularCPC, calcularCPA, calcularROAS } from '@dashboard/shared';

export function gerarCsvMetricas(clienteId: string, inicio: string, fim: string): string {
  const fatosAds = store.fatosAds.filter(
    (f) => f.clienteId === clienteId && f.data >= inicio && f.data <= fim
  );

  const linhas: string[] = [];

  // Cabeçalho CSV
  linhas.push(
    [
      'Data',
      'Canal',
      'Campanha',
      'Investimento (R$)',
      'Impressoes',
      'Cliques',
      'CTR (%)',
      'CPC (R$)',
      'Conversoes',
      'CPA (R$)',
      'Valor Conversao (R$)',
      'ROAS',
    ].join(';')
  );

  fatosAds.forEach((f) => {
    const ctr = calcularCTR(f.cliques, f.impressoes);
    const cpc = calcularCPC(f.investimento, f.cliques);
    const cpa = calcularCPA(f.conversoes, f.investimento);
    const roas = calcularROAS(f.valorConversao, f.investimento);

    linhas.push(
      [
        f.data,
        f.canal === 'google_ads' ? 'Google Ads' : 'Meta Ads',
        `"${f.campanhaNome.replace(/"/g, '""')}"`,
        f.investimento.toFixed(2).replace('.', ','),
        f.impressoes,
        f.cliques,
        ctr.toFixed(2).replace('.', ','),
        cpc.toFixed(2).replace('.', ','),
        f.conversoes,
        cpa.toFixed(2).replace('.', ','),
        f.valorConversao.toFixed(2).replace('.', ','),
        roas.toFixed(2).replace('.', ','),
      ].join(';')
    );
  });

  // Prefixo BOM (\uFEFF) para compatibilidade perfeita com o Microsoft Excel no Brasil
  return '\uFEFF' + linhas.join('\r\n');
}

