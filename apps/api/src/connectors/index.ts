import { Conector, CanalMarketing, ContaConectada, FatoAdsDiario, FatoGA4Diario, FatoInstagramDiario } from '@dashboard/shared';
import { store } from '../db/store';

export class GA4Conector implements Conector {
  readonly canal: CanalMarketing = 'ga4';

  async validarConexao(conta: ContaConectada): Promise<{ valido: boolean; mensagem?: string }> {
    if (!conta.idExterno.startsWith('properties/')) {
      return { valido: false, mensagem: 'ID de propriedade GA4 inválido (deve iniciar com properties/)' };
    }
    return { valido: true };
  }

  async buscar(conta: ContaConectada, janela: { inicio: string; fim: string }): Promise<FatoGA4Diario[]> {
    // Retorna os dados da janela especificada para o cliente
    return store.fatosGA4.filter(
      (f) => f.contaId === conta.id && f.data >= janela.inicio && f.data <= janela.fim
    );
  }
}

export class GoogleAdsConector implements Conector {
  readonly canal: CanalMarketing = 'google_ads';

  async validarConexao(conta: ContaConectada): Promise<{ valido: boolean; mensagem?: string }> {
    if (!conta.idExterno || conta.idExterno.length < 5) {
      return { valido: false, mensagem: 'Customer ID do Google Ads inválido' };
    }
    return { valido: true };
  }

  async buscar(conta: ContaConectada, janela: { inicio: string; fim: string }): Promise<FatoAdsDiario[]> {
    return store.fatosAds.filter(
      (f) => f.contaId === conta.id && f.canal === 'google_ads' && f.data >= janela.inicio && f.data <= janela.fim
    );
  }
}

export class MetaAdsConector implements Conector {
  readonly canal: CanalMarketing = 'meta_ads';

  async validarConexao(conta: ContaConectada): Promise<{ valido: boolean; mensagem?: string }> {
    if (conta.status === 'requer_reconexao') {
      return { valido: false, mensagem: conta.mensagemErro || 'Requer reautenticação OAuth' };
    }
    return { valido: true };
  }

  async buscar(conta: ContaConectada, janela: { inicio: string; fim: string }): Promise<FatoAdsDiario[]> {
    return store.fatosAds.filter(
      (f) => f.contaId === conta.id && f.canal === 'meta_ads' && f.data >= janela.inicio && f.data <= janela.fim
    );
  }
}

export class InstagramConector implements Conector {
  readonly canal: CanalMarketing = 'instagram';

  async validarConexao(conta: ContaConectada): Promise<{ valido: boolean; mensagem?: string }> {
    return { valido: true };
  }

  async buscar(conta: ContaConectada, janela: { inicio: string; fim: string }): Promise<FatoInstagramDiario[]> {
    return store.fatosInstagram.filter(
      (f) => f.contaId === conta.id && f.data >= janela.inicio && f.data <= janela.fim
    );
  }
}

export const conectores: Record<CanalMarketing, Conector> = {
  ga4: new GA4Conector(),
  google_ads: new GoogleAdsConector(),
  meta_ads: new MetaAdsConector(),
  instagram: new InstagramConector(),
};

export function obterConector(canal: CanalMarketing): Conector {
  const conector = conectores[canal];
  if (!conector) {
    throw new Error(`Conector para canal "${canal}" não implementado.`);
  }
  return conector;
}

