# Manual de Operação, Arquitetura e Manutenção Interna
### Plataforma de Analytics Multicliente para Agência de Marketing Digital

Este documento consolida os entregáveis de documentação técnica, operação e repasse da solução, conforme estipulado nas **Seções 8, 15 e 21 do documento de requisitos**.

---

## 1. Dicionário de Métricas e Regras de Negócio

### 1.1 Regra de Agregação de Razões
> [!IMPORTANT]
> **Nunca calcule a média das médias.** Taxas e custos médios devem ser calculados agregando primeiro o numerador total e dividindo pelo denominador total no período:
> * $\text{CTR} = \frac{\sum \text{Cliques}}{\sum \text{Impressões}} \times 100$
> * $\text{CPA} = \frac{\sum \text{Investimento}}{\sum \text{Conversões}}$
> * $\text{CPC} = \frac{\sum \text{Investimento}}{\sum \text{Cliques}}$
> * $\text{ROAS} = \frac{\sum \text{Receita de Anúncios}}{\sum \text{Investimento em Mídia}}$

### 1.2 Por que CAC e ROI exigem Entradas Manuais? (Seção 4.2)
As APIs de anúncios (Google Ads e Meta Ads) **não possuem acesso aos novos clientes reais fechados**, nem ao faturamento final do cliente.
* **CPA (Custo por Conversão)**: Calculado nativamente com base nos leads/conversões de mídia.
* **CAC Real**: Calculado via tela de *Entradas Manuais* (`/entradas_manuais`):
  $$\text{CAC} = \frac{\text{Investimento em Aquisição}}{\text{Novos Clientes Faturados (CRM)}}$$
* **ROI Real**:
  $$\text{ROI} = \frac{\text{Receita Total} - (\text{Investimento Mídia} + \text{Custos Extras})}{\text{Investimento Mídia} + \text{Custos Extras}} \times 100$$

---

## 2. Como Adicionar um Novo Canal / Conector (Seção 8)

A arquitetura do sistema foi desenhada em torno da interface extensível `Conector`. Para integrar uma nova rede (ex: **TikTok Ads** ou **LinkedIn Ads**):

### Passo 1: Implementar a Interface `Conector`
Crie o arquivo `apps/api/src/connectors/TikTokConector.ts`:
```typescript
import { Conector, CanalMarketing, ContaConectada } from '@dashboard/shared';

export class TikTokConector implements Conector {
  readonly canal: CanalMarketing = 'tiktok' as any;

  async validarConexao(conta: ContaConectada): Promise<{ valido: boolean; mensagem?: string }> {
    // 1. Testa token do TikTok Marketing API
    if (!conta.idExterno) return { valido: false, mensagem: 'Advertiser ID obrigatório' };
    return { valido: true };
  }

  async buscar(conta: ContaConectada, janela: { inicio: string; fim: string }): Promise<any[]> {
    // 2. Chama endpoint de relatórios /v1.3/report/integrated/get/
    // 3. Normaliza os dados para o schema comum fato_ads_diario
    return [];
  }
}
```

### Passo 2: Registrar no Registry de Conectores
No arquivo `apps/api/src/connectors/index.ts`, adicione a nova instância:
```typescript
export const conectores = {
  ga4: new GA4Conector(),
  google_ads: new GoogleAdsConector(),
  meta_ads: new MetaAdsConector(),
  instagram: new InstagramConector(),
  tiktok: new TikTokConector(), // <- Novo canal disponível imediatamente
};
```

---

## 3. Runbook de Incidentes e Manutenção (Seção 15)

### 3.1 Falha: "Token Requer Reconexão" no Meta Ads
* **Sintoma**: Painel exibe badge amarelo/vermelho na aba *Conexões* ou alerta de "Token de usuário expirado".
* **Causa**: O usuário de sistema do Meta Business Manager teve suas permissões alteradas ou o token de longa duração (60 dias) expirou.
* **Resolução**:
  1. Acesse o **Meta Business Suite** da agência.
  2. Em *Configurações do Negócio > Usuários do Sistema*, gere um novo token com escopo `ads_read`.
  3. Atualize o token nas configurações da conta e clique em **Sincronizar Agora** no painel de Conexões.

### 3.2 Reprocessamento de Dados com Janela Retrospectiva (Seção 4.1)
As plataformas de anúncios consolidam conversões por modelo de atribuição ao longo de até 30 dias. 
* Sempre execute sincronizações incrementais reprocessando os últimos **7 a 30 dias**, garantindo que compras aprovadas retroativamente sejam contabilizadas sem duplicar registros (idempotência via `UPSERT`).

---

## 4. Pipeline de CI/CD e Garantia de Qualidade

Todo commit ou Pull Request passa automaticamente pelo pipeline do GitHub Actions (`.github/workflows/ci.yml`), validando:
1. Compilação TypeScript de todos os pacotes (`npm run build`).
2. Execução dos **24 testes unitários e de integração** (`npm test`).
3. Auditoria automatizada dos **Critérios de Aceite da Seção 14** (`npm run check:acceptance`).
