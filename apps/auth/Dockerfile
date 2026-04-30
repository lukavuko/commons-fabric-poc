FROM node:22-alpine
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/db/package.json ./packages/db/
COPY apps/auth/package.json ./apps/auth/

RUN npm ci --workspace=apps/auth --workspace=packages/db

COPY packages/db/ ./packages/db/
COPY apps/auth/ ./apps/auth/

RUN cd packages/db && npx prisma generate

WORKDIR /app/apps/auth
ENV PORT=4001
EXPOSE 4001
CMD ["node", "--import=tsx/esm", "index.ts"]
