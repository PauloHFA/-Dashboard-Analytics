import { Request, Response, NextFunction } from 'express';
import { Usuario } from '@dashboard/shared';
import { store } from '../db/store';

// Extensão do tipo Request do Express para anexar o usuário autenticado
declare global {
  namespace Express {
    interface Request {
      usuario?: Usuario;
      clienteIdPermitido?: string;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  // Em ambiente de teste/demonstração, permite autenticar via header ou fallback para usr-admin
  let usuarioId = 'usr-admin';

  if (authHeader && authHeader.startsWith('Bearer ')) {
    usuarioId = authHeader.replace('Bearer ', '').trim();
  } else if (req.headers['x-user-id']) {
    usuarioId = String(req.headers['x-user-id']);
  }

  const usuario = store.usuarios.find((u) => u.id === usuarioId || u.email === usuarioId);

  if (!usuario || !usuario.ativo) {
    return res.status(401).json({
      type: 'https://problemas.agencia.com/nao-autenticado',
      title: 'Não autenticado',
      status: 401,
      detail: 'Usuário não autenticado ou inativo.',
    });
  }

  req.usuario = usuario;
  next();
}

/**
 * Middleware para isolamento de multitenancy (Defesa em Camadas - Seção 9.2 do PDF)
 * O clienteId enviado pelo frontend é tratado estritamente como filtro, nunca autorização.
 */
export function isolamentoClienteMiddleware(req: Request, res: Response, next: NextFunction) {
  const usuario = req.usuario;
  if (!usuario) {
    return res.status(401).json({ status: 401, detail: 'Autenticação requerida' });
  }

  // Obter o clienteId do parâmetro, query ou body
  const clienteIdSolicitado = (req.params.clienteId || req.query.clienteId || req.body.clienteId) as string;

  // Se o usuário for cliente final, ele só pode ver o próprio cliente
  if (usuario.perfil === 'cliente') {
    const clienteProprio = usuario.clientesIds[0];
    if (clienteIdSolicitado && clienteIdSolicitado !== clienteProprio) {
      return res.status(403).json({
        type: 'https://problemas.agencia.com/acesso-negado',
        title: 'Acesso Proibido',
        status: 403,
        detail: 'Violação de isolamento multitenant: você não tem permissão para acessar os dados deste cliente.',
      });
    }
    req.clienteIdPermitido = clienteProprio;
    return next();
  }

  // Se o usuário for gestor, verificar se o cliente está na lista de clientes atribuídos
  if (usuario.perfil === 'gestor') {
    if (clienteIdSolicitado && !usuario.clientesIds.includes(clienteIdSolicitado)) {
      return res.status(403).json({
        type: 'https://problemas.agencia.com/acesso-negado',
        title: 'Acesso Proibido',
        status: 403,
        detail: 'Este cliente não está atribuído à sua carteira de gestão.',
      });
    }
    req.clienteIdPermitido = clienteIdSolicitado || usuario.clientesIds[0];
    return next();
  }

  // Se for admin, tem acesso irrestrito
  req.clienteIdPermitido = clienteIdSolicitado || store.clientes[0].id;
  next();
}

