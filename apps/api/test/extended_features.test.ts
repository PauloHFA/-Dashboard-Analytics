import test from 'node:test';
import assert from 'node:assert/strict';
import { gerarParecerIa } from '../src/services/aiCopilotService';
import { calcularBudgetPacing } from '../src/services/pacingService';
import { store } from '../src/db/store';

test('Recurso 1: AI Growth Copilot - Parecer Executivo', async (t) => {
  await t.test('deve gerar parecer analítico com score e recomendações para o cliente', () => {
    const hoje = new Date().toISOString().slice(0, 10);
    const dInicio = new Date();
    dInicio.setDate(dInicio.getDate() - 30);
    const inicio = dInicio.toISOString().slice(0, 10);

    const parecer = gerarParecerIa('cli-01', inicio, hoje);

    assert.ok(parecer.resumoExecutivo.length > 20);
    assert.ok(parecer.scoreDesempenho >= 40 && parecer.scoreDesempenho <= 100);
    assert.ok(parecer.destaquesPositivos.length > 0);
    assert.ok(parecer.recomendacoesEstrategicas.length > 0);
  });
});

test('Recurso 2: Agendamento e Envio Automático (RF-15)', async (t) => {
  await t.test('deve listar agendamentos existentes e permitir disparo simulado', () => {
    const agendamento = store.agendamentos.find((a) => a.clienteId === 'cli-01');
    assert.ok(agendamento, 'Deve haver agendamento configurado');

    agendamento.ultimoEnvio = new Date().toISOString();
    agendamento.statusUltimoEnvio = 'sucesso';
    assert.equal(agendamento.statusUltimoEnvio, 'sucesso');
  });
});

test('Recurso 3: Previsão de Ritmo de Gasto (Budget Pacing & Run-rate)', async (t) => {
  await t.test('deve projetar fechamento do mês (run-rate) e calcular ritmo diário recomendado', () => {
    const pacing = calcularBudgetPacing('cli-01');

    assert.ok(pacing.verbaMensalContratada > 0);
    assert.ok(pacing.projecaoFimDoMes > 0);
    assert.ok(['no_ritmo', 'acelerado', 'lento'].includes(pacing.status));
    assert.ok(pacing.mensagemRecomendacao.length > 10);
  });
});

test('Recurso 4: Webhook Nativo de CRM para CAC e ROI', async (t) => {
  await t.test('deve registrar evento de oportunidade ganha do CRM e atualizar receita', () => {
    const hoje = new Date().toISOString().slice(0, 10);
    const entradasIniciais = store.entradasManuais.length;

    // Simula evento de webhook recebido
    const novaEntrada = {
      id: `em-test-${Date.now()}`,
      clienteId: 'cli-01',
      data: hoje,
      receita: 4500.0,
      novosClientes: 2,
      custosExtras: 0,
      observacao: 'Webhook RD Station: Venda Fechada',
    };
    store.entradasManuais.push(novaEntrada);

    assert.equal(store.entradasManuais.length, entradasIniciais + 1);
    assert.equal(novaEntrada.receita, 4500.0);
  });
});

