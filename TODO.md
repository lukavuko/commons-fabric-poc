# Configuration TODO List

## Environment Variables to Configure

Create a `.env` file based on `.env.example` and fill in the following:

### Database Configuration
- [ ] `DATABASE_URL` - PostgreSQL connection string from Supabase
  - Get from: Supabase Dashboard → Settings → Database → Connection String
  - Format: `postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres`

### Supabase Configuration
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
  - Get from: Supabase Dashboard → Settings → API → Project URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Anonymous public key
  - Get from: Supabase Dashboard → Settings → API → Project API keys → anon/public
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Service role key (admin access)
  - Get from: Supabase Dashboard → Settings → API → Project API keys → service_role
  - **WARNING:** Keep this secret, never expose client-side

### Email Configuration (Sendgrid)
- [ ] `SENDGRID_API_KEY` - Sendgrid API key
  - Get from: Sendgrid Dashboard → Settings → API Keys
  - Create new key with "Mail Send" permissions
- [ ] `SENDGRID_FROM_EMAIL` - Verified sender email
  - Must verify domain/email in Sendgrid first
  - Free tier: Use single sender verification

### Security Tokens
- [ ] `JWT_SECRET` - Random secret for JWT signing
  - Generate: `openssl rand -base64 32`
  - Keep secure, never commit to git
- [ ] `CRON_SECRET` - Secret for cron job authentication
  - Generate: `openssl rand -base64 32`
  - Used to protect background job endpoints

### Environment
- [ ] `NODE_ENV` - Set to "development" for local work
- [ ] `LOG_LEVEL` - Set to "info" or "debug"

---

## Service Account Setup

### 1. Supabase Account
- [ ] Create account at https://app.supabase.com
- [ ] Create new project (select Canada region for data residency)
- [ ] Wait for provisioning (~2 minutes)
- [ ] Copy credentials from Settings → Database and Settings → API

### 2. Sendgrid Account
- [ ] Create account at https://sendgrid.com
- [ ] Verify email address
- [ ] Create API key (Settings → API Keys → Create API Key)
- [ ] Choose "Restricted Access" → Enable "Mail Send"
- [ ] Set up sender authentication (Settings → Sender Authentication)
  - Option 1: Single Sender Verification (free, quick)
  - Option 2: Domain Authentication (recommended for production)

---

## Database Setup

After configuring `DATABASE_URL`:

```bash
# Generate Prisma client
npx prisma generate

# Create initial migration
npx prisma migrate dev --name init

# (Optional) Open Prisma Studio to view database
npx prisma studio
```

---

## Verification Checklist

- [ ] All environment variables set in `.env`
- [ ] Supabase project created and credentials added
- [ ] Sendgrid account set up with verified sender
- [ ] JWT and CRON secrets generated
- [ ] Database migrations run successfully
- [ ] `npm run dev` starts without errors
- [ ] GraphQL playground accessible at http://localhost:3000/api/graphql
- [ ] No TypeScript errors: `npx tsc --noEmit`

---

## Next Steps After Configuration

1. Test Supabase connection: Create a test user via Supabase Dashboard
2. Test GraphQL endpoint: Run a test query in Apollo Sandbox
3. Begin implementing GraphQL schema and resolvers (see ARCHITECTURE.md section 5)
