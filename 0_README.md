# Commons Fabric PoC - Development Guide

A federated community engagement platform enabling geographic discovery, event aggregation, and lightweight community governance.



## Prerequisites

- **Node.js** 18.17 or higher
- **npm** 9.0 or higher
- **PostgreSQL** account (via Supabase)
- **Supabase** project (free tier available)
- **Sendgrid** account (optional for local dev, required for production)



## Quick Start

1. Configure the local environment for testing (copy paste contents of the .env file)
2. Install Dependencies: `npm install`
3. Generate Prisma Client: `npm run prisma:generate`
4. Create Database Migration

```bash
# This will:
# 1. Connect to your PostgreSQL database
# 2. Create all tables based on prisma/schema.prisma
# 3. Create a timestamped migration file in prisma/migrations/
npm run prisma:migrate
```

5. Build and Start Development Server: `npm run build` followed by  `npm run dev` 
6. The application will be available at:
   - Frontend: http://localhost:3000
   - GraphQL Playground: http://localhost:3000/api/graphql



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
├── .env            		# Environment ⚠️ Never commit `.env` to git
```



## Scripts

```bash
# Development
npm run dev                # Start Next.js dev server with hot reload
npm run build              # Build for production
npm start                  # Start production server
npm run lint               # Run ESLint
```

```bash
# Prisma Database
npm run prisma:generate    # Generate Prisma client (run after schema changes)
npm run prisma:migrate     # Create and run migrations interactively
npm run prisma:reset       # ⚠️ Drop database and re-run migrations (dev only)
```



## Logging

Logs are structured using [Pino](https://getpino.io/). You may set the `LOG_LEVEL` in `.env` which specifies how much information to capture. In development, log outputs are pretty-printed with colors whereas in production logs will be JSON-formatted for log aggregation tasks.

```env
LOG_LEVEL=info    # info, debug, warn, error
```



## Troubleshooting

###### **"Cannot find module" errors?**

```bash
npm run prisma:generate
npm install
```

###### **Port 3000 already in use?**

```bash
# Use a different port or stop other existing instances
# of the webapp that may be running in another terminal
npm run dev -- -p 3001
```

###### **Database connection fails?**

1. Verify `DATABASE_URL` in `.env`
2. Check network access in Supabase (IP whitelist)
3. Confirm credentials in Supabase Dashboard

###### **Prisma migration conflicts?**

```bash
# Reset database (dev only, loses all data)
npm run prisma:reset
```



## Architecture

For technical architecture details including:
- System design diagram
- Tech stack justification
- API/GraphQL structure
- Deployment strategy
- Development workflow

See `1_ARCHITECTURE.md`.




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
- [Architecture Document](./1_ARCHITECTURE.md)



---

**Last Updated**: April 2026
**Status**: Development / PoC Phase
