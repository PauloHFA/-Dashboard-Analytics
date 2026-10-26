export type PerfilUsuario = 'admin' | 'gestor' | 'cliente';

export type CanalMarketing = 'ga4' | 'google_ads' | 'meta_ads' | 'instagram';

export type StatusConexao = 'conectado' | 'erro' | 'requer_reconexao' | 'sincronizando';

export type Granularidade = 'dia' | 'semana' | 'mes';

export type ModoComparativo = 'nenhum' | 'anterior' | 'ano_anterior';

export interface AgenciaMarca {
  id: string;
  nome: string;
  logoUrl: string;
  corPrimaria: string;
  corSecundaria: string;
  corNeutra: string;
  fonte: string;
  rodapeTexto: string;
}

export interface Cliente {
  id: string;
  nome: string;
  documento?: string;
  fusoHorario: string; // Ex: "America/Sao_Paulo"
  moeda: string; // Ex: "BRL"
  fontePrimariaConversoes: 'ga4' | 'plataformas';
  ativo: boolean;
  criadoEm: string;
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  perfil: PerfilUsuario;
  ativo: boolean;
  clientesIds: string[]; // Clientes permitidos
  criadoEm: string;
}

export interface ContaConectada {
  id: string;
  clienteId: string;
  canal: CanalMarketing;
  idExterno: string;
  nome: string;
  moeda: string;
  fuso: string;
  status: StatusConexao;
  ultimaSincronizacao: string | null;
  minutosDesdeSincronizacao?: number;
  mensagemErro?: string | null;
}

export interface FatoAdsDiario {
  id: string;
  clienteId: string;
  contaId: string;
  canal: 'google_ads' | 'meta_ads';
  data: string; // YYYY-MM-DD
  campanhaId: string;
  campanhaNome: string;
  investimento: number; // Em moeda local (BRL)
  impressoes: number;
  cliques: number;
  conversoes: number;
  valorConversao: number;
}

export interface FatoGA4Diario {
  id: string;
  clienteId: string;
  contaId: string;
  data: string; // YYYY-MM-DD
  origemMidia: string; // Ex: "google / cpc", "meta / ads", "direct / none"
  sessoes: number;
  usuarios: number;
  novosUsuarios: number;
  conversoes: number;
  receita: number;
}

export interface FatoInstagramDiario {
  id: string;
  clienteId: string;
  contaId: string;
  data: string; // YYYY-MM-DD
  views: number; // "views" substituiu impressões na nova Graph API
  alcance: number;
  visitasPerfil: number;
  novosSeguidores: number;
  interacoes: number;
}

export interface InstagramMidia {
  id: string;
  clienteId: string;
  contaId: string;
  idMidia: string;
  tipo: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM' | 'REEL';
  legenda: string;
  permalink: string;
  thumbnailUrl: string;
  publicadoEm: string;
  views: number;
  alcance: number;
  interacoes: number;
  curtidas: number;
  comentarios: number;
  compartilhamentos: number;
}

export interface EntradaManual {
  id: string;
  clienteId: string;
  data: string; // YYYY-MM-DD
  receita: number;
  novosClientes: number;
  custosExtras: number; // Ferramentas, produção, taxas
  observacao?: string;
}

export interface SincronizacaoLog {
  id: string;
  contaId: string;
  canal: CanalMarketing;
  janelaInicio: string;
  janelaFim: string;
  status: 'sucesso' | 'erro' | 'em_andamento';
  inicio: string;
  fim?: string;
  linhasAfetadas: number;
  erro?: string;
}

// Resumo e KPIs agregados
export interface ResumoMetricas {
  investimentoTotal: number;
  impressoesTotal: number;
  cliquesTotal: number;
  ctrMedio: number; // percentual (ex: 2.34%)
  cpcMedio: number; // R$
  cpmMedio: number; // R$
  conversoesTotal: number;
  cpaMedio: number; // R$ (investimento / conversões)
  receitaTotal: number;
  roas: number; // receita / investimento
  roi: number; // (receita - custos) / custos (com entradas manuais)
  cac: number; // investimento / novos clientes (se dados existirem)
  novosClientes: number;
  sessoesGA4: number;
  usuariosGA4: number;
  viewsInstagram: number;
  alcanceInstagram: number;
  engajamentoInstagram: number; // percentual
}

export interface VariacaoMetrica {
  atual: number;
  anterior: number;
  diferencaAbsoluta: number;
  diferencaPercentual: number;
  // Se true, aumento na métrica é positivo (ex: receita, ROAS). Se false, aumento é negativo (ex: CPA, CPC).
  positivo: boolean;
}

export interface PontoSerieTemporal {
  data: string; // Label legível ex: "01/10"
  dataCompleta: string; // YYYY-MM-DD
  investimento: number;
  cliques: number;
  impressoes: number;
  conversoes: number;
  receita: number;
  sessoes: number;
  viewsInstagram: number;
}

export interface SerieComparativa {
  atual: PontoSerieTemporal[];
  comparativo: PontoSerieTemporal[];
}

export interface MetricasPorCanal {
  canal: CanalMarketing;
  nomeExibicao: string;
  investimento: number;
  cliques: number;
  conversoes: number;
  cpa: number;
  roas: number;
  participacaoInvestimento: number; // %
}

export interface ResumoCampanha {
  id: string;
  nome: string;
  canal: 'google_ads' | 'meta_ads';
  investimento: number;
  impressoes: number;
  cliques: number;
  ctr: number;
  cpc: number;
  conversoes: number;
  cpa: number;
  valorConversao: number;
  roas: number;
}

export interface Conector {
  readonly canal: CanalMarketing;
  validarConexao(conta: ContaConectada): Promise<{ valido: boolean; mensagem?: string }>;
  buscar(conta: ContaConectada, janela: { inicio: string; fim: string }): Promise<any[]>;
}

// Metas e Alertas de Performance (RF-16 do PDF)
export interface MetaCliente {
  id: string;
  clienteId: string;
  cpaMaximo: number; // R$
  ctrMinimo: number; // %
  roasMinimo: number; // ex: 3.5x
  investimentoMaximoMensal: number; // R$
  conversoesMinimoMensal: number;
}

export interface AlertaMetrica {
  id: string;
  clienteId: string;
  tipo: 'cpa' | 'ctr' | 'roas' | 'investimento' | 'conexao';
  severidade: 'aviso' | 'critico';
  titulo: string;
  mensagem: string;
  metricaAtual: number;
  limite: number;
  criadoEm: string;
}

// Relatórios Assíncronos (RF-06 e Seção 10 do PDF)
export interface RelatorioGerado {
  id: string;
  clienteId: string;
  usuarioId: string;
  nomeArquivo: string;
  formato: 'pdf' | 'csv';
  status: 'pendente' | 'processando' | 'concluido' | 'erro';
  parametros: {
    inicio: string;
    fim: string;
    canais: string[];
    comparar: string;
  };
  arquivoUrl?: string;
  criadoEm: string;
  concluidoEm?: string;
}

