FROM node:22-alpine
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/auth-tokens/package.json ./packages/auth-tokens/
COPY packages/db/package.json ./packages/db/
COPY packages/defaults/package.json ./packages/defaults/
COPY packages/ical/package.json ./packages/ical/
COPY apps/server/package.json ./apps/server/

RUN npm ci --workspace=apps/server --workspace=packages/auth-tokens --workspace=packages/db --workspace=packages/defaults --workspace=packages/ical --include-workspace-root

COPY packages/auth-tokens/ ./packages/auth-tokens/
COPY packages/db/ ./packages/db/
COPY packages/defaults/ ./packages/defaults/
COPY packages/ical/ ./packages/ical/
COPY apps/server/ ./apps/server/

RUN cd packages/db && npx prisma generate

WORKDIR /app/apps/server
ENV PORT=4000
EXPOSE 4000
CMD ["node", "--import=tsx/esm", "index.ts"]
