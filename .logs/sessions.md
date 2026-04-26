# Session Log
<!-- Tracks session starts and ends for resumption -->
<!-- Format: ### [YYYY-MM-DD HH:MM] SESSION_START/SESSION_END -->


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
