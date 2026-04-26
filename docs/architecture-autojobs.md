# Architecture: AutoJobs.ma
**PRD Reference**: docs/prd-autojobs.md
**Version**: 1.0 | **Date**: 2026-04-26 | **Author**: Tech Lead + DBA + Security Engineer

---

## 1. Overview

AutoJobs.ma is a Next.js full-stack monolith deployed on Vercel, backed by Supabase (Postgres + Auth + Storage). All auth, multi-tenancy, and data isolation are handled via Supabase Row-Level Security. Payments go through Stripe (EUR settlement, MAD display). Email via Resend. No microservices, no separate backend, no custom auth — YAGNI applied throughout.

---

## 2. Architecture Decision Records

### ADR-1: Framework — Next.js App Router (Full-Stack Monolith)
**Status**: Accepted
**Context**: Need SSR for public job listings and salary benchmark SEO, authenticated dashboards for employers and candidates, an admin panel, and REST API routes — all maintainable by one developer.

**Options**:
- 🟢 **Next.js App Router** — single codebase; server components for SSR; API routes for backend; Vercel-optimized; TypeScript first-class
- 🟡 Next.js (frontend) + separate Express API — adds operational overhead, cross-origin auth complexity
- 🔴 Next.js (frontend) + FastAPI (backend) — two languages, two deploys, overkill for solo dev

**Decision**: Next.js App Router. One codebase, one deploy, server components handle SEO pages, server actions and API routes handle mutation logic. TypeScript throughout.

**Consequences**: All business logic lives in `app/api/v1/` and Server Actions. No separate backend service to manage. Upgrade path to a separate API exists if team grows.

---

### ADR-2: Hosting — Vercel + Supabase (Free Tier)
**Status**: Accepted
**Context**: Budget ≤ $500 for 6 months across all infrastructure. Need hosting, database, auth, and file storage.

**Options**:
- 🟢 **Vercel free + Supabase free** — $0/month; zero ops; both designed for this stack; 100 GB bandwidth + 500 MB DB + 1 GB storage sufficient for MVP
- 🟡 Railway ($5–20/month) + Supabase — more DB flexibility, small cost
- 🔴 Self-managed VPS (Hetzner €5/month) + managed Postgres — full control, full operational burden

**Decision**: Vercel + Supabase free tiers. Upgrade triggers: Vercel Pro ($20/mo) if bandwidth exceeds 100 GB/month; Supabase Pro ($25/mo) if DB exceeds 450 MB or storage exceeds 900 MB. Both upgrades stay within 6-month budget.

**Consequences**: Vercel serverless function limit (100 invocations/day on free Hobby plan is _per team_ not per function — actually the free tier is generous; 100 GB bandwidth, unlimited function invocations within execution limits). Supabase free tier pauses after 1 week of inactivity — acceptable for beta, must upgrade before public launch.

---

### ADR-3: Authentication — Supabase Auth
**Status**: Accepted
**Context**: Need email/password auth for employer and candidate accounts, with role differentiation and multi-recruiter per company. Must integrate cleanly with Supabase RLS.

**Options**:
- 🟢 **Supabase Auth** — built-in email/password + magic links; JWT sessions; native RLS integration; `@supabase/ssr` for Next.js cookie-based sessions
- 🟡 NextAuth.js (Auth.js) — more provider flexibility; works with any DB; requires custom role management
- 🔴 Custom JWT system — full control, full responsibility for security bugs

**Decision**: Supabase Auth with `@supabase/ssr` for server-side session management (HttpOnly cookies). Role stored in `profiles.role` and enforced via RLS + Next.js middleware.

**Consequences**: OAuth providers (Google, LinkedIn) can be added in v2 with one config change. MFA is available in Supabase Pro (v2 feature). Password reset flow is built-in.

---

### ADR-4: Payment Provider — Stripe Only (v1)
**Status**: Accepted
**Context**: Need to accept card payments for job postings (1,500 MAD ≈ 150 EUR) and annual subscriptions. MAD is not a Stripe settlement currency. CMI (local Moroccan gateway) is an alternative but requires ~2-4 weeks of integration work and ongoing monthly fees.

