import express from 'express';
import cors from 'cors';
import {
  LoginSchema,
  FiltroMetricasSchema,
  EntradaManualSchema,
  AgenciaMarcaSchema,
  MetaClienteSchema,
  CriarRelatorioSchema,
  AgendamentoRelatorioSchema,
  RelatorioGerado,
  AgendamentoRelatorio,
} from '@dashboard/shared';
import { store } from './db/store';
import { authMiddleware, isolamentoClienteMiddleware } from './middleware/auth';
import {
  obterResumoComComparativo,
  gerarSerieTemporal,
  obterMetricasPorCanal,
  obterCampanhas,
} from './services/metricsService';
import { obterConector } from './connectors';
import { avaliarAlertasCliente } from './services/alertService';
import { gerarCsvMetricas } from './services/csvExportService';
import { gerarParecerIa } from './services/aiCopilotService';
import { calcularBudgetPacing } from './services/pacingService';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Endpoints de Saúde (Seção 10 do PDF)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/ready', (req, res) => {
  res.json({ status: 'ready', uptime: process.uptime() });
});

// Autenticação
app.post('/api/v1/auth/login', (req, res) => {
  const result = LoginSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(422).json({
      type: 'https://problemas.agencia.com/dados-invalidos',
      title: 'Erro de Validação',
      status: 422,
      errors: result.error.errors,
    });
  }

  const { email } = result.data;
  const usuario = store.usuarios.find((u) => u.email.toLowerCase() === email.toLowerCase());

  if (!usuario) {
    return res.status(401).json({
      type: 'https://problemas.agencia.com/credenciais-invalidas',
      title: 'Não Autorizado',
      status: 401,
      detail: 'E-mail ou senha incorretos.',
    });
  }

  res.json({
    token: usuario.id,
    usuario: {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      perfil: usuario.perfil,
      clientesIds: usuario.clientesIds,
    },
  });
});

app.get('/api/v1/auth/me', authMiddleware, (req, res) => {
  res.json({ usuario: req.usuario });
});

// Clientes
app.get('/api/v1/clientes', authMiddleware, (req, res) => {
  const usuario = req.usuario!;
  let lista = store.clientes;

  // Filtrar se perfil for gestor ou cliente
  if (usuario.perfil === 'cliente') {
    lista = store.clientes.filter((c) => usuario.clientesIds.includes(c.id));
  } else if (usuario.perfil === 'gestor') {
    lista = store.clientes.filter((c) => usuario.clientesIds.includes(c.id));
  }

  res.json({ clientes: lista, total: lista.length });
});

app.get('/api/v1/clientes/:id', authMiddleware, (req, res) => {
  const usuario = req.usuario!;
  const clienteId = req.params.id;

  if (usuario.perfil !== 'admin' && !usuario.clientesIds.includes(clienteId)) {
    return res.status(403).json({
      type: 'https://problemas.agencia.com/acesso-negado',
      title: 'Acesso Proibido',
      status: 403,
      detail: 'Você não tem permissão para visualizar este cliente.',
    });
  }

  const cliente = store.clientes.find((c) => c.id === clienteId);
  if (!cliente) {
    return res.status(404).json({ status: 404, detail: 'Cliente não encontrado' });
  }

  res.json({ cliente });
});

// Usuários
app.get('/api/v1/usuarios', authMiddleware, (req, res) => {
  if (req.usuario?.perfil !== 'admin') {
    return res.status(403).json({ status: 403, detail: 'Apenas administradores podem gerenciar usuários.' });
  }
  res.json({ usuarios: store.usuarios });
});

// Conexões
app.get('/api/v1/clientes/:id/conexoes', authMiddleware, (req, res) => {
  const clienteId = req.params.id;
  const usuario = req.usuario!;

  if (usuario.perfil !== 'admin' && !usuario.clientesIds.includes(clienteId)) {
    return res.status(403).json({ status: 403, detail: 'Acesso negado às conexões deste cliente.' });
  }

  const conexoes = store.contas.filter((c) => c.clienteId === clienteId);
  res.json({ conexoes });
});

