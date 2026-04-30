FROM node:22-alpine
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/db/package.json ./packages/db/
COPY apps/server/package.json ./apps/server/

RUN npm ci --workspace=apps/server --workspace=packages/db

COPY packages/db/ ./packages/db/
COPY apps/server/ ./apps/server/

RUN cd packages/db && npx prisma generate

WORKDIR /app/apps/server
ENV PORT=4000
EXPOSE 4000
CMD ["node", "--import=tsx/esm", "index.ts"]
