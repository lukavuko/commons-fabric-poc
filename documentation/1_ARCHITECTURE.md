# Commons Fabric Project - Technical Architecture Document

**Version**: 1.1
**Date**: April 2026
**Timeline**: 4-week PoC development
**Budget**: <$200 USD (free tier services)
**Status**: Ready for Implementation

---

[TOC]



## 1. Executive Summary

The Commons Fabric PoC is a federated community engagement platform enabling geographic discovery, event aggregation, and lightweight community governance. The architecture prioritizes rapid iteration, maintainability, and eventual open-sourcing.

**Key Design Principles:**

- Monolithic frontend/backend initially (separation of services after PoC validation)
- Schema-first database design with programmatic migrations
- GraphQL for flexible, self-documenting APIs
- Zero personal data persistence (privacy-by-default)
- Infrastructure as Code for reproducibility



## 2. Tech Stack

### **Requirements, Barriers & Assumptions, Constraints**

Before we decide on a stack, we need to understand what the application will be doing. Our idea requires that we have users who can subscribe to different communities, decide on their communication preferences, post events to community calendar or announcements to the community page, notify other members of the posting, and govern their groups participation in order to share these key bits of information. At its core, primary values include **autonomy** (for the user, for the community), **visibility** to bridge existing gaps among communities and users, **governance** to maintain integrity of the platform, **simplicity** to support out of the box ease of use, and **time savings** so that community stewards can naturally share information across a fragmented and constrained communication ecosystem.

The largest barrier is adoption. Are users trusting and willing enough to try yet another platform for themselves or their community? The biggest worry a user might have is needing to manage several services in parallel, having to sync information across from them, and having to use multiple communication channels to get a message across. To overcome these valid concerns, we must solve that problem. We'll offer simplicity, ease of use and navigation, and a way to more effectively connect the community to its members via using a unique calendar focused approach. We can also use web scraping agents to help naturally synchronize data so that users don't have the burden to fill a whole community profile out from scratch or to maintain it when their websites changes. We can also assume that users will have very different preferences for how they'd like to be notified (if at all) about happenings and how we can curate only to their needs. This individualism requires an application that's dynamic and responsive to user's specific requirements.

Constraints include the desire to keep all data in Canada and to not depend on highly centralized profit-seeking services for our application. We are also assuming we have $0.



### **The Tech Stack**

#### Short version: 

React + Vite frontend deployed on distributive edge servers for very low cost, providing a hybrid client-side / server-side rendered page that allows users to query a backend server operating on Node.js. The data base will be accessed using a self-documenting GraphQL API structure to simplify development by avoiding the need to create REST endpoints, and a relational PostgreSQL database for an initial low cost, easy, and flexible startup. The backend server and database will be hosted on different servers. Database schema will be stored using Prisma ORM, and infrastructure will be stored as code with Pulumi. User verification and authentication will be outsourced to SupabaseAuth for convenience and reliability.

#### Long version:

**Frontend** - React + Vite hosted on TBD

The first question to ask about frontend is where do we want the application to be rendered and how? This is the debate of CSR/SSR/SSH/ISR/PPR. Since the application is very individualistic, may update frequently, may be used by hundreds of people possible, and is expected to provide instant feedback, we need a UI that can update without the page fully reloading over and over again.

