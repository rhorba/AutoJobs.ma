# AutoJobs.ma — Project Documentation

> Vertical job board for Morocco's automotive / battery / EV manufacturing cluster.
> Target zones: Kenitra, Tangier, Casablanca, Jorf Lasfar.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Repository Structure](#3-repository-structure)
4. [Database Schema](#4-database-schema)
5. [Authentication & Authorization](#5-authentication--authorization)
6. [API Reference](#6-api-reference)
7. [Pages & Routes](#7-pages--routes)
8. [Core Business Logic](#8-core-business-logic)
9. [Payments (Stripe)](#9-payments-stripe)
10. [Email Notifications (Resend)](#10-email-notifications-resend)
11. [SEO & Metadata](#11-seo--metadata)
12. [Security](#12-security)
13. [Environment Variables](#13-environment-variables)
14. [Deployment Checklist](#14-deployment-checklist)
15. [Pending: Tests to Write Before Beta](#15-pending-tests-to-write-before-beta)

---

## 1. Project Overview

AutoJobs.ma is a niche SaaS job board built for Morocco's fast-growing automotive and EV manufacturing sector. The market opportunity: Gotion High-Tech's $6.8B gigafactory (25 000 jobs over 10 years), Stellantis Kenitra, Renault R&D, Yazaki/Aptiv/Sumitomo — with no vertical talent marketplace currently serving them.

**Business model:** Pay-per-post — employers pay to publish a job offer for 30 days.

| Metric | Target |
|---|---|
| Price per post | 490 MAD ≈ €45 (charged in EUR via Stripe) |
| Beta launch | 6 Jul 2026 |
| Public launch | 20 Jul 2026 |
| 90-day goal | 10 paying employers · 1 500 candidates · 30–60k MAD MRR |

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Runtime | React 19 |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 + shadcn/ui v4 |
| Database | Supabase (PostgreSQL 15) |
| Auth | Supabase Auth (email/password) |
| File storage | Supabase Storage (`candidate-cvs` bucket, private) |
| Payments | Stripe (EUR settlement, MAD display) |
| Email | Resend |
| Analytics | PostHog (EU cloud) |
| Hosting | Vercel (free tier) |
| DNS / CDN | Cloudflare |
| Forms | react-hook-form + Zod v4 |
| Notifications | Sonner (toast) |

---

## 3. Repository Structure

```
autojobs-ma/
├── app/
│   ├── (admin)/          # Admin panel (company verification)
│   │   └── entreprises/
│   ├── (auth)/           # Login / registration pages
│   │   ├── connexion/
│   │   ├── inscription/
│   │   │   ├── candidat/
│   │   │   └── employeur/
│   │   └── verification-en-attente/
│   ├── (candidate)/      # Candidate-only area
│   │   ├── candidatures/ # Application list + apply form
│   │   └── profil/       # Profile + CV upload + experience
│   ├── (employer)/       # Employer-only area
│   │   └── offres/       # Job listing CRUD + applicant inbox
│   ├── (public)/         # Anonymous-accessible pages
│   │   └── jobs/         # Job board listing + detail
│   ├── api/v1/           # REST API routes
│   │   ├── admin/companies/[id]/
│   │   ├── applications/[id]/
│   │   ├── applications/
│   │   ├── auth/complete-profile/
│   │   ├── candidates/me/
│   │   │   ├── cv/
│   │   │   └── experiences/[id]/
│   │   ├── jobs/[id]/applications/
│   │   ├── jobs/
│   │   ├── payments/checkout/
│   │   ├── payments/webhook/
│   │   └── tags/
│   ├── auth/callback/    # Supabase OAuth callback
│   ├── layout.tsx        # Root layout (PostHog, Sonner, cookie consent)
│   ├── page.tsx          # Landing page
│   ├── robots.ts         # robots.txt generation
│   └── sitemap.ts        # Dynamic XML sitemap
├── components/
│   ├── cookie-consent.tsx
│   ├── posthog-provider.tsx
│   └── ui/               # shadcn components
├── emails/               # Resend email templates
│   ├── application-confirmed.ts
│   └── new-application.ts
├── lib/
│   ├── api-response.ts   # ok() / err() helpers
│   ├── completeness.ts   # calcCompleteness()
│   ├── email.ts
│   ├── resend.ts
│   ├── slugify.ts
│   ├── stripe.ts
│   └── utils.ts
├── middleware.ts          # Route guards + CSP headers
├── supabase/
│   └── migrations/
│       ├── 20260426000001_initial_schema.sql
│       ├── 20260426000002_indexes.sql
│       └── 20260426000003_rls_policies.sql
└── types/
    └── database.ts       # Generated Supabase types
```

---

## 4. Database Schema

14 tables, created in dependency order.

### Core tables

| Table | Purpose |
|---|---|
| `profiles` | Extends `auth.users` — stores role (`employer`, `candidate`, `admin`) |
| `skill_tags` | Master taxonomy: role families, technical skills, certifications, languages, soft skills |
| `companies` | Employer organisations; `verified_at` set by admin |
| `recruiters` | Employer users, linked to a company; `is_company_owner` flag |
| `candidates` | Candidate profiles; includes `profile_completeness` (0–100) |
| `candidate_skills` | M:N join of candidates × skill_tags with proficiency level |
| `candidate_experiences` | Work history per candidate |
| `job_postings` | Job offers; status lifecycle: `draft → pending_payment → active → closed/expired` |
| `job_skills` | M:N join of job_postings × skill_tags (`is_required` flag) |
| `applications` | Candidate-to-job applications; unique per (job, candidate) |
| `subscriptions` | Company billing plans (pay_per_post, starter_annual, growth_annual, enterprise) |
| `payments` | Payment records linked to Stripe payment intents |
| `recruiter_invites` | Token-based invite system for multi-recruiter companies |
| `salary_benchmarks` | SEO content: salary ranges by role, published as blog-style pages |

### Key constraints

- `job_postings.salary_max >= salary_min`
- `candidates.profile_completeness BETWEEN 0 AND 100`
- `applications` has `UNIQUE (job_posting_id, candidate_id)` — duplicate apply is blocked at DB level
- All tables with mutable data have an `updated_at` trigger via `update_updated_at()` function

---

## 5. Authentication & Authorization

### Three-layer security model

```
Layer 1 — Next.js middleware (route guards, role redirects)
Layer 2 — API route guards (auth check + role check per handler)
Layer 3 — Supabase RLS (row-level, database-enforced)
```

### Role → home page mapping

| Role | Home |
|---|---|
| `candidate` | `/profil` |
| `employer` | `/tableau-de-bord` |
| `admin` | `/admin/entreprises` |

### Protected route prefixes (middleware)

| Prefix group | Allowed roles |
|---|---|
| `/tableau-de-bord`, `/offres`, `/talents`, `/facturation` | `employer`, `admin` |
| `/profil`, `/candidatures` | `candidate`, `admin` |
| `/admin` | `admin` only (returns 403 for others) |

### Registration flow

**Employer:**
1. `POST /api/v1/auth/complete-profile` — creates `companies` + `recruiters` rows + `profiles` row
2. Redirected to `/verification-en-attente` — account is pending admin approval (`companies.verified_at`)

**Candidate:**
1. `POST /api/v1/auth/complete-profile` — creates `candidates` + `profiles` rows
2. Redirected to `/profil` immediately

### Supabase RLS highlights

- Candidates are only readable by employers who have received an application from them
- Job postings: public reads `active` only; recruiter reads all statuses for their company
- Applications: candidates see only their own; recruiters see only their company's
- Payments / subscriptions: company-scoped read only
- Service role key (`SUPABASE_SERVICE_ROLE_KEY`) is used in API routes to bypass RLS where needed (e.g., reading recruiter email to send notifications)

---

## 6. API Reference

All routes live under `/api/v1/`. All responses use `ok(data, status)` / `err(message, status)` helpers from `lib/api-response.ts`.

### Auth

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/v1/auth/complete-profile` | user | Finish registration — creates profile, company/candidate rows |
| `GET` | `/auth/callback` | — | Supabase OAuth callback |

### Candidates

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET / PATCH` | `/api/v1/candidates/me` | candidate | Read / update own profile + recalculate completeness |
| `POST` | `/api/v1/candidates/me/cv` | candidate | Upload CV PDF (Supabase Storage, private bucket) |
| `GET / POST` | `/api/v1/candidates/me/experiences` | candidate | List / create work experience entries |
| `PATCH / DELETE` | `/api/v1/candidates/me/experiences/[id]` | candidate | Update / delete single experience |

### Jobs

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/v1/jobs` | public | List active jobs (filterable by city, contract type, skills) |
| `POST` | `/api/v1/jobs` | employer | Create new job posting (status: `draft`) |
| `GET` | `/api/v1/jobs/[id]/applications` | employer | List applications for a job with candidate details + signed CV URL |

### Applications

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/v1/applications` | candidate | Apply to a job (80% completeness gate, duplicate check, expiry check) |
| `PATCH` | `/api/v1/applications/[id]` | employer | Update application status (`viewed`, `shortlisted`, `rejected`) |

### Payments

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/v1/payments/checkout` | employer | Create Stripe Checkout session for a job posting |
| `POST` | `/api/v1/payments/webhook` | Stripe sig | Handle `checkout.session.completed` → activate job posting |

### Admin

| Method | Path | Auth | Description |
|---|---|---|---|
| `PATCH` | `/api/v1/admin/companies/[id]` | admin | Verify / unverify a company |

### Tags

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/v1/tags` | public | List active skill tags (used in forms and filters) |

---

## 7. Pages & Routes

### Public (unauthenticated)

| Route | Description |
|---|---|
| `/` | Landing page — value proposition, industries served, CTA |
| `/jobs` | Job board listing with filters |
| `/jobs/[id]` | Job detail page |

### Auth

| Route | Description |
|---|---|
| `/connexion` | Login (email + password) |
| `/inscription/candidat` | Candidate registration form |
| `/inscription/employeur` | Employer registration form |
| `/verification-en-attente` | Post-employer-signup holding page |

### Candidate (role-guarded)

| Route | Description |
|---|---|
| `/profil` | Profile editor: personal info, skills, experiences, completeness meter |
| `/profil` (cv-upload) | PDF CV upload component with server-side validation |
| `/candidatures` | List of submitted applications with status |
| `/candidatures/postuler` | Apply form with job selection and cover note |

### Employer (role-guarded)

| Route | Description |
|---|---|
| `/offres` | List of company's job postings |
| `/offres/nouvelle` | New job posting form |
| `/offres/[id]/paiement` | Payment page (Stripe Checkout redirect) |
| `/offres/succes` | Post-payment success screen |
| `/offres/[id]/candidatures` | Applicant inbox — view candidates, change status |

### Admin (role-guarded)

| Route | Description |
|---|---|
| `/admin/entreprises` | Company verification dashboard |

---

## 8. Core Business Logic

### Profile Completeness (`lib/completeness.ts`)

The `calcCompleteness()` function scores a candidate profile 0–100. Candidates must reach **80%** to apply to any job.

| Criterion | Points |
|---|---|
| First name + last name | 20 |
| City | 10 |
| Years of experience | 10 |
| Availability status | 10 |
| At least 1 work experience | 20 |
| At least 3 skills | 15 |
| CV uploaded | 15 |
| **Total** | **100** |

### Application Flow

1. Candidate submits `POST /api/v1/applications` with `job_id` + optional `cover_note`
2. API checks:
   - Authenticated as `candidate`
   - Profile completeness ≥ 80
   - Job exists and is `active`
   - Job has not expired (`expires_at`)
   - No duplicate application (`UNIQUE` constraint + pre-check)
3. Application row inserted (`status: "submitted"`)
4. Email notifications sent (non-fatal — app submit succeeds even if email fails):
   - Recruiter: "New application received"
   - Candidate: "Application confirmed"

### Job Posting Lifecycle

```
draft
  ↓  (employer submits form)
pending_payment
  ↓  (Stripe checkout.session.completed webhook)
active  ← expires_at = now + 30 days
  ↓  (manual or cron)
closed / expired
```

### CV Signed URLs

CV files are stored in a **private** Supabase Storage bucket (`candidate-cvs`). When an employer views applications, the API generates a signed URL with a **300-second expiry** — never exposing the raw storage path.

---

## 9. Payments (Stripe)

**Price:** 4 500 EUR cents (€45) per job posting, displayed as 490 MAD in the UI.

### Checkout flow

1. Employer clicks "Publier l'offre" on `/offres/[id]/paiement`
2. `POST /api/v1/payments/checkout` creates a Stripe Checkout Session:
   - Uses `STRIPE_PRICE_ID_PAY_PER_POST` if set; falls back to inline `price_data`
   - `metadata` contains `{ job_posting_id, company_id }`
   - `success_url` → `/offres/succes`, `cancel_url` → back to payment page
3. Browser redirects to Stripe-hosted checkout
4. On payment success, Stripe calls `POST /api/v1/payments/webhook`

### Webhook handler (`checkout.session.completed`)

- Verifies Stripe signature via `stripe.webhooks.constructEvent()`
- **Idempotency:** skips processing if `payments` table already has a `succeeded` record for this `stripe_payment_intent_id`
- Records payment in `payments` table
- Sets `job_postings.status = 'active'` + `expires_at = now + 30 days`

---

## 10. Email Notifications (Resend)

Sent from `noreply@autojobs.ma` (requires Resend domain verification).

### Templates (`emails/`)

| Template | Recipient | Trigger |
|---|---|---|
| `new-application.ts` | Recruiter | Candidate applies to their job |
| `application-confirmed.ts` | Candidate | Their application is submitted |

Email errors are caught and swallowed — they never cause the API to return an error to the client.

---

## 11. SEO & Metadata

### Landing page (`app/page.tsx`)

- Full `<head>` metadata: `title`, `description`, `keywords`
- Open Graph tags: `og:title`, `og:description`, `og:image`, `og:url`
- Twitter Card tags

### Dynamic sitemap (`app/sitemap.ts`)

Auto-generated XML sitemap served at `/sitemap.xml`:

| URL | Frequency | Priority |
|---|---|---|
| `/` (home) | daily | 1.0 |
| `/jobs` | hourly | 0.9 |
| `/jobs/[id]` (active, non-expired jobs) | weekly | 0.8 |

### `robots.txt` (`app/robots.ts`)

Allows all crawlers on public pages; disallows all private/authenticated routes:
`/api/`, `/profil`, `/candidatures`, `/offres`, `/tableau-de-bord`, `/talents`, `/facturation`, `/admin`

---

## 12. Security

### Content Security Policy (middleware)

Applied on every protected-route response:

```
default-src 'self'
script-src 'self' 'unsafe-inline' https://<posthog-host>
connect-src 'self' https://<posthog-host> https://*.supabase.co
img-src 'self' data: blob:
style-src 'self' 'unsafe-inline'
font-src 'self'
frame-src 'none'
object-src 'none'
base-uri 'self'
form-action 'self'
```

> Note: `script-src 'unsafe-inline'` is a known TODO — replace with nonces post-launch.

### Cookie consent (`components/cookie-consent.tsx`)

GDPR-style banner; PostHog analytics only initialised after user accepts.

### Input validation

All API routes validate request bodies with **Zod** before touching the database. Schema errors return `422 Unprocessable Entity`.

### Known patterns

- `params` / `searchParams` in Next.js App Router are `Promise<T>` — always awaited
- Supabase `.eq()` on enum columns requires explicit cast
- shadcn v4 `Button` has no `asChild` — use `buttonVariants()` + `cn()` on `<Link>`

---

## 13. Environment Variables

Copy `.env.local.example` to `.env.local` and fill in all values.

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_PRICE_ID_PAY_PER_POST      # optional — falls back to price_data
STRIPE_PRICE_ID_STARTER_ANNUAL    # reserved for future plans
STRIPE_PRICE_ID_GROWTH_ANNUAL     # reserved for future plans

# Resend
RESEND_API_KEY
RESEND_FROM_EMAIL=noreply@autojobs.ma

# PostHog
NEXT_PUBLIC_POSTHOG_KEY
NEXT_PUBLIC_POSTHOG_HOST=https://eu.posthog.com

# App
NEXT_PUBLIC_APP_URL=https://autojobs.ma
```

---

## 14. Deployment Checklist

All steps are manual (one-time).

### 1. GitHub
```bash
git remote add origin <repo-url>
git push -u origin master
```

### 2. Supabase
```bash
supabase link --project-ref <ref>
supabase db push
```
Then create the `candidate-cvs` storage bucket as **private** in the Supabase dashboard.

### 3. Vercel
- Import GitHub repo
- Add all env vars from `.env.local.example`
- Deploy

### 4. Cloudflare DNS
```
CNAME  autojobs.ma  →  cname.vercel-dns.com
```

### 5. Stripe
- Create product: `"Publication d'offre 30 jours"` with price 4 500 EUR cents
- Copy price ID → `STRIPE_PRICE_ID_PAY_PER_POST` in Vercel
- Add webhook endpoint: `https://autojobs.ma/api/v1/payments/webhook`
- Event: `checkout.session.completed`
- Copy webhook secret → `STRIPE_WEBHOOK_SECRET` in Vercel

### 6. Resend
- Verify domain `autojobs.ma`
- Set `RESEND_API_KEY` + `RESEND_FROM_EMAIL=noreply@autojobs.ma`

### 7. PostHog
- Set `NEXT_PUBLIC_POSTHOG_KEY` + `NEXT_PUBLIC_POSTHOG_HOST=https://eu.posthog.com`

---

## 15. Pending: Tests to Write Before Beta

These are the critical paths that must be covered before the beta launch on 6 Jul 2026.

| Priority | Type | Description |
|---|---|---|
| P0 | Integration | Stripe webhook happy path + replay idempotency |
| P0 | Integration | RBAC — employer cannot access another company's applications |
| P0 | Integration | IDOR on `PATCH /api/v1/applications/[id]` |
| P1 | Unit | `calcCompleteness` — all scoring branches (the 80% gate is business-critical) |
| P1 | Integration | `POST /api/v1/applications` — duplicate check + completeness gate + expired job |