// Sincronização sob demanda (Seção 8 e RF-10)
app.post('/api/v1/conexoes/:id/sincronizar', authMiddleware, async (req, res) => {
  const conta = store.contas.find((c) => c.id === req.params.id);
  if (!conta) {
    return res.status(404).json({ status: 404, detail: 'Conta conectada não encontrada' });
  }

  const usuario = req.usuario!;
  if (usuario.perfil !== 'admin' && !usuario.clientesIds.includes(conta.clienteId)) {
    return res.status(403).json({ status: 403, detail: 'Acesso negado para sincronizar esta conta.' });
  }

  try {
    conta.status = 'sincronizando';
    const conector = obterConector(conta.canal);
    const validacao = await conector.validarConexao(conta);

    if (!validacao.valido) {
      conta.status = 'requer_reconexao';
      conta.mensagemErro = validacao.mensagem || 'Falha de autenticação ao conectar à API.';
      return res.status(400).json({ status: 400, detalhe: conta.mensagemErro, conta });
    }

    // Atualiza status e timestamp
    conta.status = 'conectado';
    conta.mensagemErro = null;
    conta.ultimaSincronizacao = new Date().toISOString();
    conta.minutosDesdeSincronizacao = 0;

    store.sincronizacoes.unshift({
      id: `sync-${Date.now()}`,
      contaId: conta.id,
      canal: conta.canal,
      janelaInicio: '2026-03-01',
      janelaFim: '2026-03-31',
      status: 'sucesso',
      inicio: new Date().toISOString(),
      fim: new Date().toISOString(),
      linhasAfetadas: 42,
    });

    res.json({ mensagem: 'Sincronização concluída com sucesso', conta });
  } catch (err: any) {
    conta.status = 'erro';
    conta.mensagemErro = err.message;
    res.status(500).json({ status: 500, detail: err.message });
  }
});

// Métricas com Isolamento Multitenant Obrigatório
app.get('/api/v1/metricas/resumo', authMiddleware, isolamentoClienteMiddleware, (req, res) => {
  const query = {
    ...req.query,
    clienteId: req.clienteIdPermitido,
  };

  const parsed = FiltroMetricasSchema.safeParse(query);
  if (!parsed.success) {
    return res.status(422).json({ status: 422, errors: parsed.error.errors });
  }

  const { clienteId, inicio, fim, canais, comparar } = parsed.data;
  const canaisArray = canais ? canais.split(',') : undefined;

  const resultado = obterResumoComComparativo({
    clienteId,
    inicio,
    fim,
    canais: canaisArray,
    comparar,
  });

  res.json(resultado);
});

app.get('/api/v1/metricas/serie', authMiddleware, isolamentoClienteMiddleware, (req, res) => {
  const query = {
    ...req.query,
    clienteId: req.clienteIdPermitido,
  };

  const parsed = FiltroMetricasSchema.safeParse(query);
  if (!parsed.success) {
    return res.status(422).json({ status: 422, errors: parsed.error.errors });
  }

  const { clienteId, inicio, fim, canais, comparar } = parsed.data;
  const canaisArray = canais ? canais.split(',') : undefined;

  const series = gerarSerieTemporal({
    clienteId,
    inicio,
    fim,
    canais: canaisArray,
    comparar,
  });

  res.json(series);
});

app.get('/api/v1/metricas/por-canal', authMiddleware, isolamentoClienteMiddleware, (req, res) => {
  const query = {
    ...req.query,
    clienteId: req.clienteIdPermitido,
  };

  const parsed = FiltroMetricasSchema.safeParse(query);
  if (!parsed.success) {
    return res.status(422).json({ status: 422, errors: parsed.error.errors });
  }

  const { clienteId, inicio, fim } = parsed.data;
  const canais = obterMetricasPorCanal({ clienteId, inicio, fim });
  res.json({ canais });
});

