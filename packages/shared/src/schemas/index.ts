import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  senha: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

export const FiltroMetricasSchema = z.object({
  clienteId: z.string().uuid().or(z.string().min(1)),
  inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de data inválido (AAAA-MM-DD)'),
  fim: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de data inválido (AAAA-MM-DD)'),
  canais: z.string().optional(), // separados por vírgula
  comparar: z.enum(['nenhum', 'anterior', 'ano_anterior']).default('anterior'),
  granularidade: z.enum(['dia', 'semana', 'mes']).default('dia'),
});

export const EntradaManualSchema = z.object({
  clienteId: z.string(),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  receita: z.number().min(0, 'Receita não pode ser negativa'),
  novosClientes: z.number().int().min(0, 'Número de novos clientes deve ser inteiro não negativo'),
  custosExtras: z.number().min(0).default(0),
  observacao: z.string().optional(),
});

export const AgenciaMarcaSchema = z.object({
  nome: z.string().min(2),
  logoUrl: z.string().url().or(z.string()),
  corPrimaria: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  corSecundaria: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  corNeutra: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  fonte: z.string(),
  rodapeTexto: z.string(),
});

export const CriarClienteSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  documento: z.string().optional(),
  fusoHorario: z.string().default('America/Sao_Paulo'),
  moeda: z.string().default('BRL'),
  fontePrimariaConversoes: z.enum(['ga4', 'plataformas']).default('ga4'),
});

export const ConectarContaSchema = z.object({
  clienteId: z.string(),
  canal: z.enum(['ga4', 'google_ads', 'meta_ads', 'instagram']),
  nome: z.string().min(2),
  idExterno: z.string().min(1),
  credenciais: z.record(z.any()).optional(),
});

export const MetaClienteSchema = z.object({
  cpaMaximo: z.number().min(0),
  ctrMinimo: z.number().min(0),
  roasMinimo: z.number().min(0),
  investimentoMaximoMensal: z.number().min(0),
  conversoesMinimoMensal: z.number().min(0),
});

export const CriarRelatorioSchema = z.object({
  clienteId: z.string(),
  formato: z.enum(['pdf', 'csv']).default('pdf'),
  inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  fim: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  canais: z.array(z.string()).default(['google_ads', 'meta_ads', 'ga4', 'instagram']),
  comparar: z.enum(['nenhum', 'anterior', 'ano_anterior']).default('anterior'),
});

export const AgendamentoRelatorioSchema = z.object({
  titulo: z.string().min(3),
  frequencia: z.enum(['semanal', 'quinzenal', 'mensal']),
  diaEnvio: z.number().int().min(1).max(31),
  horaEnvio: z.string().default('08:00'),
  destinatariosEmail: z.array(z.string().email()),
  webhookWhatsapp: z.string().url().optional().or(z.literal('')),
  formato: z.enum(['pdf', 'csv', 'ambos']).default('pdf'),
  ativo: z.boolean().default(true),
});

