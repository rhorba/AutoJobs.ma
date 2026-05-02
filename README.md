# AutoJobs.ma

> Vertical job board for Morocco's automotive, battery, and EV manufacturing cluster.  
> Serving Kenitra, Tangier, Casablanca, and Jorf Lasfar.

---

## What is this?

AutoJobs.ma is a niche SaaS job board connecting HR teams at OEMs, tier-1/2 suppliers, and battery plants with candidates from Morocco's automotive sector (Stellantis Kenitra, Renault, Gotion High-Tech, Yazaki, Aptiv, Sumitomo, IFMIA graduates).

**Business model:** Pay-per-post — employers pay 490 MAD (~€45) to publish a job offer for 30 days.

**Beta launch:** 6 Jul 2026 | **Public launch:** 20 Jul 2026

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Runtime | React 19 |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 + shadcn/ui v4 |
| Database + Auth | Supabase (PostgreSQL 15 + Row-Level Security) |
| File Storage | Supabase Storage (`candidate-cvs` bucket, private) |
| Payments | Stripe (EUR settlement, MAD display) |
| Email | Resend |
| Analytics | PostHog (EU cloud, IP anonymized) |
| Hosting | Vercel |
| DNS / CDN | Cloudflare |

---

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/rhorba/AutoJobs.ma.git
cd AutoJobs.ma
npm install
```

### 2. Configure environment

```bash
cp .env.local.example .env.local
# Fill in your Supabase, Stripe, Resend, and PostHog credentials
```

### 3. Set up the database

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

Then create a **private** storage bucket named `candidate-cvs` in the Supabase dashboard.

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Key Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | TypeScript check (no emit) |
| `npm test` | Run Vitest unit tests |
| `npm run test:coverage` | Tests with coverage report |

---

## Project Structure

```
app/
├── (auth)/           # Login, registration (candidate + employer)
├── (candidate)/      # Profile, CV upload, applications list, apply form
├── (employer)/       # Job posting CRUD, applicant inbox, payment page
├── (public)/         # Job board listing + detail (SSR, SEO)
├── (admin)/          # Company verification dashboard
├── api/v1/           # REST API routes
└── page.tsx          # Landing page (static)

lib/                  # Stripe, Resend, Supabase helpers, utilities
emails/               # Resend email templates
supabase/migrations/  # Database schema (initial schema, indexes, RLS)
types/database.ts     # Generated Supabase types
middleware.ts         # Route guards + CSP headers
```

---

## Roles

| Role | Home route | Description |
|---|---|---|
| `candidate` | `/profil` | Job seekers — build profile, apply to jobs |
| `employer` | `/offres` | HR teams — post jobs, manage applicants, pay |
| `admin` | `/admin/entreprises` | Internal — verify companies, moderate listings |

Candidates must reach **80% profile completeness** before they can apply.

---

## Deployment

See `DOCUMENTATION.md` — Section 14 (Deployment Checklist) for full steps covering Supabase, Vercel, Cloudflare, Stripe, and Resend.

---

## Documentation

| Document | Description |
|---|---|
| `DOCUMENTATION.md` | Full technical reference (API, DB schema, security, env vars) |
| `docs/prd-autojobs.md` | Product Requirements Document |
| `docs/architecture-autojobs.md` | Architecture Decision Records + system design |
| `docs/stories-autojobs.md` | User stories and acceptance criteria |
