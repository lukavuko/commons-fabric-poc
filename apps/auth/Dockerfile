FROM node:22-alpine
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/auth-tokens/package.json ./packages/auth-tokens/
COPY packages/db/package.json ./packages/db/
COPY apps/auth/package.json ./apps/auth/

RUN npm ci --workspace=apps/auth --workspace=packages/auth-tokens --workspace=packages/db --include-workspace-root

COPY packages/auth-tokens/ ./packages/auth-tokens/
COPY packages/db/ ./packages/db/
COPY apps/auth/ ./apps/auth/

RUN cd packages/db && npx prisma generate

WORKDIR /app/apps/auth
ENV PORT=4001
EXPOSE 4001
CMD ["node", "--import=tsx/esm", "index.ts"]
