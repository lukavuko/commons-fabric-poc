# Commons Fabric Project - Technical Architecture Document

**Version**: 1.0
**Date**: April 2026
**Timeline**: 4-week PoC development
**Budget**: <$200 USD (free tier services)
**Status**: Ready for Implementation

---

[TOC]



## 1. Executive Summary

The Commons Fabric Project PoC is a federated community engagement platform enabling geographic discovery, event aggregation, and lightweight community governance. The architecture prioritizes rapid iteration, maintainability, and eventual open-sourcing.

**Key Design Principles:**
- Monolithic frontend/backend initially (separation of services after PoC validation)
- Schema-first database design with programmatic migrations
- GraphQL for flexible, self-documenting APIs
- Zero personal data persistence (privacy-by-default)
- Infrastructure as Code for reproducibility

---

## 2. Technology Stack

| Layer | Technology | Version | Rationale |
|-------|-----------|---------|-----------|
| **Frontend** | [Next.js](https://nextjs.org/) | 14+ | React with SSR, API routes, optimized for PoC speed |
| **Backend** | [Apollo Server](https://www.apollographql.com/docs/apollo-server/) | 4+ | GraphQL with full control over resolvers for custom logic |
| **Database** | [PostgreSQL](https://www.postgresql.org/) | 14+ | Relational model suits hierarchical communities/events |
| **ORM/Migrations** | [Prisma](https://www.prisma.io/docs/) | 5+ | Schema-as-code, auto migrations, TypeScript generation |
| **Authentication** | [Supabase Auth](https://supabase.com/docs/guides/auth) | Built-in | Email/password + OAuth (Google, GitHub) |
| **Hosting (Frontend)** | [Vercel](https://vercel.com/docs) | - | Native Next.js deployment, zero-config |
| **Hosting (Database)** | [Supabase](https://supabase.com/docs) | Managed | PostgreSQL + Auth + real-time (Canadian region available) |
| **Email** | [Sendgrid](https://docs.sendgrid.com/) | v3 API | Transactional email, extensible for future channels |
| **Logging** | [Pino](https://getpino.io/) + [Supabase Logs](https://supabase.com/docs/guides/platform/logs) | - | Structured logging, built-in dashboard |
| **Background Jobs** | [Node.js Worker Threads](https://nodejs.org/api/worker_threads.html) or [Bull](https://github.com/OptimalBits/bull) | - | Schedule notifications, batch processing (local initially) |
| **Type Safety** | [TypeScript](https://www.typescriptlang.org/) | 5+ | All code (frontend, backend, DB schema) |



---

## 3. System Architecture

### 3.1 High-Level Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      User Browser (Client)                      │
│                   (Next.js Frontend React)                       │
└─────────────────────────────────────────────────────────────────┘
                              ↕ (GraphQL over HTTP)
┌─────────────────────────────────────────────────────────────────┐
│                   Next.js Server (Backend)                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ API Routes (/api/graphql)                                │  │
│  │  └─ Apollo Server (GraphQL Resolvers)                    │  │
│  │     ├─ Auth verification (JWT)                           │  │
│  │     ├─ Data fetching (Prisma ORM)                        │  │
│  │     └─ Business logic (comments, RSVPs, matching)        │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Background Jobs                                          │  │
│  │  ├─ Email notifications (Sendgrid)                       │  │
│  │  ├─ Community matching algorithm                         │  │
│  │  └─ Unverified user cleanup                              │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↕ (SQL via Prisma)
┌─────────────────────────────────────────────────────────────────┐
│  PostgreSQL Database (Supabase Instance)                        │
│  ├─ Communities & metadata                                      │
│  ├─ Events, RSVPs, comments                                     │
│  ├─ Users & authentication (Supabase Auth)                      │
│  ├─ Subscriptions & preferences                                 │
│  └─ Tentative users (auto-expiring)                             │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Component Responsibilities

**Frontend (Next.js React)**
- Browse communities (map view, search gallery)
- Subscribe/unsubscribe from communities
- View aggregated event calendar and announcements
- Submit RSVPs and comments (authenticated)
- Set notification preferences
- Organizer dashboard (community settings, moderation)

**Backend (Apollo GraphQL)**
- Query resolution (communities, events, comments, users)
- Mutation handling (create RSVP, post comment, update settings)
- Authentication/authorization logic
- Community matching algorithm execution
- Data validation and business rules

**Database (PostgreSQL)**
- Persistent data store for all entities
- Relationship integrity (foreign keys, constraints)
- Supabase Auth integration (users table)
- Audit trail for moderation actions

**Background Jobs (Node.js)**
- Email digest sending (daily/weekly summaries)
- Real-time event notifications
- Community matching computation
- Unverified user cleanup (>30 days)

---

## 4. Database Schema

### 4.1 Prisma Schema Definition

```prisma
// Database schema defined in schema.prisma
// Prisma handles SQL generation and TypeScript type generation

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  displayName   String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  lastLoginAt   DateTime?

  // Relations
  subscriptions Subscription[]
  comments      Comment[]
  rsvps         RSVP[]
  notificationPreferences NotificationPreference?
  communityRoles CommunityRole[]
}

model TentativeUser {
  id        String    @id @default(cuid())
  email     String    @unique
  createdAt DateTime  @default(now())
  expiresAt DateTime  // Auto-deleted if no action within 30 days
}

model Community {
  id              String    @id @default(cuid())
  name            String
  description     String?
  location        String
  latitude        Float
  longitude       Float
  tags            String[]  // ["running", "toronto", "nonprofit"]
  website         String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  // Relations
  events          Event[]
  subscriptions   Subscription[]
  members         CommunityRole[]
  comments        Comment[]
}

model Event {
  id          String    @id @default(cuid())
  communityId String
  community   Community @relation(fields: [communityId], references: [id], onDelete: Cascade)
  title       String
  description String?
  startsAt    DateTime
  endsAt      DateTime
  location    String?
  icalUrl     String?   // Generated .ics file URL
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  // Relations
  rsvps       RSVP[]
  comments    Comment[]
}

model RSVP {
  id        String    @id @default(cuid())
  userId    String
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  eventId   String
  event     Event     @relation(fields: [eventId], references: [id], onDelete: Cascade)
  status    RSVPStatus  // GOING, INTERESTED, NOT_GOING
  createdAt DateTime  @default(now())

  @@unique([userId, eventId])
}

model Comment {
  id          String    @id @default(cuid())
  content     String
  userId      String
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  communityId String
  community   Community @relation(fields: [communityId], references: [id], onDelete: Cascade)
  eventId     String?   // Optional: comment on event instead of community
  event       Event?    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  status      CommentStatus  // PENDING, APPROVED, REJECTED
}

model Subscription {
  id          String    @id @default(cuid())
  userId      String
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  communityId String
  community   Community @relation(fields: [communityId], references: [id], onDelete: Cascade)
  type        SubType[] // [EVENTS, ANNOUNCEMENTS, BOTH]
  createdAt   DateTime  @default(now())

  @@unique([userId, communityId])
}

model NotificationPreference {
  id              String    @id @default(cuid())
  userId          String    @unique
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  channel         String    // "email" (extensible for future channels)
  frequency       Frequency  // REALTIME, DAILY, WEEKLY
  preferredTime   String?   // "09:00" for daily digests
  unsubscribedAt  DateTime? // Soft-delete: null = active
  createdAt       DateTime  @default(now())
}

model CommunityRole {
  id          String    @id @default(cuid())
  userId      String
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  communityId String
  community   Community @relation(fields: [communityId], references: [id])
  role        Role      // MEMBER, MODERATOR, ORGANIZER
  grantedAt   DateTime  @default(now())

  @@unique([userId, communityId])
}

enum RSVPStatus {
  GOING
  INTERESTED
  NOT_GOING
}

enum CommentStatus {
  PENDING
  APPROVED
  REJECTED
}

enum SubType {
  EVENTS
  ANNOUNCEMENTS
  BOTH
}

enum Frequency {
  REALTIME
  DAILY
  WEEKLY
}

enum Role {
  MEMBER
  MODERATOR
  ORGANIZER
}
```

### 4.2 Migrations Strategy

- **Development**: `prisma migrate dev --name <description>` (auto-generates SQL)
- **Production**: `prisma migrate deploy` (applies versioned migrations)
- **Reset (PoC only)**: `prisma migrate reset` (wipes + rebuilds schema)
- All migrations stored in `prisma/migrations/` as version-controlled SQL files

**Reference**: [Prisma Migrate Documentation](https://www.prisma.io/docs/orm/prisma-migrate/understanding-prisma-migrate)

---

## 5. GraphQL API Design

### 5.1 Core Queries

```graphql
type Query {
  # User queries
  me: User                              # Current authenticated user
  user(id: ID!): User

  # Community queries
  communities(
    filter: CommunityFilter
    pagination: Pagination
  ): [Community!]!

  community(id: ID!): Community
  searchCommunities(query: String!, limit: Int = 10): [Community!]!

  # Geographic/discovery
  communitiesByLocation(
    latitude: Float!
    longitude: Float!
    radiusKm: Int = 50
  ): [Community!]!

  # Events
  events(
    communityId: ID
    fromDate: DateTime
    toDate: DateTime
  ): [Event!]!

  myFeed(limit: Int = 20): Feed!        # Aggregated for user subscriptions

  # Comments
  communityComments(communityId: ID!): [Comment!]!
  eventComments(eventId: ID!): [Comment!]!
}

type Mutation {
  # Auth
  signUp(email: String!, password: String!): AuthPayload!
  signIn(email: String!, password: String!): AuthPayload!
  signOut: Boolean!

  # Community management (organizer only)
  createCommunity(input: CreateCommunityInput!): Community!
  updateCommunity(id: ID!, input: UpdateCommunityInput!): Community!
  addCommunityMember(communityId: ID!, userId: ID!, role: Role!): CommunityRole!
  removeCommunityMember(communityId: ID!, userId: ID!): Boolean!

  # Events
  createEvent(communityId: ID!, input: CreateEventInput!): Event!
  updateEvent(id: ID!, input: UpdateEventInput!): Event!
  deleteEvent(id: ID!): Boolean!

  # Subscriptions
  subscribeToCommunity(communityId: ID!, types: [SubType!]!): Subscription!
  unsubscribeFromCommunity(communityId: ID!): Boolean!
  updateSubscriptionType(subscriptionId: ID!, types: [SubType!]!): Subscription!

  # RSVPs
  rsvpToEvent(eventId: ID!, status: RSVPStatus!): RSVP!
  cancelRSVP(eventId: ID!): Boolean!

  # Comments
  postComment(input: PostCommentInput!): Comment!

  # Preferences
  updateNotificationPreference(input: NotificationPreferenceInput!): NotificationPreference!
  unsubscribeFromNotifications: Boolean!
}

type User {
  id: ID!
  email: String!
  displayName: String
  subscriptions: [Subscription!]!
  notificationPreference: NotificationPreference
  createdAt: DateTime!
}

type Community {
  id: ID!
  name: String!
  description: String
  location: String!
  latitude: Float!
  longitude: Float!
  tags: [String!]!
  website: String
  events(upcoming: Boolean = true): [Event!]!
  subscribers: [User!]!
  subscriberCount: Int!
  comments: [Comment!]!
  members: [CommunityRole!]!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type Event {
  id: ID!
  community: Community!
  title: String!
  description: String
  startsAt: DateTime!
  endsAt: DateTime!
  location: String
  rsvpCount: Int!
  rsvps(status: RSVPStatus): [RSVP!]!
  icalUrl: String!                    # .ics download link
  comments: [Comment!]!
  createdAt: DateTime!
}

type Feed {
  announcements: [Community!]!        # Latest from subscribed communities
  upcomingEvents: [Event!]!
  recentComments: [Comment!]!
}

type AuthPayload {
  user: User!
  token: String!                      # JWT
}
```

### 5.2 Security Rules (Apollo Context)

All resolvers verify JWT token and attach user context:

```typescript
// Pseudocode: Apollo context middleware
const context = async ({ req }) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  const user = token ? verifyJWT(token) : null;

  return { user }; // All resolvers can access req.context.user
};

// Example resolver with auth check
const createEvent = async (_, { input }, { user }) => {
  if (!user) throw new Error("Unauthenticated");

  const community = await prisma.community.findUnique({
    where: { id: input.communityId },
    include: { members: true }
  });

  const isOrganizer = community.members.some(m =>
    m.userId === user.id && m.role === "ORGANIZER"
  );

  if (!isOrganizer) throw new Error("Not authorized");

  return prisma.event.create({ data: input });
};
```

**Reference**: [Apollo Server Authorization](https://www.apollographql.com/docs/apollo-server/security/authentication/)

---

## 6. Authentication & Authorization (RBAC)

### 6.1 User Flows

**Unidentified User:**
- Browse communities and events (no auth required)
- Access public API endpoints

**Email-Only Subscriber:**
- Subscribe via email (no account created)
- Receive digests/notifications
- Cannot comment or RSVP

**Registered User (Email + Password):**
- Create account → verify email
- Unverified users stored in `tentative_user` table
- Auto-deleted if unverified >30 days
- Once verified → moved to `users` table
- Can subscribe, comment, RSVP

**OAuth User (Google/GitHub):**
- Sign in directly via Supabase Auth
- Account created automatically
- Email verified by OAuth provider

### 6.2 Role-Based Access Control (RBAC)

Three tiers per community:

| Role | Permissions |
|------|-------------|
| **MEMBER** | View community, events, comments; RSVP; comment; subscribe to updates |
| **MODERATOR** | Above + approve/reject comments; manage event RSVPs |
| **ORGANIZER** | Above + create/edit events; manage members; set community info |

Stored in `CommunityRole` join table. Organizers assign roles via dashboard mutation.

### 6.3 JWT Token Structure

```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "iat": 1234567890,
  "exp": 1234571490,
  "metadata": {
    "communities": ["community-id-1", "community-id-2"]
  }
}
```

Issued by Supabase Auth. Apollo resolvers verify signature and validate expiration.

**Reference**: [Supabase Auth Documentation](https://supabase.com/docs/guides/auth/overview)

---

## 7. Notification System Architecture

### 7.1 Email Notification Flow

```
User sets NotificationPreference (channel=email, frequency=DAILY, time=09:00)
                    ↓
[Daily Cron Job @ 09:00 UTC]
                    ↓
Query: Get users with DAILY preference, subscribed communities, new events/announcements
                    ↓
Generate email digest template
                    ↓
Send via Sendgrid API
                    ↓
Log result in notification_logs table
```

### 7.2 Implementation (Node.js Background Job)

```typescript
// /api/cron/send-digests.ts (triggered by Vercel Crons)
import { Sendgrid } from '@sendgrid/mail';
import { prisma } from '@/lib/prisma';

export default async function handler(req) {
  // Verify cron secret
  if (req.headers['authorization'] !== `Bearer ${process.env.CRON_SECRET}`) {
    return { status: 401 };
  }

  const users = await prisma.notificationPreference.findMany({
    where: {
      frequency: 'DAILY',
      unsubscribedAt: null,
      user: {
        subscriptions: { some: {} } // Has subscriptions
      }
    },
    include: { user: true }
  });

  for (const pref of users) {
    const feed = await generateUserFeed(pref.user.id);
    await sendgrid.send({
      to: pref.user.email,
      from: process.env.SENDGRID_FROM_EMAIL,
      subject: `Your Commons Fabric Digest`,
      html: renderDigestTemplate(feed)
    });
  }

  return { status: 200, sent: users.length };
}
```

### 7.3 Extensibility for Future Channels

Each notification channel inherits from a base interface:

```typescript
interface NotificationChannel {
  name: string;
  send(recipient: string, message: string): Promise<void>;
  validate(recipient: string): boolean;
}

class EmailChannel implements NotificationChannel {
  async send(email: string, message: string) {
    return sendgrid.send({ to: email, html: message });
  }
}

class WhatsAppChannel implements NotificationChannel {
  async send(phoneNumber: string, message: string) {
    // Twilio integration (future)
  }
}

const channels = {
  email: new EmailChannel(),
  whatsapp: new WhatsAppChannel(), // Added later
};
```

**Reference**: [Sendgrid Node.js Documentation](https://github.com/sendgrid/sendgrid-nodejs)

---

## 8. Calendar Integration

### 8.1 iCal Export (.ics Files)

Each event generates a downloadable .ics file:

```typescript
// /api/ics/[communityId]/[eventId].ics
import { icalendarFromEvent } from '@/lib/ical';

export default async function handler(req, res) {
  const event = await prisma.event.findUnique({
    where: { id: req.query.eventId },
    include: { community: true }
  });

  const ics = icalendarFromEvent(event);
  res.setHeader('Content-Type', 'text/calendar');
  res.setHeader('Content-Disposition', `attachment; filename="${event.id}.ics"`);
  res.send(ics);
}
```

Supports import into Google Calendar, Outlook, Apple Calendar via standard iCalendar format (RFC 5545).

### 8.2 Calendar Sync (Future Enhancement)

Once user authenticates with Google Calendar API:
- Authorize read/write access to user's calendar
- Store refresh token securely in database
- Sync subscribed events bidirectionally

For PoC, implement .ics download only.

---

## 9. Community Matching Algorithm (Research Phase)

### 9.1 PoC Scope (Not Implemented)

This is deferred to post-PoC iteration. Placeholder architecture:

**Input:**
- 30 communities with tags, location (lat/long), size

**Algorithm:**
1. Geographic clustering: K-means on coordinates
2. Tag similarity: Cosine similarity on normalized tag vectors
3. Weighting: `match_score = 0.6 * geographic + 0.4 * tag_similarity`

**Output:**
- Hierarchical groupings at map zoom levels (country → province → city)
- Stored in `adjacency_list` table for query efficiency

**Research areas to explore:**
- [PostGIS](https://postgis.net/) for geographic queries
- [pg_trgm](https://www.postgresql.org/docs/current/pgtrgm.html) for text similarity
- Batch computation (daily Cron) vs on-demand frontend clustering

Implement basic proximity search first; defer complex matching to Phase 2.

---

## 10. Deployment & Infrastructure

### 10.1 Architecture Diagram (Deployment)

```
GitHub Repository
    ↓ (push to main)
Vercel CI/CD Pipeline
    ├─ Lint / Type Check
    ├─ Build Next.js
    ├─ Run tests
    └─ Deploy
         ↓
Vercel Edge (Frontend + API Routes)
    ↓ (GraphQL queries via Prisma)
Supabase PostgreSQL (Canada region)
    ├─ Automatic backups
    ├─ Connection pooling (PgBouncer)
    └─ Real-time subscriptions

Background Jobs (Vercel Crons / Bull Workers)
    ↓ (API calls)
Sendgrid (Email delivery)
```

### 10.2 Service Configuration

**Vercel (Frontend + Backend)**
- Automatic deployments on git push
- Environment variables injected from `.env.local`
- Zero-config Next.js optimization
- Cost: Free tier covers PoC

**Supabase (Database + Auth)**
- PostgreSQL 14 with Canadian region option
- Managed backups (daily, 7-day retention)
- Connection pooling enabled
- Row-level security (RLS) for multi-tenancy (future)
- Cost: Free tier ($0 for PoC)

**Sendgrid (Email)**
- 100 emails/day free tier
- Production account ($20/month) if needed
- API key stored in Vercel secrets
- Cost: Free for PoC, $20/month post-launch

### 10.3 Environment Setup

```bash
# .env.local (local development)
DATABASE_URL=postgresql://user:pass@localhost/cfp_dev
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_KEY=xxx
SENDGRID_API_KEY=xxx
JWT_SECRET=xxx
CRON_SECRET=xxx
```

All secrets stored in Vercel project settings (never in git).

---

## 11. Development Workflow

### 11.1 Local Development Setup

```bash
# Clone and setup
git clone <repo>
cd cfp-poc
npm install

# Initialize Prisma (one-time)
npx prisma generate
npx prisma migrate dev --name init

# Start dev server
npm run dev  # Runs Next.js on localhost:3000

# Access GraphQL playground
open http://localhost:3000/api/graphql
```

### 11.2 Database Migrations

```bash
# Add a new field to Community model
# 1. Edit prisma/schema.prisma
model Community {
  // ... existing fields ...
  phoneNumber String?  // NEW
}

# 2. Generate migration
npx prisma migrate dev --name add_phone_to_community

# 3. Prisma generates SQL, applies it, updates schema.prisma

# 4. TypeScript types auto-updated (no manual work)
```

### 11.3 GraphQL Development

```bash
# Generate TypeScript types from schema
npm run codegen

# Test queries in Apollo Studio Sandbox
open http://localhost:3000/api/graphql
```

### 11.4 Testing Strategy

```bash
# Unit tests (Jest)
npm run test

# Integration tests (API routes)
npm run test:integration

# E2E tests (Playwright)
npm run test:e2e
```

---

## 12. Scalability & Future Services

### 12.1 Current Architecture (Monolithic)

```
Single Next.js Instance
├─ Frontend (React)
├─ GraphQL API (Apollo)
├─ Background Jobs (Crons)
└─ Database (Prisma)
```

Sufficient for:
- 100-1000 concurrent users
- Event-driven workloads (not real-time streaming)
- 4-week PoC validation

### 12.2 Post-PoC Services Architecture

Once PoC validates demand, extract services:

```
Monorepo Structure:
├─ frontend/         (Next.js)
├─ api/              (Next.js API routes + Apollo)
├─ services/
│  ├─ notifications/ (Python + Celery for email/WhatsApp/Signal)
│  ├─ matching/      (Go + gRPC for community algorithm)
│  ├─ analytics/     (Python + Pandas for dashboards)
│  └─ moderation/    (Node.js + AI for comment filtering)
└─ infrastructure/   (Terraform for AWS/GCP deployment)
```

Each service:
- Separate Git repo (after PoC)
- Own database (for appropriate services)
- gRPC or REST APIs for inter-service communication
- Docker containers for local dev + cloud deployment

### 12.3 From PoC to Production

**Week 5-8:**
- Swap Supabase for AWS RDS (cost optimization)
- Move background jobs to AWS Lambda/ECS
- Add CloudFront CDN for frontend
- Implement monitoring (CloudWatch, Datadog)

**Week 9+:**
- Extract services as demand scales
- Add Kafka for event streaming (real-time features)
- Implement caching layer (Redis via AWS ElastiCache)
- Multi-region replication for Canada-only requirement

**Open-Sourcing Readiness:**
- All infrastructure as Terraform code (included in repo)
- Schema + migrations + seed data (reproducible DB setup)
- Deployment guide for self-hosting communities
- Security audit before release

---

## 13. Cost Breakdown (PoC, 4 Weeks)

| Service | Tier | Monthly Cost | Notes |
|---------|------|--------------|-------|
| Vercel | Free | $0 | Covers frontend + backend |
| Supabase | Free | $0 | PostgreSQL + Auth (5 GB limit) |
| Sendgrid | Free | $0 | 100 emails/day |
| GitHub | Free | $0 | Public repo (switch to private later) |
| **Total** | | **$0** | Well under $200 budget |

**Production (estimated):**
- Vercel Pro: $20/month
- Supabase Pro: $25/month (500 GB)
- Sendgrid: $20/month (100k emails)
- AWS (optional): $50-100/month
- **Total: ~$115-165/month**

---

## 14. Implementation Roadmap (4 Weeks)

### Week 1: Foundation
- [ ] Set up Vercel + Supabase projects
- [ ] Initialize Next.js monorepo with TypeScript
- [ ] Configure Prisma, Apollo Server, Supabase Auth
- [ ] Implement database schema
- [ ] GraphQL setup (queries only)

### Week 2: Core Features
- [ ] User authentication (email + OAuth)
- [ ] Community CRUD (organizer actions)
- [ ] Event creation/display
- [ ] RSVP mutations
- [ ] Basic frontend (community browser, event view)

### Week 3: User Engagement
- [ ] Subscriptions (communities + preferences)
- [ ] Comment system (creation + moderation status)
- [ ] Notification preferences (frequency, time)
- [ ] Email digest job (Sendgrid integration)
- [ ] Organizer dashboard UI

### Week 4: Polish & Launch
- [ ] Calendar export (.ics files)
- [ ] Search + tag filtering
- [ ] Responsive design (mobile)
- [ ] Error handling + logging
- [ ] Performance optimization
- [ ] Deployment + go-live

---

## 15. Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Supabase API changes | High | Pin versions, monitor releases |
| Email deliverability | Medium | Set up SPF/DKIM, monitor bounce rates |
| GraphQL N+1 queries | Medium | Use Prisma `include` + Apollo caching |
| Unverified user cleanup job fails | Low | Add alerting, manual cleanup script |
| Data residency (Canada) | Medium | Verify Supabase region before launch |

---

## 16. References & Documentation

**Core Technologies:**
- [Next.js 14 Docs](https://nextjs.org/docs)
- [Apollo Server 4 Docs](https://www.apollographql.com/docs/apollo-server/)
- [Prisma ORM Docs](https://www.prisma.io/docs/)
- [PostgreSQL 14 Docs](https://www.postgresql.org/docs/14/)
- [Supabase Docs](https://supabase.com/docs)

**Deployment:**
- [Vercel Deployment Docs](https://vercel.com/docs)
- [Supabase Hosting](https://supabase.com/docs/guides/hosting/overview)

**Authentication:**
- [Supabase Auth](https://supabase.com/docs/guides/auth/overview)
- [JWT Best Practices](https://tools.ietf.org/html/rfc7519)

**Notifications:**
- [Sendgrid Node.js Library](https://github.com/sendgrid/sendgrid-nodejs)
- [iCalendar Format (RFC 5545)](https://tools.ietf.org/html/rfc5545)

**Observability:**
- [Pino Logger](https://getpino.io/)
- [Vercel Analytics](https://vercel.com/analytics)

---

## 17. Approval & Sign-Off

**Architecture Status:** ✅ Ready for Implementation

**Next Step:** Proceed to repository initialization and Week 1 development.

For questions or clarifications, refer to this document or the original PoC discovery document.

---

**Document Version History:**
| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-04-16 | Technical Team | Initial architecture design |
