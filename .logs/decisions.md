# Decision Log
<!-- Tracks architecture decisions, approach selections, tool choices -->
<!-- Format: ### [YYYY-MM-DD HH:MM] ARCHITECTURE/APPROACH/TOOL — Title -->


### [2026-04-26 00:05] APPROACH — Project Name
**Decision**: Keep "AutoJobs.ma" as the official project name
**Alternatives considered**: AutoTalent.ma, Makina.ma, WireHire.ma
**Reason**: Clear, bilingual (FR+EN), no explanation needed, strong sector signal
**Consequences**: Positions as job board (not talent platform) — acceptable for MVP branding

### [2026-04-26 00:30] ARCHITECTURE — Full Stack
Next.js App Router monolith | Vercel + Supabase free tiers | Supabase Auth (HttpOnly cookies) | Stripe (EUR settlement, MAD display) | Supabase Storage private bucket for CVs | Resend email | shadcn/ui + Tailwind | PostHog analytics

### [2026-04-26 00:30] ARCHITECTURE — Payment Strategy
Stripe only in v1. Display MAD, charge EUR. Annual contracts via bank transfer + manual PDF invoice. CMI added in v2 if >20% checkout dropoff.

### [2026-04-26 00:30] ARCHITECTURE — CV Access Control
Private Supabase Storage bucket. Signed URLs (60 min) generated server-side only when verified application relationship exists between recruiter's company and candidate.

### [2026-04-26 00:30] ARCHITECTURE — Authorization
Simple RBAC: 3 roles (admin, employer, candidate). Enforced at: Next.js middleware (route groups) + API route guards + Supabase RLS (DB level).
