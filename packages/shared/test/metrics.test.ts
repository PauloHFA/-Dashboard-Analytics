import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calcularCTR,
  calcularCPC,
  calcularCPM,
  calcularCPA,
  calcularROAS,
  calcularROI,
  calcularCAC,
  calcularTaxaEngajamento,
  calcularVariacao,
} from '../src/utils/metrics';

test('Dicionário de Métricas - Fórmulas e Regras de Agregação', async (t) => {
  await t.test('deve calcular CTR corretamente (Cliques / Impressões * 100)', () => {
    // 250 cliques em 10.000 impressões = 2.5%
    const ctr = calcularCTR(250, 10000);
    assert.equal(ctr, 2.5);
  });

  await t.test('deve calcular CPC médio corretamente', () => {
    // R$ 500 para 250 cliques = R$ 2.00 por clique
    const cpc = calcularCPC(500, 250);
    assert.equal(cpc, 2);
  });

  await t.test('deve calcular CPM médio corretamente', () => {
    // R$ 500 para 100.000 impressões = R$ 5.00 por mil
    const cpm = calcularCPM(500, 100000);
    assert.equal(cpm, 5);
  });

  await t.test('deve calcular CPA médio corretamente', () => {
    // R$ 1.200 para 40 conversões = R$ 30.00 por conversão
    const cpa = calcularCPA(1200, 40);
    assert.equal(cpa, 30);
  });

  await t.test('deve calcular ROAS corretamente (Receita / Custo de Mídia)', () => {
    // R$ 10.000 de receita para R$ 2.500 investidos em ads = 4.0x
    const roas = calcularROAS(10000, 2500);
    assert.equal(roas, 4);
  });

  await t.test('deve calcular ROI fiel com base em custos totais', () => {
    // Receita R$ 15.000, Custos R$ 10.000 => Lucro R$ 5.000 => ROI 50%
    const roi = calcularROI(15000, 10000);
    assert.equal(roi, 50);
  });

  await t.test('deve calcular CAC a partir de novos clientes do CRM/manual', () => {
    // R$ 3.000 investidos e 6 novos clientes = R$ 500 por novo cliente
    const cac = calcularCAC(3000, 6);
    assert.equal(cac, 500);
  });

  await t.test('deve calcular Taxa de Engajamento do Instagram (Interações / Alcance * 100)', () => {
    const engajamento = calcularTaxaEngajamento(350, 5000);
    assert.equal(engajamento, 7);
  });

  await t.test('deve tratar divisão por zero com segurança sem gerar NaN ou Infinity', () => {
    assert.equal(calcularCTR(100, 0), 0);
    assert.equal(calcularCPA(1000, 0), 0);
    assert.equal(calcularCAC(1000, 0), 0);
    assert.equal(calcularROAS(5000, 0), 0);
  });
});

test('Comparativo de Períodos e Semântica Invertida de Custos', async (t) => {
  await t.test('aumento de receita deve ser classificado como positivo', () => {
    const varReceita = calcularVariacao(12000, 10000, false);
    assert.equal(varReceita.diferencaPercentual, 20);
    assert.equal(varReceita.positivo, true);
  });

  await t.test('queda de CPA/Custo deve ser classificada como POSITIVA (verde)', () => {
    // CPA caiu de R$ 40 para R$ 30 (queda de 25%)
    const varCPA = calcularVariacao(30, 40, true);
    assert.equal(varCPA.diferencaPercentual, -25);
    assert.equal(varCPA.positivo, true); // Menor custo é bom!
  });

  await t.test('aumento de CPA/Custo deve ser classificado como NEGATIVO (vermelho)', () => {
    // CPA subiu de R$ 30 para R$ 45
    const varCPA = calcularVariacao(45, 30, true);
    assert.equal(varCPA.diferencaPercentual, 50);
    assert.equal(varCPA.positivo, false); // Custo subiu = alerta
  });
});