**Options**:
- 🟢 **Stripe only** — EUR settlement, MAD display; Stripe Checkout handles the UI; annual contracts via bank transfer + manual PDF invoice
- 🟡 Stripe + CMI — covers local MAD card payments; doubles payment integration complexity
- 🔴 CMI only — local-first but worse DX, harder to integrate, international cards rejected

**Decision**: Stripe only for v1. Display prices in MAD everywhere; Stripe Checkout shows EUR equivalent at time of purchase (1 EUR ≈ 10.9 MAD — display exchange rate note to user). Annual contracts accepted via bank transfer: employer emails intent, admin sends PDF invoice (Notion or Word template), marks paid manually in admin panel. CMI added in v2 if >20% of leads drop off at checkout citing card issues.

**Consequences**: Some Moroccan employers may not have international cards. Mitigated by bank transfer option for annual plans (which is culturally normal in Moroccan B2B). Pay-per-post requires an international card.

---

### ADR-5: File Storage — Supabase Storage (Private Bucket)
**Status**: Accepted
**Context**: Candidates upload PDF CVs (≤10 MB). CV access must be restricted: only recruiters who received an application from that candidate may download the CV.

**Options**:
- 🟢 **Supabase Storage, private bucket** — already in stack; signed URL generation server-side; RLS on `objects` table
- 🟡 Cloudflare R2 — cheaper at scale; no egress fees; adds another service
- 🔴 AWS S3 — industry standard; overkill; adds cost and AWS account management

**Decision**: Supabase Storage with a `cvs` private bucket. Access via server-generated signed URLs (60-minute expiry). URL generation requires server-side validation that a valid application relationship exists between the requesting recruiter's company and the candidate.

**Consequences**: 1 GB storage free tier = ~100 CVs at max size (10 MB). In practice, most CVs are 200–500 KB, so ~2,000–5,000 CVs on free tier. Sufficient for MVP. Upgrade to Supabase Pro for 100 GB storage at $25/mo.

---

### ADR-6: Email — Resend
**Status**: Accepted
**Context**: Need transactional email for welcome, application notifications, and payment confirmations. React Email for templates.

**Decision**: Resend (3,000 emails/month free). React Email for template authoring. Simple domain verification via DNS (Cloudflare).

---

### ADR-7: UI Component Library — shadcn/ui + Tailwind CSS
**Status**: Accepted
**Context**: Solo dev needs professional, accessible UI without a custom design system. Must look credible to HR managers at multinationals.

**Decision**: shadcn/ui (copy-paste components built on Radix UI + Tailwind). No full design system — just a component collection. Professional appearance with zero lock-in. Tailwind for all custom styling.

**Consequences**: No dark mode for v1 (YAGNI). No custom brand illustration system. Color palette: automotive professional (navy/charcoal primary, amber accent for Moroccan warmth).

---

### ADR-8: Analytics — PostHog
**Status**: Accepted
**Context**: Need basic product analytics (page views, job post funnel, apply funnel, payment conversion).

**Decision**: PostHog cloud free tier (1M events/month). IP anonymization enabled for Loi 09-08 compliance. Cookie consent banner required before tracking.

---

## 3. System Design

```
┌─────────────────────────────────────────────────────────────┐
│                     Cloudflare DNS + CDN                    │
│                    autojobs.ma → Vercel                     │
└─────────────────────────────────┬───────────────────────────┘
                                  │
┌─────────────────────────────────▼───────────────────────────┐
│                        Vercel Edge                          │
│                                                             │
│  ┌─────────────────┐    ┌──────────────────────────────┐   │
│  │  Next.js (SSR)  │    │   Next.js (Static / ISR)     │   │
│  │  /jobs/*        │    │   /salaire/*  (benchmarks)   │   │
│  │  /entreprises/* │    │   /   (landing page)         │   │
│  └────────┬────────┘    └──────────────────────────────┘   │
│           │                                                  │
│  ┌────────▼─────────────────────────────────────────────┐  │
│  │              Next.js App Router (Authenticated)       │  │
│  │  /tableau-de-bord  /profil  /admin  /offres          │  │
│  │                                                       │  │
│  │         Server Actions + API Routes /api/v1/*         │  │
│  └──────────────────────────┬────────────────────────────┘  │
└─────────────────────────────┼───────────────────────────────┘
                              │
           ┌──────────────────┼──────────────────┐
           │                  │                  │
  ┌────────▼───────┐  ┌───────▼──────┐  ┌────────▼───────┐
  │ Supabase       │  │    Stripe    │  │    Resend      │
  │ ─ Postgres     │  │  Checkout   │  │  Transactional │
  │ ─ Auth (JWT)   │  │  Webhooks   │  │  Email         │
  │ ─ Storage      │  └─────────────┘  └────────────────┘
  │   (CVs, logos) │
  └────────────────┘

  [PostHog] ← client-side analytics (IP anonymized)
```

