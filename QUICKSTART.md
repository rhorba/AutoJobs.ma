# AutoJobs.ma — Developer Quick Reference

## Local Setup (5 minutes)

```bash
git clone https://github.com/rhorba/AutoJobs.ma.git
cd AutoJobs.ma
npm install
cp .env.local.example .env.local   # fill in credentials
npm run dev                         # http://localhost:3000
```

---

## Environment Variables (`.env.local`)

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase dashboard → Settings → API (keep server-only) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe dashboard → Developers → API keys |
| `STRIPE_SECRET_KEY` | Stripe dashboard → Developers → API keys |
| `STRIPE_WEBHOOK_SECRET` | Stripe dashboard → Webhooks (use `stripe listen` locally) |
| `STRIPE_PRICE_ID_PAY_PER_POST` | Stripe dashboard → Products |
| `RESEND_API_KEY` | resend.com → API Keys |
| `NEXT_PUBLIC_POSTHOG_KEY` | PostHog → Project Settings |

---

## Database Setup

```bash
# Link to your Supabase project
supabase link --project-ref <ref>

# Push all migrations (schema + indexes + RLS)
supabase db push

# Generate updated TypeScript types after schema changes
supabase gen types typescript --linked > types/database.ts
```

Create a **private** storage bucket named `candidate-cvs` in the Supabase dashboard (Storage → New bucket → uncheck "Public").

---

## Stripe Webhook (local testing)

```bash
# Forward Stripe events to your local server
stripe listen --forward-to http://localhost:3000/api/v1/payments/webhook

# Copy the webhook signing secret it prints → STRIPE_WEBHOOK_SECRET in .env.local
```

---

## Key Commands

| Command | What it does |
|---|---|
| `npm run dev` | Start Next.js dev server with HMR |
| `npm run build` | Production build (catches type errors) |
| `npm run typecheck` | TypeScript check without building |
| `npm run lint` | ESLint check |
| `npm test` | Run Vitest unit tests |
| `npm run test:coverage` | Tests + V8 coverage report |

---

## Routes at a Glance

| Path | Who | Description |
|---|---|---|
| `/` | Public | Landing page |
| `/jobs` | Public | Job board listing |
| `/jobs/[id]` | Public | Job detail |
| `/connexion` | Public | Login |
| `/inscription/candidat` | Public | Candidate signup |
| `/inscription/employeur` | Public | Employer signup |
| `/profil` | Candidate | Profile + CV upload |
| `/candidatures` | Candidate | Applications list |
| `/offres` | Employer | Job postings list |
| `/offres/nouvelle` | Employer | Create new job |
| `/offres/[id]/paiement` | Employer | Pay to activate job |
| `/offres/[id]/candidatures` | Employer | Applicant inbox |
| `/admin/entreprises` | Admin | Company verification |

---

## API Overview

All endpoints under `/api/v1/`. Authentication via Supabase session cookie.

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/complete-profile` | user | Finish registration |
| `GET/PATCH` | `/candidates/me` | candidate | Own profile |
| `POST` | `/candidates/me/cv` | candidate | Upload CV (PDF ≤ 10 MB) |
| `GET/POST` | `/candidates/me/experiences` | candidate | Work history |
| `GET` | `/jobs` | public | List active jobs |
| `POST` | `/jobs` | employer | Create job posting |
| `GET` | `/jobs/[id]/applications` | employer | Applicant list |
| `POST` | `/applications` | candidate | Apply to a job |
| `PATCH` | `/applications/[id]` | employer | Update application status |
| `POST` | `/payments/checkout` | employer | Create Stripe Checkout |
| `POST` | `/payments/webhook` | Stripe | Activate job on payment |
| `PATCH` | `/admin/companies/[id]` | admin | Verify company |
| `GET` | `/tags` | public | List skill tags |

---

## Commit Convention

```
type(scope): description

Types: feat, fix, docs, chore, refactor, test
Examples:
  feat(candidate): add CV upload with PDF validation
  fix(payments): handle duplicate webhook events
  docs: update API reference in DOCUMENTATION.md
```

---

## Branching

```
main        → production (autojobs.ma via Vercel)
feature/*   → new features
fix/*       → bug fixes
```

Vercel auto-deploys `main` and generates preview URLs for all branches.
