# TODO

## Pending
- [ ] Sendgrid domain authentication for commons-fabric.ca (noreply@commons-fabric.ca / general@commons-fabric.ca)
- [ ] Implement GraphQL schema and resolvers (see ARCHITECTURE.md §5)
- [ ] Test Supabase connection + GraphQL endpoint with real queries

## Done
- [x] Boilerplate repo initialized (Next.js, Prisma, Apollo, Supabase, Sendgrid, Tailwind)
- [x] npm packages installed + Prisma client generated
- [x] All env vars configured in `.env`
- [x] Supabase project created and credentials added
- [x] Sendgrid set up — temporary sender: noreply@lukavukovic.space / luka.vuko@outlook.com
- [x] JWT + CRON secrets generated
- [x] Database migrations run
- [x] `npm run dev` works, GraphQL playground at http://localhost:3000/api/graphql
- [x] TypeScript clean (`npx tsc --noEmit`)
