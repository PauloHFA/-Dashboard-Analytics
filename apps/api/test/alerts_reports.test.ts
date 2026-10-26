import test from 'node:test';
import assert from 'node:assert/strict';
import { avaliarAlertasCliente } from '../src/services/alertService';
import { gerarCsvMetricas } from '../src/services/csvExportService';
import { store } from '../src/db/store';

test('Módulo de Alertas Inteligentes e Metas (RF-16 do PDF)', async (t) => {
  await t.test('deve identificar alerta crítico de conexão requerendo reconexão (cli-02)', () => {
    // Moda Urbana (cli-02) possui conta com status 'requer_reconexao'
    const hoje = new Date().toISOString().slice(0, 10);
    const dInicio = new Date();
    dInicio.setDate(dInicio.getDate() - 30);
    const inicio = dInicio.toISOString().slice(0, 10);

    const alertas = avaliarAlertasCliente('cli-02', inicio, hoje);
    const alertaConexao = alertas.find((a) => a.tipo === 'conexao');

    assert.ok(alertaConexao, 'Deve detectar conta que requer reconexão');
    assert.equal(alertaConexao?.severidade, 'critico');
    assert.match(alertaConexao?.mensagem, /Token de usuário/);
  });

  await t.test('deve gerar alerta de CPA caso ultrapasse o limite configurado na meta', () => {
    const hoje = new Date().toISOString().slice(0, 10);
    const dInicio = new Date();
    dInicio.setDate(dInicio.getDate() - 30);
    const inicio = dInicio.toISOString().slice(0, 10);

    // Forçar meta com teto muito baixo de R$ 5,00 para disparar alerta
    const metaExistente = store.metas.find((m) => m.clienteId === 'cli-01');
    assert.ok(metaExistente);
    const cpaOriginal = metaExistente.cpaMaximo;
    metaExistente.cpaMaximo = 5.0; // teto irreal

    const alertas = avaliarAlertasCliente('cli-01', inicio, hoje);
    const alertaCpa = alertas.find((a) => a.tipo === 'cpa');

    assert.ok(alertaCpa, 'Deve disparar alerta de CPA estourado');
    assert.equal(alertaCpa?.limite, 5.0);

    // Restaurar
    metaExistente.cpaMaximo = cpaOriginal;
  });
});

test('Exportação de Métricas em CSV (RF-17 do PDF)', async (t) => {
  await t.test('deve gerar conteúdo CSV formatado com cabeçalho e separador ponto-e-vírgula', () => {
    const hoje = new Date().toISOString().slice(0, 10);
    const dInicio = new Date();
    dInicio.setDate(dInicio.getDate() - 30);
    const inicio = dInicio.toISOString().slice(0, 10);

    const csv = gerarCsvMetricas('cli-01', inicio, hoje);

    assert.ok(csv.startsWith('\uFEFF'), 'Deve conter BOM UTF-8 para o Excel');
    assert.match(csv, /Data;Canal;Campanha;Investimento/);
    assert.match(csv, /Google Ads|Meta Ads/);

    const linhas = csv.trim().split('\r\n');
    assert.ok(linhas.length > 5, 'Deve conter linhas de dados de campanha');
  });
});