app.get('/api/v1/metricas/campanhas', authMiddleware, isolamentoClienteMiddleware, (req, res) => {
  const query = {
    ...req.query,
    clienteId: req.clienteIdPermitido,
  };

  const parsed = FiltroMetricasSchema.safeParse(query);
  if (!parsed.success) {
    return res.status(422).json({ status: 422, errors: parsed.error.errors });
  }

  const { clienteId, inicio, fim } = parsed.data;
  const campanhas = obterCampanhas({ clienteId, inicio, fim });
  res.json({ campanhas });
});

// Instagram Mídias
app.get('/api/v1/instagram/midias', authMiddleware, isolamentoClienteMiddleware, (req, res) => {
  const clienteId = req.clienteIdPermitido!;
  const midias = store.midiasInstagram.filter((m) => m.clienteId === clienteId);
  res.json({ midias });
});

// Entradas Manuais (Para CAC e ROI - RF-12)
app.get('/api/v1/clientes/:id/entradas', authMiddleware, (req, res) => {
  const clienteId = req.params.id;
  const usuario = req.usuario!;

  if (usuario.perfil !== 'admin' && !usuario.clientesIds.includes(clienteId)) {
    return res.status(403).json({ status: 403, detail: 'Acesso não permitido.' });
  }

  const entradas = store.entradasManuais.filter((e) => e.clienteId === clienteId);
  res.json({ entradas });
});

app.post('/api/v1/clientes/:id/entradas', authMiddleware, (req, res) => {
  const clienteId = req.params.id;
  const usuario = req.usuario!;

  if (usuario.perfil === 'cliente') {
    return res.status(403).json({ status: 403, detail: 'Clientes não podem adicionar entradas manuais diretamente.' });
  }

  const parsed = EntradaManualSchema.safeParse({ ...req.body, clienteId });
  if (!parsed.success) {
    return res.status(422).json({ status: 422, errors: parsed.error.errors });
  }

  const novaEntrada = {
    id: `em-${Date.now()}`,
    ...parsed.data,
  };

  store.entradasManuais.push(novaEntrada);
  res.status(201).json({ entrada: novaEntrada });
});

// Webhook Nativo de CRM / E-commerce (RD Station, HubSpot, PipeRun - RF-12 / Seção 4.2)
app.post('/api/v1/webhooks/crm/:clienteId', (req, res) => {
  const clienteId = req.params.clienteId;
  const cliente = store.clientes.find((c) => c.id === clienteId);

  if (!cliente) {
    return res.status(404).json({ status: 404, detail: 'Cliente não encontrado para este webhook.' });
  }

  const { receita, novosClientes, custosExtras, evento, contato, observacao } = req.body;
  const dataHoje = new Date().toISOString().slice(0, 10);

  const valorReceita = Number(receita) || 0;
  const qtdNovosClientes = Number(novosClientes) !== undefined ? Number(novosClientes) : 1;
  const valorCustos = Number(custosExtras) || 0;

  // Encontra ou cria entrada manual para hoje
  let entradaHoje = store.entradasManuais.find((e) => e.clienteId === clienteId && e.data === dataHoje);

  if (entradaHoje) {
    entradaHoje.receita += valorReceita;
    entradaHoje.novosClientes += qtdNovosClientes;
    entradaHoje.custosExtras += valorCustos;
    if (contato?.nome) {
      entradaHoje.observacao = `${entradaHoje.observacao || ''}; Venda: ${contato.nome}`;
    }
  } else {
    entradaHoje = {
      id: `em-webhook-${Date.now()}`,
      clienteId,
      data: dataHoje,
      receita: valorReceita,
      novosClientes: qtdNovosClientes,
      custosExtras: valorCustos,
      observacao: observacao || `Webhook ${evento || 'CRM'}: ${contato?.nome || 'Novo Cliente Integrado'}`,
    };
    store.entradasManuais.push(entradaHoje);
  }

  res.status(200).json({
    sucesso: true,
    mensagem: 'Evento de conversão/venda registrado via Webhook com sucesso no banco de dados.',
    dadosAtualizados: entradaHoje,
  });
});

