import { store } from '../db/store';

export interface BudgetPacingResultado {
  clienteId: string;
  mesReferencia: string; // YYYY-MM
  verbaMensalContratada: number;
  gastoAtualAteHoje: number;
  gastoEsperadoAteHoje: number;
  projecaoFimDoMes: number; // Run-rate
  ritmoDiarioMedioAtual: number;
  ritmoDiarioRecomendado: number; // Para atingir os 100% exatos
  diasDecorridos: number;
  diasRestantes: number;
  diasNoMes: number;
  desvioPercentual: number;
  status: 'no_ritmo' | 'acelerado' | 'lento';
  mensagemRecomendacao: string;
}

export function calcularBudgetPacing(clienteId: string, dataReferencia: Date = new Date()): BudgetPacingResultado {
  const ano = dataReferencia.getFullYear();
  const mes = dataReferencia.getMonth(); // 0 a 11
  const diaHoje = dataReferencia.getDate();

  const mesStr = String(mes + 1).padStart(2, '0');
  const mesReferencia = `${ano}-${mesStr}`;

  // Quantidade de dias no mês
  const ultimoDiaMes = new Date(ano, mes + 1, 0).getDate();
  const diasDecorridos = Math.max(1, diaHoje);
  const diasRestantes = Math.max(0, ultimoDiaMes - diasDecorridos);

  // Meta do cliente
  const meta = store.metas.find((m) => m.clienteId === clienteId);
  const verbaContratada = meta?.investimentoMaximoMensal || 15000.0;

  // Filtrar gastos no mês corrente
  const inicioMes = `${mesReferencia}-01`;
  const fimMes = `${mesReferencia}-${String(ultimoDiaMes).padStart(2, '0')}`;

  const adsMes = store.fatosAds.filter(
    (f) => f.clienteId === clienteId && f.data >= inicioMes && f.data <= fimMes
  );

  let gastoAtual = 0;
  adsMes.forEach((a) => {
    gastoAtual += a.investimento;
  });

  // Se estiver zerado (ex: início do mês em simulação), pega os últimos 30 dias normalizados
  if (gastoAtual === 0) {
    const d30 = new Date(dataReferencia);
    d30.setDate(d30.getDate() - 30);
    const d30Str = d30.toISOString().slice(0, 10);
    const ads30 = store.fatosAds.filter((f) => f.clienteId === clienteId && f.data >= d30Str);
    let gasto30 = 0;
    ads30.forEach((a) => (gasto30 += a.investimento));
    gastoAtual = Number(((gasto30 / 30) * diasDecorridos).toFixed(2));
  }

  const ritmoDiarioMedioAtual = Number((gastoAtual / diasDecorridos).toFixed(2));
  const gastoEsperadoAteHoje = Number(((verbaContratada / ultimoDiaMes) * diasDecorridos).toFixed(2));
  const projecaoFimDoMes = Number((gastoAtual + ritmoDiarioMedioAtual * diasRestantes).toFixed(2));

  const saldoRestante = Math.max(0, verbaContratada - gastoAtual);
  const ritmoDiarioRecomendado = diasRestantes > 0 ? Number((saldoRestante / diasRestantes).toFixed(2)) : 0;

  const desvioPercentual = verbaContratada > 0
    ? Number((((projecaoFimDoMes - verbaContratada) / verbaContratada) * 100).toFixed(1))
    : 0;

  let status: 'no_ritmo' | 'acelerado' | 'lento' = 'no_ritmo';
  let mensagemRecomendacao = '';

  if (desvioPercentual > 8) {
    status = 'acelerado';
    mensagemRecomendacao = `Gasto acima do ritmo planejado (+${desvioPercentual}%). Reduza os lances/orçamento diário para R$ ${ritmoDiarioRecomendado.toFixed(2)}/dia para não esgotar a verba antes do dia ${ultimoDiaMes}.`;
  } else if (desvioPercentual < -8) {
    status = 'lento';
    mensagemRecomendacao = `Gasto abaixo do ritmo contratado (${desvioPercentual}%). Eleve o orçamento para R$ ${ritmoDiarioRecomendado.toFixed(2)}/dia para garantir o atingimento integral das metas de tráfego.`;
  } else {
    status = 'no_ritmo';
    mensagemRecomendacao = `Pacing perfeitamente calibrado! O ritmo diário de R$ ${ritmoDiarioMedioAtual.toFixed(2)} atingirá a meta com margem de segurança de ${desvioPercentual}%.`;
  }

  return {
    clienteId,
    mesReferencia,
    verbaMensalContratada: verbaContratada,
    gastoAtualAteHoje: Number(gastoAtual.toFixed(2)),
    gastoEsperadoAteHoje,
    projecaoFimDoMes,
    ritmoDiarioMedioAtual,
    ritmoDiarioRecomendado,
    diasDecorridos,
    diasRestantes,
    diasNoMes: ultimoDiaMes,
    desvioPercentual,
    status,
    mensagemRecomendacao,
  };
}