**Key rendering decisions:**
- Public job listings: SSR (fresh data + SEO meta tags)
- Salary benchmark pages: ISR (revalidate every 24h, SEO-optimized)
- Landing page: Static
- Authenticated dashboards: Client-side with server data fetching (no SEO needed)
- API routes: Serverless functions on Vercel

---

## 4. Data Model

### Entity Relationship Summary
```
auth.users ──1:1──► profiles (role)
profiles ──1:1──► candidates  OR  recruiters
recruiters ──N:1──► companies
companies ──1:N──► job_postings
job_postings ──N:M──► skill_tags  (via job_skills)
candidates ──N:M──► skill_tags    (via candidate_skills)
candidates ──1:N──► candidate_experiences
candidates ──1:N──► applications
job_postings ──1:N──► applications
companies ──1:N──► subscriptions
companies ──1:N──► payments
companies ──1:N──► recruiter_invites
skill_tags ──1:N──► skill_tags    (self-referential hierarchy)
```

### Table Definitions

```sql
-- Extends auth.users; created immediately on signup
CREATE TABLE profiles (
    id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role        TEXT NOT NULL CHECK (role IN ('employer', 'candidate', 'admin')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE companies (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          TEXT NOT NULL,
    slug          TEXT NOT NULL UNIQUE,
    website       TEXT,
    size_range    TEXT CHECK (size_range IN ('1-50','51-200','201-1000','1000+')),
    city          TEXT NOT NULL,
    free_zone     TEXT,  -- 'Tanger Med Zones', 'Kenitra Atlantic', 'Jorf Lasfar'
    logo_path     TEXT,  -- Supabase Storage path
    verified_at   TIMESTAMPTZ,  -- NULL = pending verification
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE recruiters (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id       UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    first_name       TEXT NOT NULL,
    last_name        TEXT NOT NULL,
    title            TEXT,
    is_company_owner BOOLEAN NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE candidates (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id               UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name            TEXT NOT NULL,
    last_name             TEXT NOT NULL,
    phone                 TEXT,  -- optional, stored with consent
    city                  TEXT NOT NULL,
    cv_file_path          TEXT,  -- private Supabase Storage path
    years_experience      INTEGER CHECK (years_experience >= 0),
    availability          TEXT NOT NULL DEFAULT 'immediately'
                          CHECK (availability IN ('immediately','within_1_month','within_3_months','not_looking')),
    profile_completeness  INTEGER NOT NULL DEFAULT 0 CHECK (profile_completeness BETWEEN 0 AND 100),
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- The skills/certifications/role taxonomy
CREATE TABLE skill_tags (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name       TEXT NOT NULL UNIQUE,
    slug       TEXT NOT NULL UNIQUE,
    category   TEXT NOT NULL CHECK (category IN ('role_family','technical_skill','certification','language','soft_skill')),
    parent_id  UUID REFERENCES skill_tags(id),  -- role_family → sub-skills
    is_active  BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- M:N: which skills a candidate has
CREATE TABLE candidate_skills (
    candidate_id  UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    skill_tag_id  UUID NOT NULL REFERENCES skill_tags(id) ON DELETE CASCADE,
    level         TEXT CHECK (level IN ('beginner','intermediate','expert')),
    PRIMARY KEY (candidate_id, skill_tag_id)
);

CREATE TABLE candidate_experiences (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id  UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    company_name  TEXT NOT NULL,
    title         TEXT NOT NULL,
    start_date    DATE NOT NULL,
    end_date      DATE,  -- NULL = current position
    description   TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE job_postings (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id            UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    recruiter_id          UUID NOT NULL REFERENCES recruiters(id),
    title                 TEXT NOT NULL,
    role_family_id        UUID REFERENCES skill_tags(id),  -- must have category='role_family'
    description_fr        TEXT NOT NULL,
    description_en        TEXT,
    city                  TEXT NOT NULL,
    free_zone             TEXT,
    contract_type         TEXT NOT NULL CHECK (contract_type IN ('CDI','CDD','Interim','Stage','Freelance')),
    salary_min            INTEGER CHECK (salary_min > 0),  -- MAD/month
    salary_max            INTEGER CHECK (salary_max >= salary_min),
    language_requirements TEXT[],  -- e.g. ARRAY['French','Mandarin']
    status                TEXT NOT NULL DEFAULT 'draft'
                          CHECK (status IN ('draft','pending_payment','active','closed','expired')),
    expires_at            TIMESTAMPTZ,  -- 30 days from activation
    is_featured           BOOLEAN NOT NULL DEFAULT FALSE,
    views_count           INTEGER NOT NULL DEFAULT 0,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- M:N: skills required/preferred for a job
CREATE TABLE job_skills (
    job_posting_id  UUID NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
    skill_tag_id    UUID NOT NULL REFERENCES skill_tags(id) ON DELETE CASCADE,
    is_required     BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY (job_posting_id, skill_tag_id)
);

CREATE TABLE applications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_posting_id  UUID NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
    candidate_id    UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    status          TEXT NOT NULL DEFAULT 'submitted'
                    CHECK (status IN ('submitted','viewed','shortlisted','rejected')),
    cover_note      TEXT,
    applied_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (job_posting_id, candidate_id)  -- one application per job
);

CREATE TABLE subscriptions (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id              UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    plan                    TEXT NOT NULL CHECK (plan IN ('pay_per_post','starter_annual','growth_annual','enterprise')),
    stripe_subscription_id  TEXT UNIQUE,
    stripe_customer_id      TEXT,
    status                  TEXT NOT NULL DEFAULT 'active'
                            CHECK (status IN ('active','cancelled','past_due','trial')),
    posts_remaining         INTEGER,  -- NULL = unlimited (growth/enterprise)
    starts_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ends_at                 TIMESTAMPTZ,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE payments (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id               UUID NOT NULL REFERENCES companies(id),
    subscription_id          UUID REFERENCES subscriptions(id),
    job_posting_id           UUID REFERENCES job_postings(id),
    stripe_payment_intent_id TEXT UNIQUE,
    amount_eur_cents         INTEGER NOT NULL,  -- e.g. 15000 = €150.00
    amount_mad               INTEGER NOT NULL,  -- display only, e.g. 1500
    status                   TEXT NOT NULL DEFAULT 'pending'
                             CHECK (status IN ('pending','succeeded','failed','refunded')),
    payment_method           TEXT NOT NULL DEFAULT 'stripe_card'
                             CHECK (payment_method IN ('stripe_card','bank_transfer')),
    created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE recruiter_invites (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id   UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    invited_by   UUID NOT NULL REFERENCES recruiters(id),
    email        TEXT NOT NULL,
    token        TEXT NOT NULL UNIQUE,
    expires_at   TIMESTAMPTZ NOT NULL,
    accepted_at  TIMESTAMPTZ,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- SEO content — mostly static, admin-managed
CREATE TABLE salary_benchmarks (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_title_fr            TEXT NOT NULL,
    role_title_en            TEXT,
    slug                     TEXT NOT NULL UNIQUE,
    role_family_id           UUID REFERENCES skill_tags(id),
    salary_min_mad           INTEGER NOT NULL,
    salary_max_mad           INTEGER NOT NULL,
    salary_median_mad        INTEGER NOT NULL,
    typical_certifications   TEXT[],
    typical_hiring_companies TEXT[],
    experience_range         TEXT,  -- '1-3 ans', '3-5 ans', '5+ ans'
    content_fr               TEXT NOT NULL,
    content_en               TEXT,
    published_at             TIMESTAMPTZ,  -- NULL = draft
    updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Indexes

```sql
-- Auth / profile lookups
CREATE UNIQUE INDEX idx_profiles_id ON profiles(id);

