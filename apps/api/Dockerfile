FROM node:22-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm ci

COPY prisma ./prisma
COPY prisma.config.ts tsconfig.base.json ./
ENV DATABASE_URL=postgresql://build:build@localhost:5432/ecommerce
RUN npm run db:generate

COPY apps/api ./apps/api

EXPOSE 3000
CMD ["sh", "-c", "npm run db:migrate:deploy && npm run db:seed && exec npm run start --workspace @ecommerce/api"]
