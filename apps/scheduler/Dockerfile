FROM node:22-alpine
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/db/package.json ./packages/db/
COPY apps/scheduler/package.json ./apps/scheduler/

RUN npm ci --workspace=apps/scheduler --workspace=packages/db

COPY packages/db/ ./packages/db/
COPY apps/scheduler/ ./apps/scheduler/

RUN cd packages/db && npx prisma generate

WORKDIR /app/apps/scheduler
CMD ["node", "--import=tsx/esm", "index.ts"]
