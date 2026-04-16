# Commons Fabric PoC - Development Guide

A federated community engagement platform enabling geographic discovery, event aggregation, and lightweight community governance.

## Prerequisites

- **Node.js** 18.17 or higher
- **npm** 9.0 or higher
- **PostgreSQL** account (via Supabase)
- **Supabase** project (free tier available)
- **Sendgrid** account (optional for local dev, required for production)

## Quick Start

### 1. Environment Setup

```bash
# Copy the environment template
cp .env.example .env

# Edit .env with your credentials (see TODO.md for instructions)
# Important: DATABASE_URL is required for migrations
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Generate Prisma Client

```bash
npm run prisma:generate
```

### 4. Create Database Migration

```bash
# This will:
# 1. Connect to your PostgreSQL database
# 2. Create all tables based on prisma/schema.prisma
# 3. Create a timestamped migration file in prisma/migrations/
npm run prisma:migrate
```

### 5. Start Development Server

```bash
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **GraphQL Playground**: http://localhost:3000/api/graphql

## Available Scripts

### Development
```bash
npm run dev                # Start Next.js dev server with hot reload
npm run build              # Build for production
npm start                  # Start production server
npm run lint               # Run ESLint
```

### Prisma Database
```bash
npm run prisma:generate    # Generate Prisma client (run after schema changes)
npm run prisma:migrate     # Create and run migrations interactively
npm run prisma:studio      # Open Prisma Studio GUI (localhost:5555)
npm run prisma:reset       # ⚠️ Drop database and re-run migrations (dev only)
```

## Project Structure

```
cfp-poc/
├── prisma/
│   ├── schema.prisma       # Database schema definition
│   └── migrations/         # Auto-generated migration files
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── graphql/
│   │   │       └── route.ts # Apollo GraphQL endpoint
│   │   ├── layout.tsx      # Root layout
│   │   └── page.tsx        # Homepage
│   ├── lib/
│   │   ├── prisma.ts       # Prisma client singleton
│   │   ├── logger.ts       # Pino logger configuration
│   │   ├── apollo/         # Apollo Server setup (placeholder)
│   │   └── supabase/       # Supabase client
│   ├── graphql/
│   │   ├── schema.ts       # GraphQL type definitions
│   │   ├── resolvers/      # Resolver functions
│   │   └── types/          # TypeScript types (generated)
│   └── types/              # Shared TypeScript types
├── public/                 # Static assets
├── .env.example            # Environment variables template
├── TODO.md                 # Configuration checklist
├── ARCHITECTURE.md         # Technical architecture document
└── README.md              # This file
```

## Database

### Connection Info

All database credentials are stored in `.env`:
- `DATABASE_URL`: Full PostgreSQL connection string

### Viewing Database

```bash
# Open Prisma Studio GUI (recommended for visual exploration)
npm run prisma:studio

# Or use DBeaver, pgAdmin, or any PostgreSQL client
# See ARCHITECTURE.md section 11.5 for details
```

### Schema Changes

To modify the database schema:

```bash
# 1. Edit prisma/schema.prisma
vim prisma/schema.prisma

# 2. Create and apply migration
npm run prisma:migrate

# 3. Prisma auto-generates TypeScript types
# ✅ Ready to use in your code
```

## GraphQL API

The GraphQL API is available at `/api/graphql` in development.

### Testing Queries

1. Navigate to http://localhost:3000/api/graphql
2. Apollo Studio Sandbox will open automatically
3. Try a test query:

```graphql
query {
  _empty
}
```

Expected response:
```json
{
  "data": {
    "_empty": "GraphQL server is running"
  }
}
```

### Schema Documentation

See `ARCHITECTURE.md` section 5 for full GraphQL schema including:
- Query definitions
- Mutations
- Types and relationships
- Authorization rules

## Logging

Logs are structured using [Pino](https://getpino.io/).

### Configuration

Set `LOG_LEVEL` in `.env`:
```env
LOG_LEVEL=info    # info, debug, warn, error
```

### Log Output

- **Development**: Pretty-printed with colors
- **Production**: JSON-formatted for log aggregation

## Troubleshooting

### "Cannot find module" errors
```bash
npm run prisma:generate
npm install
```

### Port 3000 already in use
```bash
# Use a different port
npm run dev -- -p 3001
```

### Database connection fails
1. Verify `DATABASE_URL` in `.env`
2. Check network access in Supabase (IP whitelist)
3. Confirm credentials in Supabase Dashboard

### Prisma migration conflicts
```bash
# Reset database (dev only, loses all data)
npm run prisma:reset
```

## Credentials & Configuration

**⚠️ IMPORTANT:** Never commit `.env` to git. It contains secrets.

For the complete configuration checklist, see `TODO.md`.

## Architecture

For technical architecture details including:
- System design diagram
- Tech stack justification
- Database schema overview
- API/GraphQL structure
- Deployment strategy
- Development workflow

See `ARCHITECTURE.md`.

## Development Workflow

See `ARCHITECTURE.md` section 11 for:
- Local development setup
- Database migrations strategy
- GraphQL development
- Testing strategy
- Direct database access tools

## Contributing

When making changes:

1. Update `prisma/schema.prisma` for database changes
2. Run `npm run prisma:migrate` to generate migrations
3. Implement GraphQL schema and resolvers
4. Test in GraphQL Sandbox
5. Update `claude.log` with changes (if using Claude Code)

## Next Steps

After setup is complete:

1. ✅ Configure `.env` (see TODO.md)
2. ✅ Run `npm run prisma:migrate`
3. ⬜ Implement full GraphQL schema (see ARCHITECTURE.md section 5)
4. ⬜ Build frontend components
5. ⬜ Implement authentication
6. ⬜ Deploy to Vercel

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Apollo Server Documentation](https://www.apollographql.com/docs/apollo-server/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Supabase Documentation](https://supabase.com/docs)
- [Architecture Document](./ARCHITECTURE.md)

---

**Last Updated**: April 2026
**Status**: Development / PoC Phase
