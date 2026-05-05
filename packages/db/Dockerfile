FROM node:22-alpine
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/db/package.json ./packages/db/
COPY packages/db/ ./packages/db/

RUN npm ci --workspace=packages/db

WORKDIR /app/packages/db
CMD ["npx", "prisma", "migrate", "deploy"]