This is answered with client-side rendering (CSR) which minimizes server compute and instead distributes the workload (in a decentralized fashion) to your own device. This allows us to host the frontend on very low-cost edge servers whose only responsibility is to serve users via static content delivery networks (CDN) for running the website in browser. For this reason, a framework like React + Vite are appealing even though we can also consider Angular and Vue. React is widely adopted with many library component options while [Vite](https://strapi.io/blog/vite-es-modules-hmr-front-end-workflow#:~:text=Vite%20is%20a%20modern%20frontend%20build%20tool) offers very [high performance](https://semaphore.io/blog/vite) and can eliminate overhead.

Hosting the frontend is really just hosting the static files for browsers to download and run locally from the users device. This can be accomplished with many services that copy the website files across many edge servers for delivery. Since nothing is dynamically running or processes on our frontend host, no data ever goes through them given that we ensure no rewrites/proxying, no serverless functions, and no server-side rendering takes place with the host. Ideally we want the host to be free and provide ease of integration with Github to deployment. Options include [Vercel](https://vercel.com/pricing), [Netlify](https://www.netlify.com/with/react/) ([pricing](https://www.netlify.com/pricing/)), [Cloudflare](https://developers.cloudflare.com/pages/framework-guides/deploy-a-react-site/) ([pricing](https://pages.cloudflare.com/)), [Firebase](https://firebase.google.com/pricing). We can also go directly with cloud providers but their free tiers usually expire after a year.

**Backend** - GraphQL spec served via Node.js (Apollo Server) + Prisma ORM hosted on ???

Since we expect interactivity and user triggered services (calendar updates, email/notifications), we need a backend that is always available for such requests. We also introduce a lot of complexity based on the variety of user roles and how they intend to use the application based on their community permissions across many communities. For this reason, writing a REST API for every type of request in my opinion, is a great way to shoot ourselves not in one foot, but in both. Instead, we can leave data fetching to a single, auto-documenting, endpoint served using GraphQL specification on [almost any environment](https://graphql.org/resources/backend/#tools-and-libraries) (Node.js or Python for example.) though I'd suggest one what shares typing with the front end (Node using Apollo Server) with Prisma which handles db schema-as-code, auto migrations, autocompletion, TypeScript generation, query building, and type safety unlike many prior ORMs.

There are many [advantages](https://blog.postman.com/graphql-vs-rest/) to using GraphQL specification that I'm not fully qualified to talk about, but the main ones I've seen are a single endpoint to simplify routing, very precise data fetching to return only what's needed, and at its core: a way to decouple database querying from business logic. This last key point can remove a lot of overhead, and ultimately lets small teams to move faster and more flexibly because there's less work to be done in the back. 

In terms of what language will run the server, I suggest Node + Apollo because it uses typescript and shares types with the frontend. Prisma schemas 

There's also the problem of authentication. Without a human expert to configure these things, we should look to rely on trusted sources that manage this. This is solved for free thanks to SupabaseAuth handling login/logout, signup, email verification, password hashing, session management (JWT tokens), password resetting, OAuth, rate limiting (for bad actors), and more. 

As for hosting our backend, again we have many options. We want it to be hosted in Canada only, at no cost, and with no cold starts (always available). A few that come to mind are [Oracle Cloud](https://www.oracle.com/ca-en/cloud/free/) (hosted in Montreal or Toronto) and [Fly.io](https://fly.io) (hosted in Toronto).

If we ever have require complex backend processes, then we can always expand into serverless or worker nodes to execute these functions, though I doubt we'll need this for a POC.

**Database** - Relational Model (PostgreSQL) hosted on Supabase

For communities with consequential impact, <u>integrity</u> must be at the core of our DB when handling governance, announcements, and reliability. Relational models also suit <u>scalability</u> and <u>complexity of function</u> for future feature development. Hosting a database should be in Canada and free of cost. The data server itself can also be self-hosted on Oracle Cloud's free tier, neon.tech, xata.io, aiven.io, AWS RDS, Azure, GCP, or Fly.io. [Supabase](https://supabase.com/docs/guides/auth/quickstarts/react) is also an option but it may only support US data hosting.

**Features & Tools**

Sendgrid for emails, Pino for logging.



## 3. System Architecture

### 3.1 High-Level Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      User Browser (Client)                      │
│                 React SPA (built with Vite, CSR)                │
│              Apollo Client — manages GraphQL requests           │
└─────────────────────────────────────────────────────────────────┘
                              ↕ (GraphQL over HTTPS)
┌─────────────────────────────────────────────────────────────────┐
│                    Node.js Server (Backend)                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ GraphQL Endpoint: /graphql                               │  │
│  │  └─ Apollo Server — parses GraphQL, routes to resolvers  │  │
│  │     ├─ Auth verification (JWT from Supabase)             │  │
│  │     ├─ Data access via Prisma ORM                        │  │
│  │     └─ Business logic (comments, RSVPs)                  │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Scheduled Jobs & Worker                                  │  │
│  │  ├─ Scheduled Notifications                              │  │
│  │  └─                                                      │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↕ (SQL via Prisma)
┌─────────────────────────────────────────────────────────────────┐
│  PostgreSQL Database (Supabase)                                 │
│  ├─ Communities, hubs, events, announcements                    │
│  ├─ Users, subscriptions, RSVPs, comments                       │
│  └─ Auth managed by Supabase Auth                               │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Component Responsibilities

**Frontend — React SPA built with Vite**
React components make up the user-facing interface. The app is built as a client-side-rendered single-page application using Vite, then deployed as static assets. Data is fetched via **Apollo Client**, a GraphQL client library that runs in the browser. Apollo Client sends queries and mutations to the backend, caches responses, and keeps the UI in sync. Client-side routing is handled within the SPA (e.g. React Router).

**Backend — Node.js server running Apollo Server**
The backend is a standalone Node.js service that runs **Apollo Server**, a GraphQL library for Node. It exposes a single `/graphql` endpoint. When a request arrives, Apollo Server parses the GraphQL query, validates it against the schema, and calls the appropriate **resolver** functions. Resolvers contain the business logic and data access layer — they call **Prisma** (the ORM) to read from or write to the PostgreSQL database, and verify the user's identity via JWT before performing any protected operation.

**Database — PostgreSQL via Supabase**
Supabase hosts the PostgreSQL database. Prisma defines the schema as code (`schema.prisma`) and generates versioned SQL migrations. Supabase Auth manages user identity and issues JWTs that the backend verifies.

**Scheduled Jobs**
Recurring tasks — email digest dispatch via Sendgrid, cleanup of unverified user records, and future batch work — run on a scheduler co-located with the backend service. The specific mechanism is still to be decided (see the Background Jobs row of the Tech Stack table).

---

## 4. Database Schema

The full schema is defined in [`prisma/schema.prisma`](prisma/schema.prisma). Prisma handles SQL generation and TypeScript type generation — the schema file is the source of truth for all database structure.

For a visual representation of the entity relationships, open [`prisma/schema.dbml`](prisma/schema.dbml) in [dbdiagram.io](https://dbdiagram.io).

**Core models:** `User`, `Hub`, `HubCommunity`, `Community`, `Event`, `Announcement`, `Comment`, `Subscription`, `UserEvent`, `UserRole`, `Role`, `RolePermission`, `Permission`

**Key design decisions:**

- CUIDs on all public-facing models; integer PKs on internal/junction tables
- Polymorphic associations on `UserRole` and `Comment` — no DB-level FK, enforced via CHECK constraints added manually in migrations
- `onDelete: Cascade` on personal/junction data; `onDelete: SetNull` on community content to preserve history when a user is deleted
- 6 CHECK constraints must be added manually to the initial migration SQL (not generated by Prisma) — see `claude.log` for the full list

**Migrations:**

- **Development**: `npm run prisma:migrate` — generates SQL and applies interactively
- **Production**: `prisma migrate deploy` — applies versioned migrations without prompts
- **Reset (PoC only)**: `npm run prisma:reset` — wipes and rebuilds from scratch
- All migrations are version-controlled under `prisma/migrations/`

**Reference**: [Prisma Migrate Documentation](https://www.prisma.io/docs/orm/prisma-migrate/understanding-prisma-migrate)

---

## 5. GraphQL API Design

The GraphQL schema defines the contract between the frontend (Apollo Client) and the backend (Apollo Server). The schema describes what data can be queried, what mutations can be performed, and what types are returned.

**Core query domains:**
- **User** — current authenticated user profile and preferences
- **Communities** — browse, filter, and search communities; geographic proximity queries
- **Events** — community events with date range filters; aggregated personal feed
- **Announcements** — community announcements feed
- **Comments** — threaded comments on events and announcements
- **Subscriptions** — user-to-community subscription records and notification preferences

**Core mutation domains:**
- **Auth** — sign up, sign in, sign out (delegated to Supabase Auth)
- **Community management** — create/update communities (organizer-only)
- **Member management** — add/remove members and assign roles
- **Events** — create, update, delete events
- **RSVPs** — RSVP to events, cancel RSVPs
- **Subscriptions** — subscribe/unsubscribe, update notification preferences
- **Comments** — post and moderate comments

The schema is defined in [`src/graphql/schema.ts`](src/graphql/schema.ts) and resolvers live under [`src/graphql/resolvers/`](src/graphql/resolvers/).

The live interactive API documentation is available at the backend's `/graphql` endpoint when running the development server (Apollo Sandbox).

---

## 6. Authentication & Authorization

Authentication is handled by **Supabase Auth**, which supports email/password login and OAuth providers (Google, GitHub). Upon sign-in, Supabase issues a JWT that the frontend sends with every GraphQL request via the `Authorization: Bearer <token>` header.

**Apollo Server** validates this token on every protected request. The decoded token is attached to the GraphQL context, making user identity available to all resolvers without repeated database lookups.

Authorization is enforced at the resolver level. Each resolver that requires a specific permission checks the requesting user's role before proceeding. Role-based access is stored in the `user_role` table, which links users to roles scoped per entity (community or hub). Roles map to permissions via the `role_permissions` and `permission` tables, which define the full set of actions the application supports.

The specifics of role tiers, permission definitions, and their governance (how organizers can define custom roles) are still being deliberated and will be documented separately once finalized.

---

## 7. Notification System

### Email Notification Flow

Users set a notification preference per subscription — choosing a frequency (real-time, daily, weekly) and a preferred delivery time. A scheduled backend job runs at fixed intervals, queries users whose digest is due, generates an email digest from their subscribed community feed, and sends it via Sendgrid.

```
User sets preference: channel=EMAIL, frequency=DAILY, time=09:00
                    ↓
[Scheduled job triggers daily at 09:00]
                    ↓
Query users with DAILY preference + active subscriptions
                    ↓
Generate digest from new events and announcements
                    ↓
Send via Sendgrid API → Log result
```

### Extensibility

The notification layer is designed around a channel interface so that future channels (SMS, WhatsApp, etc.) can be added by implementing the same contract without modifying existing logic. For the PoC, only email is implemented.

---

## 8. Calendar Integration

### .ics Download

Each event exposes a downloadable `.ics` file conforming to the iCalendar standard (RFC 5545). Users can save this file and import it into any calendar application — Google Calendar, Outlook, or Apple Calendar.

A dedicated backend route at `/ics/:eventId` generates the `.ics` response with the appropriate `Content-Type: text/calendar` header.

### Calendar Sync (Future)

Full two-way calendar sync via the Google Calendar API or Microsoft Graph API is deferred to a post-PoC phase. For the PoC, deep links to Google Calendar and Outlook's event-creation flows provide a lightweight "Add to calendar" experience that requires no OAuth or token storage.

---

## 9. Security

Security considerations span three layers of the application and are deliberately kept simple for the PoC.

**Frontend.** The React SPA never handles raw credentials or stores sensitive data in local storage. Auth tokens are managed by the Supabase client SDK, which stores them in memory or secure cookies. Because the frontend and backend are deployed as separate services, the backend must explicitly allow the frontend's origin via CORS — this should be configured tightly (single allowed origin in production, not a wildcard).

**Backend.** Every GraphQL resolver that modifies or reads protected data verifies the JWT from the request context before proceeding. Apollo Server is configured to strip stack traces from error responses in production. Input validation occurs at the resolver level before any database write. The `/graphql` endpoint is the single surface area for all data access.

**Database.** Prisma enforces schema-level constraints (types, nullability, relations). CHECK constraints in migrations enforce domain rules that Prisma cannot express (e.g., polymorphic type enums). Supabase supports Row-Level Security (RLS) policies for multi-tenant data isolation — this is planned as a future hardening step once the permission model is finalized. Database credentials are stored exclusively in environment variables, never in the repository.

The full permission model — which actions each role can perform, how organizers define custom roles, and how RLS policies map to those roles — is still being deliberated and will be defined before any community-facing launch.



# 11. Development Workflow

**Local setup**

```bash
git clone <repo>
cd cfp-poc
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run dev   # starts frontend (Vite) and backend (Apollo Server)
```

**Adding a database field**

Edit `prisma/schema.prisma`, then run `npx prisma migrate dev --name <description>`. Prisma generates the SQL migration, applies it, and regenerates TypeScript types automatically.

**GraphQL development**

Edit `src/graphql/schema.ts` for type definitions and add or update resolver functions under `src/graphql/resolvers/`. The Apollo Sandbox available at the backend's `/graphql` endpoint reflects schema changes live during development.

**Generating TypeScript types**

```bash
npm run codegen   # generates types from GraphQL schema
```

**Testing**

```bash
npm run test              # Unit tests (Jest)
npm run test:integration  # Integration tests
npm run test:e2e          # End-to-end tests (Playwright)
```

**Deployment**

Pushing to `main` triggers an automatic Vercel deployment. Environment variables are managed through the Vercel project dashboard — never committed to the repository.

---

## 12. Feature Roadmap

| Feature | Status | Notes |
|---------|--------|-------|
| React + Vite + Prisma + Apollo Server setup | ✅ Done | |
| Database schema + migrations | ✅ Done | |
| GraphQL resolvers (basic) | ✅ Done | |
| User authentication (email + OAuth) | ⬜ Todo | Supabase Auth |
| Community CRUD (organizer) | ⬜ Todo | |
| Event creation and display | ⬜ Todo | |
| RSVP mutations | ⬜ Todo | |
| Community browser (map + search) | ⬜ Todo | |
| Event calendar view | ⬜ Todo | |
| Subscriptions + notification preferences | ⬜ Todo | |
| Comment system | ⬜ Todo | Creation + moderation status |
| Email digest job | ⬜ Todo | Sendgrid + scheduled backend job |
| Organizer dashboard | ⬜ Todo | Member management, community settings |
| .ics calendar export | ⬜ Todo | Per-event download |
| "Add to calendar" deep links | ⬜ Todo | Google + Outlook |
| Tag filtering + search | ⬜ Todo | |
| Responsive mobile design | ⬜ Todo | |
| Unverified user cleanup job | ⬜ Todo | Scheduled backend job, 30-day TTL |
| Row-Level Security (RLS) policies | ⬜ Deferred | Post-PoC hardening |
| Full calendar sync (Google/Outlook API) | ⬜ Deferred | Post-PoC |
| Additional notification channels | ⬜ Deferred | SMS, WhatsApp, etc. |

---

## 13. Known Risks

**GraphQL N+1 queries.** Without care, nested GraphQL resolvers can trigger one database query per resolved item in a list. This is mitigated by using Prisma's `include` option to eager-load relations and by batching with a DataLoader-style pattern where needed. This should be monitored early.

**Supabase free tier limits.** The free Supabase plan imposes a 5 GB storage cap and pauses the project after 7 days of inactivity. For the PoC this is acceptable, but the project will need to be upgraded or migrated before any sustained community use.

**Email deliverability.** Sendgrid's free tier allows 100 emails per day, which is sufficient for testing but constrains notification volume. SPF and DKIM records should be configured for the sending domain before any real community pilot to avoid messages being marked as spam.

**Data residency.** Supabase's Canadian region is available but not all features (such as real-time subscriptions) are guaranteed to be available in all regions. This should be verified before launch if Canadian data residency is a hard requirement.

**Permission model completeness.** The RBAC model is not yet fully defined. Until it is, access control logic in resolvers may need to be revised, and RLS policies cannot be finalized. Avoid building features that rely on fine-grained permissions until the model is locked.

---

## 14. In a Distant Future

### Community Matching Algorithm

This feature is deferred until after the PoC is validated. The intent is to surface geographic and thematic groupings of communities on the map — so that as a user zooms out, related communities aggregate visually into implied "community hubs."

**Proposed approach:**
- Geographic clustering using K-means on community coordinates
- Tag similarity using cosine similarity on normalized tag vectors
- A weighted score: `match_score = 0.6 × geographic + 0.4 × tag_similarity`
- Hierarchical groupings stored in an adjacency list table for efficient querying

**Research areas to explore before implementation:**
- [PostGIS](https://postgis.net/) for geographic queries directly in PostgreSQL
- [pg_trgm](https://www.postgresql.org/docs/current/pgtrgm.html) for text similarity within Postgres
- Pre-computed batch jobs (daily Cron) versus on-demand frontend clustering
- Whether "implied communities" (auto-generated hubs) should be persisted or computed on the fly

This will be revisited as a Phase 2 feature once the core community management and discovery flows are stable.
