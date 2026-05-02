# Session Log
<!-- Tracks session starts and ends for resumption -->
<!-- Format: ### [YYYY-MM-DD HH:MM] SESSION_START/SESSION_END -->

### [2026-04-30] PHASE5_TESTS_COMPLETE
**Completed**: 32 tests, 4 files, all passing
- vitest@4.1.5 + @vitest/coverage-v8 installed; vitest.config.ts with @/ alias
- tests/unit/completeness.test.ts — 13 tests, all calcCompleteness branches + 80% gate
- tests/routes/applications-post.test.ts — 6 tests: 401/403/422/completeness/expired/duplicate/201
- tests/routes/applications-patch.test.ts — 5 tests: 401/403/422/IDOR/happy path
- tests/routes/webhook.test.ts — 5 tests: missing sig/bad sig/ignored event/happy path/replay idempotency
- Mocking: vi.hoisted() + vi.mock() on @/lib/supabase/server, @/lib/stripe, @/lib/resend (no test DB)
**Next**: Phase 4 Security Review

### [2026-04-30] SESSION_END
**Completed this session:**
- Phase 5 Tests: 32 tests, 4 files, all passing (vitest, mocked, no test DB)
- Phase 4 Security Review: full audit — no code vulnerabilities found
  - 2 deploy-time blockers: private bucket + STRIPE_WEBHOOK_SECRET in Vercel
  - 2 pre-launch hardening items: rate limiting, explicit CORS
- CTS gap status: Tests ✅ Security ✅ — only Deploy remains

**Next session — user will do manually first:**
1. Create GitHub repo + `git push master`
2. Fill all env vars in `.env.local` (Supabase, Stripe, Resend, PostHog)

**Then continue with:**
- Phase 6 Deploy: Supabase link+push, Vercel import, Cloudflare DNS, Stripe webhook, Resend domain
- Security fixes: verify `candidate-cvs` bucket is private, confirm STRIPE_WEBHOOK_SECRET set
- CTS gap closure: rate limiting on apply+CV-upload routes (Upstash), post-launch monitoring setup

**CTS framework gap — remaining work:**
The only remaining CTS gap is Phase 6 (Deploy). Tests+Security are done.
Post-deploy remaining: rate limiting, CSP nonce (post-launch), PostHog dashboard setup.

### [2026-04-30] SESSION_START
**Project**: AutoJobs.ma — all sprints complete, closing CTS gaps
**Status**: Code complete. Gaps: no tests, no security review, no deployment.
**Goal**: Discussed CTS framework proper roadmap vs. what was built; agreed to close gaps in order: tests → security → deploy.

### [2026-04-30] SESSION_END
**Completed this session:**
- Reviewed CTS framework — explained proper roadmap (Phase 0 inception → Phase 1 design → Phase 2 foundation → Phase 3 feature sprints → Phase 4 security → Phase 5 tests → Phase 6 deploy)
- Identified 3 gaps vs. what was built: no tests, no security gate, no deployment pipeline
- Agreed to close gaps in order: tests → security → deploy
- Planned Phase 5 test suite (NOT yet implemented):
  - Install: vitest + @vitest/coverage-v8 + @types/node
  - 4 test files, 5 critical test scenarios (mocked Supabase/Stripe, no test DB needed)
  - tests/unit/completeness.test.ts — calcCompleteness all branches + 80% gate
  - tests/routes/applications-post.test.ts — unauth, wrong role, completeness < 80%, expired job, duplicate, happy path
  - tests/routes/applications-patch.test.ts — IDOR: employer A can't patch employer B's application
  - tests/routes/webhook.test.ts — bad signature, happy path activates job, replay idempotency

**Resumption point:**
Next session: implement the 4 test files above. User approved the plan — go straight to implementation.
Start with: `npm install -D vitest @vitest/coverage-v8` then write tests in order listed above.

---

### [2026-04-26 00:00] SESSION_START
**Project**: AutoJobs.ma — Moroccan automotive/battery vertical job board
**Phase**: Document-First Build (PRD → Architecture → Stories → Execute)
**Status**: New project, no code yet
**Workflow**: Phase 0 (init) → Phase 1 (naming) → Phase 2 (PRD) [gate] → Phase 3 (Architecture) [gate] → Phase 4 (Stories) [gate] → Phase 5 (Execute)
**Context**: Solo dev, 40h/wk, <$500/6mo budget, Vercel + Supabase + Resend + Stripe stack

