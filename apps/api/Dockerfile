FROM node:20-alpine AS builder

WORKDIR /app

# Copiar arquivos de configuração dos workspaces
COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY apps/api/package*.json ./apps/api/

# Instalar dependências
RUN npm install

# Copiar código fonte
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api

# Build
RUN npm --workspace=@dashboard/shared run build
RUN npm --workspace=@dashboard/api run build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY apps/api/package*.json ./apps/api/

RUN npm install --omit=dev

COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/apps/api/dist ./apps/api/dist

EXPOSE 3001

CMD ["node", "apps/api/dist/server.js"]

