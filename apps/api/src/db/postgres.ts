/**
 * Gerenciador de Conexão PostgreSQL com Suporte a Row Level Security (RLS)
 * Especificação: Seção 9.2 do PDF (Defesa em duas camadas)
 */

export interface ClienteContexto {
  clienteIds: string[];
}

export class PostgresClientManager {
  private static instance: PostgresClientManager;
  private databaseUrl: string;

  private constructor() {
    this.databaseUrl = process.env.DATABASE_URL || 'postgres://dashboard_app_user:dashboard_app_pass_secret@localhost:5432/dashboard_analytics';
  }

  public static getInstance(): PostgresClientManager {
    if (!PostgresClientManager.instance) {
      PostgresClientManager.instance = new PostgresClientManager();
    }
    return PostgresClientManager.instance;
  }

  /**
   * Constrói a instrução de segurança RLS para ser executada antes de qualquer consulta.
   * Isso restringe o retorno da query no nível do kernel do PostgreSQL às contas autorizadas.
   */
  public gerarComandoRLS(clienteIds: string[]): string {
    const idsFormatados = clienteIds.join(',');
    return `SET LOCAL app.cliente_ids = '${idsFormatados}';`;
  }

  public getDatabaseUrl(): string {
    return this.databaseUrl;
  }
}

export const pgManager = PostgresClientManager.getInstance();