### [2026-04-26 01:05] SESSION_END
**Completed this session:**
- Phase 0: .logs/ initialized, docs/ created
- Phase 1: Name confirmed → AutoJobs.ma (decision logged)
- Phase 2: PRD written + approved → docs/prd-autojobs.md
- Phase 3: Architecture written + approved → docs/architecture-autojobs.md (8 ADRs, 14 tables, 32 endpoints, RLS, security)
- Phase 4: Stories written, AWAITING USER APPROVAL → docs/stories-autojobs.md

**Resumption point:**
User needs to approve docs/stories-autojobs.md then say "Approved, begin Sprint 1"
Next action: Load Backend Dev + Frontend Dev skills → Sprint 1 Batch 1.A scaffold

**Key decisions already locked:**
- Stack: Next.js App Router + Supabase + Stripe (EUR/MAD) + Resend + shadcn/ui + PostHog
- Auth: Supabase Auth (HttpOnly cookies, no custom JWT)
- Payments: Stripe only v1; bank transfer for annual contracts
- CV storage: Supabase Storage private bucket, server-side signed URLs
- 3 roles: admin / employer / candidate — enforced at middleware + API + RLS

**Files to read on resume (in order):**
1. .logs/sessions.md (last SESSION_END — this entry)
2. docs/stories-autojobs.md (the pending approval doc)

### [2026-04-26 00:00] SESSION_START (Resume)
**Resuming from**: Session END 2026-04-26 01:05
**Status**: Stories approved → Begin Sprint 1
**Next**: Batch 1.A scaffold → Batch 1.B database migrations

### [2026-04-26 00:00] BATCH_1A_PROGRESS
**Completed**:
- Next.js 16 App Router + TypeScript + Tailwind v4 + ESLint initialized
- shadcn/ui 4.x initialized (base-ui, clsx, lucide-react, tailwind-merge)
- Supabase CLI initialized; lib/supabase/{client,server,middleware}.ts created
- types/database.ts placeholder created
- .env.local.example with all required env vars
- Directory structure: app/, components/ui/, lib/supabase/, types/, tests/, supabase/migrations/
- Git repo initialized, 2 commits
**Pending (manual user steps)**:
- Create GitHub repo + push
- Connect to Vercel + add env vars
- Cloudflare DNS: CNAME autojobs.ma → cname.vercel-dns.com

### [2026-04-26 00:00] SESSION_START (Resume)
**Resuming from**: last SESSION_END — Batch 2.D complete, Batch 2.E next
**Status**: Starting Batch 2.E — Stripe checkout + webhook

### [2026-04-26 00:00] BATCH_2E_COMPLETE
**Completed**:
- lib/stripe.ts: Stripe singleton (API 2026-04-22.dahlia), PRICE_EUR_CENTS=4500, PRICE_MAD=490
- POST /api/v1/payments/checkout: creates Checkout session, sets job → pending_payment; falls back to price_data if STRIPE_PRICE_ID_PAY_PER_POST not set
- POST /api/v1/payments/webhook: handles checkout.session.completed, idempotent via stripe_payment_intent_id, creates payment record, activates job (status→active, expires_at→+30d)
- /offres/[id]/paiement: server page + PayButton client component; shows cancel notice on ?cancelled=1
- /offres/succes: post-payment confirmation page
- TypeScript: 0 errors. Committed: 2355cd4

**Next action**: Sprint 2 complete → Sprint 3 (Applications + Admin + Email)
- Batch 3.A: Candidate apply flow — POST /api/v1/applications, /candidatures/postuler?job_id=[id]
- Batch 3.B: Employer application list — GET /api/v1/jobs/[id]/applications, employer inbox UI
- Batch 3.C: Email notifications via Resend (new application → employer, confirmation → candidate)

### [2026-04-26 00:00] SESSION_START (Resume)
**Resuming from**: Batch 2.E complete (Stripe), starting Sprint 3
**Status**: Sprint 3 — Applications + Email