// Exportação em CSV (RF-17 do PDF)
app.get('/api/v1/metricas/exportar-csv', authMiddleware, isolamentoClienteMiddleware, (req, res) => {
  const clienteId = req.clienteIdPermitido!;
  const inicio = (req.query.inicio as string) || '2026-01-01';
  const fim = (req.query.fim as string) || new Date().toISOString().slice(0, 10);

  const csv = gerarCsvMetricas(clienteId, inicio, fim);

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="metricas_${clienteId}_${inicio}_${fim}.csv"`);
  res.send(csv);
});

// Metas do Cliente (RF-16 do PDF)
app.get('/api/v1/clientes/:id/metas', authMiddleware, (req, res) => {
  const clienteId = req.params.id;
  const usuario = req.usuario!;

  if (usuario.perfil !== 'admin' && !usuario.clientesIds.includes(clienteId)) {
    return res.status(403).json({ status: 403, detail: 'Acesso negado às metas deste cliente.' });
  }

  const meta = store.metas.find((m) => m.clienteId === clienteId) || {
    id: `meta-${clienteId}`,
    clienteId,
    cpaMaximo: 50.0,
    ctrMinimo: 1.8,
    roasMinimo: 3.0,
    investimentoMaximoMensal: 20000.0,
    conversoesMinimoMensal: 400,
  };

  res.json({ meta });
});

app.put('/api/v1/clientes/:id/metas', authMiddleware, (req, res) => {
  const clienteId = req.params.id;
  const usuario = req.usuario!;

  if (usuario.perfil === 'cliente') {
    return res.status(403).json({ status: 403, detail: 'Clientes não possuem permissão para redefinir metas contratuais.' });
  }

  const parsed = MetaClienteSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(422).json({ status: 422, errors: parsed.error.errors });
  }

  let meta = store.metas.find((m) => m.clienteId === clienteId);
  if (meta) {
    Object.assign(meta, parsed.data);
  } else {
    meta = { id: `meta-${clienteId}`, clienteId, ...parsed.data };
    store.metas.push(meta);
  }

  res.json({ meta });
});

// Alertas Inteligentes (RF-16 do PDF)
app.get('/api/v1/clientes/:id/alertas', authMiddleware, (req, res) => {
  const clienteId = req.params.id;
  const usuario = req.usuario!;

  if (usuario.perfil !== 'admin' && !usuario.clientesIds.includes(clienteId)) {
    return res.status(403).json({ status: 403, detail: 'Acesso negado aos alertas deste cliente.' });
  }

  const hoje = new Date().toISOString().slice(0, 10);
  const dInicio = new Date();
  dInicio.setDate(dInicio.getDate() - 30);
  const inicio = (req.query.inicio as string) || dInicio.toISOString().slice(0, 10);
  const fim = (req.query.fim as string) || hoje;

  const alertas = avaliarAlertasCliente(clienteId, inicio, fim);
  res.json({ alertas, total: alertas.length });
});

// Geração Assíncrona de Relatórios (RF-06, Seção 10 e 12 do PDF: retorna 202 Accepted)
app.post('/api/v1/relatorios', authMiddleware, (req, res) => {
  const usuario = req.usuario!;
  const parsed = CriarRelatorioSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(422).json({ status: 422, errors: parsed.error.errors });
  }

  const { clienteId, formato, inicio, fim, canais, comparar } = parsed.data;

  if (usuario.perfil !== 'admin' && !usuario.clientesIds.includes(clienteId)) {
    return res.status(403).json({ status: 403, detail: 'Acesso negado para gerar relatórios para este cliente.' });
  }

  const novoRelatorioId = `rel-${Date.now()}`;
  const novoRelatorio: RelatorioGerado = {
    id: novoRelatorioId,
    clienteId,
    usuarioId: usuario.id,
    nomeArquivo: `Relatorio_${formato.toUpperCase()}_${clienteId}_${inicio}_${fim}.${formato}`,
    formato,
    status: 'processando',
    parametros: { inicio, fim, canais, comparar },
    criadoEm: new Date().toISOString(),
  };

  store.relatorios.unshift(novoRelatorio);

  // Simulação de fila assíncrona (BullMQ/Playwright conforme Seção 12)
  setTimeout(() => {
    novoRelatorio.status = 'concluido';
    novoRelatorio.concluidoEm = new Date().toISOString();
    novoRelatorio.arquivoUrl = `/api/v1/relatorios/${novoRelatorioId}/download`;
  }, 3500);

  // Responde imediatamente com HTTP 202 Accepted conforme especificado na Seção 10 do PDF
  res.status(202).json({
    status: 202,
    mensagem: 'Relatório enfileirado com sucesso para processamento em background.',
    relatorio: novoRelatorio,
  });
});

app.get('/api/v1/relatorios', authMiddleware, (req, res) => {
  const usuario = req.usuario!;
  const clienteId = req.query.clienteId as string;

  let lista = store.relatorios;
  if (clienteId) {
    if (usuario.perfil !== 'admin' && !usuario.clientesIds.includes(clienteId)) {
      return res.status(403).json({ status: 403, detail: 'Acesso negado.' });
    }
    lista = lista.filter((r) => r.clienteId === clienteId);
  } else if (usuario.perfil === 'cliente') {
    lista = lista.filter((r) => usuario.clientesIds.includes(r.clienteId));
  }

  res.json({ relatorios: lista });
});

app.get('/api/v1/relatorios/:id/download', authMiddleware, (req, res) => {
  const relatorio = store.relatorios.find((r) => r.id === req.params.id);
  if (!relatorio) {
    return res.status(404).json({ status: 404, detail: 'Relatório não encontrado.' });
  }

  const usuario = req.usuario!;
  if (usuario.perfil !== 'admin' && !usuario.clientesIds.includes(relatorio.clienteId)) {
    return res.status(403).json({ status: 403, detail: 'Acesso negado para baixar este relatório.' });
  }

  if (relatorio.status !== 'concluido') {
    return res.status(400).json({ status: 400, detail: 'O relatório ainda está sendo processado pela fila assíncrona.' });
  }

  if (relatorio.formato === 'csv') {
    const csv = gerarCsvMetricas(relatorio.clienteId, relatorio.parametros.inicio, relatorio.parametros.fim);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${relatorio.nomeArquivo}"`);
    return res.send(csv);
  }

  // Se PDF, envia resposta formatada
  res.setHeader('Content-Type', 'application/json');
  res.json({
    mensagem: 'Download do relatório concluído.',
    relatorio,
    downloadUrl: relatorio.arquivoUrl,
  });
});