-- Company lookup by slug (public URL)
CREATE UNIQUE INDEX idx_companies_slug ON companies(slug);

-- Recruiter lookup by user
CREATE UNIQUE INDEX idx_recruiters_user_id ON recruiters(user_id);

-- Candidate lookup by user
CREATE UNIQUE INDEX idx_candidates_user_id ON candidates(user_id);

-- Job search (most common query)
CREATE INDEX idx_jobs_status_city ON job_postings(status, city);
CREATE INDEX idx_jobs_company ON job_postings(company_id);
CREATE INDEX idx_jobs_role_family ON job_postings(role_family_id);
CREATE INDEX idx_jobs_expires_at ON job_postings(expires_at) WHERE status = 'active';

-- Application lookups
CREATE INDEX idx_applications_job ON applications(job_posting_id);
CREATE INDEX idx_applications_candidate ON applications(candidate_id);

-- Subscription lookup
CREATE INDEX idx_subscriptions_company ON subscriptions(company_id);

-- Taxonomy
CREATE INDEX idx_skill_tags_category ON skill_tags(category) WHERE is_active = TRUE;
CREATE INDEX idx_skill_tags_parent ON skill_tags(parent_id);

-- Salary benchmarks (SEO)
CREATE UNIQUE INDEX idx_benchmarks_slug ON salary_benchmarks(slug);