### [2026-04-26 00:00] BATCH_3A_COMPLETE
**Completed**:
- POST /api/v1/applications: completeness ≥80 check, active job, idempotent duplicate check, status=submitted
- /candidatures/postuler?job_id=[id]: job preview, blocks incomplete profile, shows already-applied notice
- /candidatures: minimal list with status badges (submitted/viewed/shortlisted/rejected)
- Commit: edcbcea

### [2026-04-26 00:00] BATCH_3B_COMPLETE
**Completed**:
- GET /api/v1/jobs/[id]/applications: employer fetches applications for owned job
- PATCH /api/v1/applications/[id]: employer sets status (viewed/shortlisted/rejected)
- /offres/[id]/candidatures: lists applicants, signed CV URLs (5min), candidate details, status actions
- /offres: "Candidatures" link added for active jobs
- Commit: 69775c7

### [2026-04-26 00:00] BATCH_3C_COMPLETE
**Completed**:
- lib/resend.ts: Resend client singleton
- emails/new-application.ts: employer notification
- emails/application-confirmed.ts: candidate confirmation
- POST /api/v1/applications: sends both emails after insert (non-fatal)
- Commit: 6073c25

**Sprint 3 COMPLETE.**
**Next action**: Sprint 4 — SEO + Landing + Polish
- Batch 4.A: Landing page (/) — hero, value props, pricing section, CTA buttons
- Batch 4.B: SEO — sitemap.xml, robots.txt, metadata for public pages

### [2026-04-26 00:00] SESSION_START (Resume)
**Resuming from**: Sprint 3 complete — starting Sprint 4
**Status**: Sprint 4 — SEO + Landing + Polish

### [2026-04-26 00:00] SPRINT4_COMPLETE
**Completed**:
- Batch 4.A: Landing page — sticky nav, hero (live job count), companies strip, value props, recent jobs, pricing, footer
- Batch 4.B: sitemap.ts (dynamic, includes all active job pages), robots.ts, OG metadata on /jobs + home
- (public) layout: sticky nav, "Publier une offre" CTA button, consistent with landing
- Commit: 3c8d511

**All sprints complete. Build is feature-complete for beta.**
**Next: manual deployment tasks**
- GitHub: create repo + push master
- Supabase: link project, supabase db push (migrations), create storage bucket "candidate-cvs"
- Vercel: import repo, set env vars, deploy
- Cloudflare: CNAME autojobs.ma → cname.vercel-dns.com
- Stripe: create product + price, set STRIPE_PRICE_ID_PAY_PER_POST, add webhook endpoint
- Resend: verify autojobs.ma domain, set RESEND_FROM_EMAIL
- PostHog: set NEXT_PUBLIC_POSTHOG_KEY

### [2026-04-26 00:00] SESSION_END
**Completed this session:**
- Batch 2.E: Stripe checkout + webhook (job activation flow)
- Batch 3.A: Candidate apply flow + applications list
- Batch 3.B: Employer application inbox + PATCH status API
- Batch 3.C: Resend email notifications (employer + candidate)
- Sprint 4: Landing page, sitemap.ts, robots.ts, Open Graph metadata
- UX/UI + Test Strategy gap analysis completed

**Deferred to next session:**
1. TESTS (critical before beta): Stripe webhook idempotency, RBAC integration tests, calcCompleteness unit test, IDOR on PATCH /api/v1/applications/[id]

2. MANUAL DEPLOYMENT (requires user action):
   - GitHub: create repo + git push master
   - Supabase: supabase link --project-ref <ref>, supabase db push, create "candidate-cvs" private bucket
   - Vercel: import repo, set all env vars from .env.local.example, deploy
   - Cloudflare: CNAME autojobs.ma → cname.vercel-dns.com
   - Stripe: create product + price (4500 EUR cents), add webhook /api/v1/payments/webhook, copy STRIPE_WEBHOOK_SECRET
   - Resend: verify autojobs.ma domain, set RESEND_API_KEY + RESEND_FROM_EMAIL=noreply@autojobs.ma
   - PostHog: set NEXT_PUBLIC_POSTHOG_KEY + NEXT_PUBLIC_POSTHOG_HOST

**Resumption point:** Start next session by running deployment checklist step by step, then write critical tests.
**Beta: Jul 6 | Launch: Jul 20**