// Agendamentos de Relatórios Automáticos (RF-15 do PDF)
app.get('/api/v1/clientes/:id/agendamentos', authMiddleware, (req, res) => {
  const clienteId = req.params.id;
  const usuario = req.usuario!;

  if (usuario.perfil !== 'admin' && !usuario.clientesIds.includes(clienteId)) {
    return res.status(403).json({ status: 403, detail: 'Acesso negado.' });
  }

  const agendamentos = store.agendamentos.filter((a) => a.clienteId === clienteId);
  res.json({ agendamentos });
});

app.post('/api/v1/clientes/:id/agendamentos', authMiddleware, (req, res) => {
  const clienteId = req.params.id;
  const usuario = req.usuario!;

  if (usuario.perfil === 'cliente') {
    return res.status(403).json({ status: 403, detail: 'Apenas membros da agência podem configurar agendamentos.' });
  }

  const parsed = AgendamentoRelatorioSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(422).json({ status: 422, errors: parsed.error.errors });
  }

  const novoAgendamento: AgendamentoRelatorio = {
    id: `agd-${Date.now()}`,
    clienteId,
    ...parsed.data,
    webhookWhatsapp: parsed.data.webhookWhatsapp || undefined,
  };

  store.agendamentos.push(novoAgendamento);
  res.status(201).json({ agendamento: novoAgendamento });
});

