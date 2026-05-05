FROM node:22-alpine
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/db/package.json ./packages/db/
COPY apps/executioner/package.json ./apps/executioner/

RUN npm ci --workspace=apps/executioner --workspace=packages/db --include-workspace-root

COPY packages/db/ ./packages/db/
COPY apps/executioner/ ./apps/executioner/

RUN cd packages/db && npx prisma generate

WORKDIR /app/apps/executioner
CMD ["node", "--import=tsx/esm", "index.ts"]