-- Invite token lookup
CREATE UNIQUE INDEX idx_invites_token ON recruiter_invites(token);
```

### profile_completeness Calculation
Computed and stored on every profile update (via Supabase trigger or server-side on mutation):
- first_name + last_name: +20
- city: +10
- years_experience: +10
- availability: +10
- ≥ 1 experience entry: +20
- ≥ 3 skill tags: +15
- cv_file_path set: +15
- Total: 100

Candidate must reach ≥ 80 to apply.

---

## 5. API Design

All endpoints under `/api/v1/`. Authentication via Supabase session cookie. Authorization enforced server-side per role.

### Auth / Profile
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | /api/v1/auth/complete-profile | Create profiles + candidates/recruiters row after signup | Required |

### Companies
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | /api/v1/companies | Create company (employer onboarding) | employer |
| GET | /api/v1/companies/:id | Get company details | employer (own) / admin |
| PATCH | /api/v1/companies/:id | Update company | owner recruiter / admin |
| POST | /api/v1/companies/:id/invite | Invite recruiter by email | owner recruiter |

### Job Postings
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | /api/v1/jobs | List/search active jobs | public |
| POST | /api/v1/jobs | Create job posting | employer (verified company) |
| GET | /api/v1/jobs/:id | Get job details | public |
| PATCH | /api/v1/jobs/:id | Update job | recruiter (own company) |
| POST | /api/v1/jobs/:id/close | Close job | recruiter (own company) |

### Candidates
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | /api/v1/candidates | Search candidates | employer (growth/enterprise) |
| GET | /api/v1/candidates/me | Get own profile | candidate |
| PATCH | /api/v1/candidates/me | Update own profile | candidate |
| POST | /api/v1/candidates/me/cv | Upload CV (multipart) | candidate |
| GET | /api/v1/candidates/:id/cv-url | Get signed CV URL (60 min) | employer with application relationship |

### Applications
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | /api/v1/applications | Apply to job | candidate (profile ≥ 80%) |
| GET | /api/v1/applications | List own applications | candidate |
| GET | /api/v1/jobs/:id/applications | List applicants for a job | recruiter (own company) |
| PATCH | /api/v1/applications/:id/status | Update applicant status | recruiter (own company) |

### Payments
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | /api/v1/payments/checkout | Create Stripe Checkout session | employer |
| POST | /api/v1/payments/webhook | Stripe webhook receiver | Stripe (signature verified) |
| GET | /api/v1/payments/subscription | Get company subscription status | employer |

### Taxonomy (Skill Tags)
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | /api/v1/tags | List active tags (filterable by ?category=) | public |

### Salary Benchmarks
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | /api/v1/benchmarks | List published benchmarks | public |
| GET | /api/v1/benchmarks/:slug | Get benchmark detail | public |

### Admin
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | /api/v1/admin/companies | List companies (filterable by verified status) | admin |
| PATCH | /api/v1/admin/companies/:id | Verify or reject company | admin |
| GET | /api/v1/admin/jobs | List all job postings | admin |
| PATCH | /api/v1/admin/jobs/:id | Moderate job posting | admin |
| GET | /api/v1/admin/tags | List all skill tags | admin |
| POST | /api/v1/admin/tags | Create skill tag | admin |
| PATCH | /api/v1/admin/tags/:id | Edit skill tag | admin |
| GET | /api/v1/admin/benchmarks | List all benchmarks (incl. drafts) | admin |
| POST | /api/v1/admin/benchmarks | Create benchmark | admin |
| PATCH | /api/v1/admin/benchmarks/:id | Edit/publish benchmark | admin |

---

## 6. Security Architecture

### Authentication
- **Provider**: Supabase Auth — email/password with email verification required before login
- **Session**: `@supabase/ssr` creates HttpOnly, Secure, SameSite=Lax cookies via Next.js middleware
- **Token lifecycle**: Supabase handles access token (1h) + refresh token (rotation)
- **No custom JWT**: Supabase JWTs are verified automatically in API routes via `createServerClient`

### Authorization (Simple RBAC — 3 roles)

| Role | Capabilities |
|---|---|
| `candidate` | Own profile CRUD, CV upload, job search, apply, view own applications |
| `employer` | Company management, job posting CRUD (own company), applicant dashboard, candidate search (plan-gated), billing |
| `admin` | All of the above + company verification, job moderation, taxonomy management |

**Enforcement layers:**
1. **Next.js middleware** (`middleware.ts`): Redirect unauthenticated requests; check role for route group access (`/admin/*` requires `admin`, etc.)
2. **API route guards**: Every API handler reads session + role from Supabase server client and returns 401/403 before any DB query
3. **Supabase RLS**: Database-level enforcement — even if app code has a bug, unauthorized reads return empty

### Key RLS Policies

```sql
-- profiles: users can only read/update their own
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile" ON profiles
  USING (id = auth.uid());

-- candidates: own profile; employer can read if application exists
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "candidate reads own" ON candidates
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "employer reads applied candidate" ON candidates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM applications a
      JOIN job_postings jp ON a.job_posting_id = jp.id
      JOIN recruiters r ON jp.company_id = r.company_id
      WHERE a.candidate_id = candidates.id
        AND r.user_id = auth.uid()
    )
  );
CREATE POLICY "candidate updates own" ON candidates
  FOR UPDATE USING (user_id = auth.uid());

-- job_postings: public read if active; recruiter manages own company's
ALTER TABLE job_postings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public active jobs" ON job_postings
  FOR SELECT USING (status = 'active');
CREATE POLICY "recruiter manages own" ON job_postings
  FOR ALL USING (
    company_id IN (
      SELECT company_id FROM recruiters WHERE user_id = auth.uid()
    )
  );

-- applications: candidate sees own; recruiter sees applications to their jobs
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "candidate sees own" ON applications
  FOR SELECT USING (
    candidate_id IN (SELECT id FROM candidates WHERE user_id = auth.uid())
  );
CREATE POLICY "recruiter sees own company" ON applications
  FOR SELECT USING (
    job_posting_id IN (
      SELECT id FROM job_postings WHERE company_id IN (
        SELECT company_id FROM recruiters WHERE user_id = auth.uid()
      )
    )
  );
CREATE POLICY "recruiter updates status" ON applications
  FOR UPDATE USING (
    job_posting_id IN (
      SELECT id FROM job_postings WHERE company_id IN (
        SELECT company_id FROM recruiters WHERE user_id = auth.uid()
      )
    )
  );

-- companies: recruiters see own; public sees verified only
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public sees verified" ON companies
  FOR SELECT USING (verified_at IS NOT NULL);
CREATE POLICY "recruiters manage own" ON companies
  FOR ALL USING (
    id IN (SELECT company_id FROM recruiters WHERE user_id = auth.uid())
  );
```

### CV File Access (Supabase Storage RLS)
- Bucket `cvs`: private (no public access)
- Signed URL generated server-side only via `/api/v1/candidates/:id/cv-url`
- Server checks: requesting user is a recruiter AND has at least one application from this candidate to their company's jobs
- URL expiry: 60 minutes
- CV path format: `cvs/{candidate_id}/{timestamp}.pdf` — no sequential or guessable IDs

### Morocco Loi 09-08 Compliance
- **Privacy policy**: Published in French at `/politique-de-confidentialite` before launch
- **Data minimization**: Phone number optional; no government ID collected
- **Consent**: Cookie consent banner (PostHog only fires after accept)
- **Right to deletion**: Candidate can request deletion via email → admin manually cascades deletion (v1 manual; v2 self-serve)
- **Data retention**: Applications retained 2 years; CVs deleted on candidate account deletion
- **Third-party sharing**: CV data shared only with recruiters via explicit application action; PostHog configured with IP anonymization
- **Sub-processors disclosed in privacy policy**: Supabase (DB/storage, EU region), Vercel (hosting, EU Edge), Resend (email, EU region), Stripe (payments), PostHog (analytics)

### OWASP Mitigations (MVP)
| Threat | Mitigation |
|---|---|
| SQL Injection | Supabase client uses parameterized queries; no raw SQL in app code |
| XSS | Next.js escapes by default; no `dangerouslySetInnerHTML`; CSP header on all routes |
| CSRF | Next.js Server Actions have built-in CSRF protection; Stripe webhook uses signature verification |
| IDOR | Supabase RLS enforces at DB level; API routes double-check ownership |
| Secrets exposure | All secrets in Vercel env vars; `SUPABASE_SERVICE_ROLE_KEY` server-only; never in client bundle |
| File upload abuse | CV uploads: server validates MIME type (application/pdf only), size limit 10 MB enforced before Supabase write |
| Broken Auth | Supabase handles; HttpOnly cookies; email verification required |
| Enumeration | Candidate IDs are UUIDs; no sequential IDs in any public URL |

### Security Headers (via `next.config.js`)
```
Content-Security-Policy: default-src 'self'; script-src 'self' 'nonce-{nonce}' app.posthog.com; ...
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

---

## 7. Project Structure

```
autojobs/
├── app/
│   ├── (public)/
│   │   ├── page.tsx                        # Landing page (static)
│   │   ├── jobs/
│   │   │   ├── page.tsx                    # Job listing (SSR)
│   │   │   └── [id]/page.tsx               # Job detail (SSR)
│   │   ├── salaire/
│   │   │   ├── page.tsx                    # Benchmark index (ISR)
│   │   │   └── [slug]/page.tsx             # Benchmark detail (ISR)
│   │   └── politique-de-confidentialite/
│   │       └── page.tsx
│   ├── (auth)/
│   │   ├── connexion/page.tsx
│   │   └── inscription/
│   │       ├── candidat/page.tsx
│   │       └── employeur/page.tsx
│   ├── (employer)/
│   │   ├── layout.tsx                      # Auth guard: employer role
│   │   ├── tableau-de-bord/page.tsx
│   │   ├── offres/
│   │   │   ├── page.tsx
│   │   │   ├── nouvelle/page.tsx
│   │   │   └── [id]/
│   │   │       ├── modifier/page.tsx
│   │   │       └── candidats/page.tsx
│   │   ├── talents/page.tsx                # Candidate search (plan-gated)
│   │   └── facturation/page.tsx
│   ├── (candidate)/
│   │   ├── layout.tsx                      # Auth guard: candidate role
│   │   ├── profil/page.tsx
│   │   └── candidatures/page.tsx
│   ├── (admin)/
│   │   ├── layout.tsx                      # Auth guard: admin role
│   │   ├── entreprises/page.tsx
│   │   ├── offres/page.tsx
│   │   └── taxonomie/page.tsx
│   └── api/v1/
│       ├── auth/complete-profile/route.ts
│       ├── companies/[...]/route.ts
│       ├── jobs/[...]/route.ts
│       ├── candidates/[...]/route.ts
│       ├── applications/[...]/route.ts
│       ├── payments/[checkout|webhook|subscription]/route.ts
│       ├── tags/route.ts
│       ├── benchmarks/[...]/route.ts
│       └── admin/[...]/route.ts
├── components/
│   ├── ui/                                 # shadcn/ui components
│   ├── jobs/                               # JobCard, JobFilters, JobForm
│   ├── candidates/                         # CandidateCard, ProfileForm, CVUpload
│   ├── employer/                           # ApplicantTable, CompanyForm
│   └── shared/                             # Navbar, Footer, CookieBanner
├── lib/
│   ├── supabase/
│   │   ├── client.ts                       # Browser client (anon key)
│   │   └── server.ts                       # Server client (service role, server-only)
│   ├── stripe.ts
│   ├── resend.ts
│   └── utils.ts
├── types/
│   └── database.ts                         # Generated by `supabase gen types`
├── middleware.ts                            # Route auth guards + session refresh
└── next.config.js                          # Security headers + ISR config
```

---

## 8. Infrastructure & Environments

| Concern | Tool | Notes |
|---|---|---|
| Frontend + API | Vercel (free Hobby) | Upgrade to Pro ($20/mo) if needed |
| Database | Supabase Postgres (free) | EU region (Frankfurt) |
| Auth | Supabase Auth | Email/password; magic links available |
| File Storage | Supabase Storage (free, 1 GB) | Private bucket for CVs |
| Email | Resend (free, 3k/month) | Custom domain via Cloudflare DNS |
| Payments | Stripe | Moroccan business account |
| CDN + DNS | Cloudflare (free) | autojobs.ma → Vercel |
| Analytics | PostHog cloud (free, 1M events/mo) | IP anonymized |
| CI/CD | Vercel Git integration | Push to main → deploy; preview deploys on PR |
| Secrets | Vercel Environment Variables | Production + Preview environments |

**Environments:**
- `main` branch → Production (autojobs.ma)
- Feature branches → Preview URLs (autojobs-git-[branch].vercel.app)
- Local: `.env.local` with Supabase dev project

---

## 9. Technical Risks

| Risk | Mitigation | Owner |
|---|---|---|
| Supabase free tier pause (1 week inactivity) | Upgrade to Pro ($25/mo) before public launch | Dev |
| Vercel serverless cold starts on dashboard routes | Use server components where possible; acceptable latency for MVP | Dev |
| Stripe MAD billing confusion | Clear UI: "Vous payez X MAD (≈ Y EUR)" with exchange rate note | Dev |
| RLS policy gaps allowing data leak | Integration tests covering cross-user data access scenarios | Dev / Test Architect |
| CV storage abuse (non-PDF uploads, oversized) | Server-side MIME + size validation before Supabase write | Dev |
| profile_completeness drift | Recompute on every candidate mutation via server-side function | Dev |

---

## Architecture Validation Checklist

- [x] Every PRD requirement (FR-1 through FR-15) has an architectural solution
- [x] ADRs document all significant choices (framework, hosting, auth, payments, storage, email, UI, analytics)
- [x] Data model supports all user stories (companies, recruiters, candidates, jobs, applications, subscriptions, payments)
- [x] API design covers all functional requirements
- [x] Security requirements addressed (RLS, RBAC, CV access control, Loi 09-08, OWASP mitigations)
- [x] NFRs have architectural support (SSR/ISR for NFR-1, Supabase Auth + RLS for NFR-2, Loi 09-08 section for NFR-3)
- [x] No over-engineering (YAGNI check: no microservices, no GraphQL, no Redis cache, no Kubernetes, no custom auth)
- [x] Budget stays within $0/month for MVP (all free tiers); upgrade path documented