app.delete('/api/v1/agendamentos/:id', authMiddleware, (req, res) => {
  const idx = store.agendamentos.findIndex((a) => a.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ status: 404, detail: 'Agendamento não encontrado.' });
  }

  const usuario = req.usuario!;
  const agendamento = store.agendamentos[idx];
  if (usuario.perfil !== 'admin' && !usuario.clientesIds.includes(agendamento.clienteId)) {
    return res.status(403).json({ status: 403, detail: 'Acesso negado.' });
  }

  store.agendamentos.splice(idx, 1);
  res.json({ mensagem: 'Agendamento removido com sucesso.' });
});

app.post('/api/v1/agendamentos/:id/testar', authMiddleware, (req, res) => {
  const agendamento = store.agendamentos.find((a) => a.id === req.params.id);
  if (!agendamento) {
    return res.status(404).json({ status: 404, detail: 'Agendamento não encontrado.' });
  }

  agendamento.ultimoEnvio = new Date().toISOString();
  agendamento.statusUltimoEnvio = 'sucesso';

  res.json({
    mensagem: `Disparo de teste simulado com sucesso! E-mails enviados para: ${agendamento.destinatariosEmail.join(', ')}` +
      (agendamento.webhookWhatsapp ? ` e payload despachado para WhatsApp via Webhook.` : ''),
    agendamento,
  });
});

// Budget Pacing & Previsão de Run-rate
app.get('/api/v1/clientes/:id/pacing', authMiddleware, (req, res) => {
  const clienteId = req.params.id;
  const usuario = req.usuario!;

  if (usuario.perfil !== 'admin' && !usuario.clientesIds.includes(clienteId)) {
    return res.status(403).json({ status: 403, detail: 'Acesso negado.' });
  }

  const pacing = calcularBudgetPacing(clienteId);
  res.json({ pacing });
});

// IA Growth Copilot - Parecer Executivo de Desempenho
app.post('/api/v1/ia/parecer', authMiddleware, isolamentoClienteMiddleware, (req, res) => {
  const clienteId = req.clienteIdPermitido!;
  const inicio = (req.body.inicio as string) || (req.query.inicio as string);
  const fim = (req.body.fim as string) || (req.query.fim as string);
  const canais = req.body.canais as string[] | undefined;

  if (!inicio || !fim) {
    return res.status(422).json({ status: 422, detail: 'Parâmetros inicio e fim são obrigatórios.' });
  }

  const parecer = gerarParecerIa(clienteId, inicio, fim, canais);
  res.json({ parecer });
});

// Marca da Agência (RF-14)
app.get('/api/v1/agencia/marca', (req, res) => {
  res.json({ marca: store.marca });
});

app.put('/api/v1/agencia/marca', authMiddleware, (req, res) => {
  if (req.usuario?.perfil !== 'admin') {
    return res.status(403).json({ status: 403, detail: 'Apenas administradores podem alterar a marca da agência.' });
  }

  const parsed = AgenciaMarcaSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(422).json({ status: 422, errors: parsed.error.errors });
  }

  store.marca = { ...store.marca, ...parsed.data };
  res.json({ marca: store.marca });
});

app.listen(PORT, () => {
  console.log(`[API] Servidor rodando na porta ${PORT}`);
});

