import test from 'node:test';
import assert from 'node:assert/strict';
import { isolamentoClienteMiddleware } from '../src/middleware/auth';
import { store } from '../src/db/store';

test('Isolamento Multi-tenant e Defesa em Camadas (Seção 9.2 e 14 do PDF)', async (t) => {
  await t.test('Cliente A (usr-cliente-01) DEVE ter acesso bloqueado (403) ao tentar consultar dados do Cliente B (cli-02)', () => {
    const usuarioClienteA = store.usuarios.find((u) => u.id === 'usr-cliente-01');
    assert.ok(usuarioClienteA);

    let statusRetornado = 0;
    let jsonRetornado: any = null;

    const reqMock: any = {
      usuario: usuarioClienteA,
      query: { clienteId: 'cli-02' }, // Tentativa de IDOR acessando outro cliente
      params: {},
      body: {},
    };

    const resMock: any = {
      status: (code: number) => {
        statusRetornado = code;
        return {
          json: (data: any) => {
            jsonRetornado = data;
          },
        };
      },
    };

    let nextChamado = false;
    const nextMock = () => {
      nextChamado = true;
    };

    isolamentoClienteMiddleware(reqMock, resMock, nextMock);

    assert.equal(statusRetornado, 403, 'Acesso cruzado de cliente deve retornar 403 Forbidden');
    assert.equal(nextChamado, false, 'Middleware não pode prosseguir para consulta');
    assert.match(jsonRetornado.detail, /Violação de isolamento/);
  });

  await t.test('Cliente A (usr-cliente-01) deve ter acesso permitido (200) aos seus próprios dados (cli-01)', () => {
    const usuarioClienteA = store.usuarios.find((u) => u.id === 'usr-cliente-01');
    assert.ok(usuarioClienteA);

    const reqMock: any = {
      usuario: usuarioClienteA,
      query: { clienteId: 'cli-01' },
      params: {},
      body: {},
    };

    const resMock: any = {};
    let nextChamado = false;
    const nextMock = () => {
      nextChamado = true;
    };

    isolamentoClienteMiddleware(reqMock, resMock, nextMock);

    assert.equal(nextChamado, true);
    assert.equal(reqMock.clienteIdPermitido, 'cli-01');
  });

  await t.test('Admin da Agência (usr-admin) pode alternar e auditar qualquer cliente da carteira de 60 clientes', () => {
    const admin = store.usuarios.find((u) => u.id === 'usr-admin');
    assert.ok(admin);

    const reqMock: any = {
      usuario: admin,
      query: { clienteId: 'cli-45' }, // Acessa cliente 45 da carteira
      params: {},
      body: {},
    };

    let nextChamado = false;
    isolamentoClienteMiddleware(reqMock, {} as any, () => {
      nextChamado = true;
    });

    assert.equal(nextChamado, true);
    assert.equal(reqMock.clienteIdPermitido, 'cli-45');
  });

  await t.test('Gestor de Contas tem acesso limitado aos clientes sob sua gestão', () => {
    const gestor = store.usuarios.find((u) => u.id === 'usr-gestor');
    assert.ok(gestor);

    // Cliente atribuído ao gestor (cli-02)
    const reqPermitido: any = {
      usuario: gestor,
      query: { clienteId: 'cli-02' },
      params: {},
      body: {},
    };

    let permitidoChamado = false;
    isolamentoClienteMiddleware(reqPermitido, {} as any, () => {
      permitidoChamado = true;
    });
    assert.equal(permitidoChamado, true);

    // Cliente não atribuído (cli-50)
    let statusBloqueado = 0;
    const reqBloqueado: any = {
      usuario: gestor,
      query: { clienteId: 'cli-50' },
      params: {},
      body: {},
    };
    const resMock: any = {
      status: (code: number) => {
        statusBloqueado = code;
        return { json: () => {} };
      },
    };

    isolamentoClienteMiddleware(reqBloqueado, resMock, () => {});
    assert.equal(statusBloqueado, 403);
  });
});

