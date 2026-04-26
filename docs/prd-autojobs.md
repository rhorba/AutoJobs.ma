# PRD: AutoJobs.ma
**Version**: 1.0 | **Date**: 2026-04-26 | **Author**: Project Manager | **Status**: Draft

---

## 1. Problem Statement

Morocco's automotive, battery, and EV manufacturing cluster is adding tens of thousands of jobs across Tangier, Kenitra, Casablanca, and Jorf Lasfar — yet HR teams at OEMs, tier-1/2 suppliers, and battery plants have no vertical talent marketplace that speaks their language. Generic platforms (Rekrute, LinkedIn) lack Morocco-specific skills taxonomy, free zone filters, language-combination filters (Arabic + French + Mandarin), and pre-vetted candidate pools tied to local training institutions like IFMIA. The result: recruiters waste weeks sifting irrelevant profiles; candidates with exactly the right certifications are invisible.

**Who has this problem:**
- B2B: HR/Talent Acquisition managers at OEMs (Stellantis, Renault), battery plants (Gotion High-Tech, BTR), tier-1/2 suppliers (Yazaki, Aptiv, Sumitomo) — primarily in Kenitra, Tangier, Jorf Lasfar
- B2C: Automotive/battery technicians, engineers, operators graduating from IFMIA and similar schools, or already employed and open to offers

---

## 2. Goals & Success Metrics

| Goal | Metric | 90-Day Target |
|---|---|---|
| Revenue validation | Paying employer accounts | 10 |
| Revenue | MRR equivalent (MAD) | 30,000–60,000 MAD |
| Supply-side liquidity | Candidate signups | 1,500+ |
| Institutional credibility | Signed partnerships | 1 (IFMIA or AMICA) |
| SEO foundation | Indexed salary benchmark pages | 5–10 |

---

## 3. User Stories

### Employer (B2B — paying)
- [ ] As an HR manager, I want to create a company account and invite my recruiter colleagues, so that our team can manage hiring from one place.
- [ ] As a recruiter, I want to post a job with structured fields (role family, specific skills, location, language, salary range, contract type), so that I attract exactly the right candidates.
- [ ] As a recruiter, I want to browse and filter candidate profiles by skills, certifications, location, and language combination, so that I can shortlist without reviewing irrelevant profiles.
- [ ] As a recruiter, I want a per-job applicant dashboard where I can mark candidates as reviewed, shortlisted, or rejected, so that I can manage my pipeline.
- [ ] As a finance contact, I want to pay for job postings via credit card or receive an invoice for annual contracts in MAD, so that billing fits our process.

### Candidate (B2C — free)
- [ ] As a candidate, I want to create a structured profile with my experience, skills (from the auto/battery taxonomy), certifications, language level, and location, so that employers can find me with specific filters.
- [ ] As a candidate, I want to upload my CV as a PDF, so that employers can download it.
- [ ] As a candidate, I want to browse job listings filtered by role family, location, contract type, salary range, and free zone, so that I find relevant openings quickly.
- [ ] As a candidate, I want to apply to a job in one click when my profile is complete, so that I don't have to fill out the same information twice.
- [ ] As a candidate, I want to see the status of my applications (submitted, viewed, shortlisted, rejected), so that I know where I stand.

### Admin (internal)
- [ ] As an admin, I want to verify employer accounts before they can post, so that the platform stays professional.
- [ ] As an admin, I want to manage the skills taxonomy (add/edit/remove skill tags), so that the vocabulary stays current with the sector.
- [ ] As an admin, I want to view and moderate job postings, so that I can unpublish spam or inappropriate content.

---

## 4. Scope

### In Scope (MVP v1)
- Employer accounts with multi-recruiter support
- Job posting flow: structured fields (role family, sub-skills from taxonomy, location + free zone, language requirements, salary range, contract type)
- Candidate profile: structured experience, skills from taxonomy, certifications, language levels, location, availability
- CV upload (PDF stored; not parsed — manual entry in v1)
- Auto/battery skills taxonomy (curated vocabulary: ~50–100 skill tags at launch)
- Search + filter for both sides (employer searches candidates; candidate searches jobs)
- One-click apply (requires complete profile)
- Employer applicant dashboard per job (view, mark status: new / reviewed / shortlisted / rejected)
- Transactional email: welcome, application received (candidate), new applicant notification (employer), payment confirmation
- Stripe checkout for pay-per-post and subscription tiers
- Invoice/bank transfer flow for annual contracts (PDF invoice sent manually in v1)
- Basic admin panel (user management, job moderation, taxonomy management)
- Salary benchmark pages: 5–10 roles (static SEO content, updated manually)
- MAD pricing display (Stripe charges in EUR with MAD equivalent shown)
- French + English UI

### Out of Scope (v1 — revisit only when needed)
- Native mobile apps (iOS / Android)
- AI/ML matching or recommendations
- In-app messaging or chat
- Video interviews
- CV/résumé parsing
- Arabic UI (v2)
- CMI payment gateway (v2 — too complex, insufficient budget)
- Email job alerts
- Company profile pages with reviews (Glassdoor-style)
- Advanced analytics dashboard for employers
- Assessment or skills testing tools
- Referral or affiliate program
- API for third-party ATS integration
- Multi-country expansion (Morocco-only in v1)

---

## 5. Requirements

### Functional Requirements

| ID | Requirement |
|---|---|
| FR-1 | Employer can register, create a company profile, and invite colleagues by email |
| FR-2 | Recruiter can post a job using a structured form: role family (dropdown), sub-skills (multi-select from taxonomy), city + free zone (dropdown), language requirements (multi-select), salary range, contract type (CDI/CDD/Intérim/Stage), application deadline |
| FR-3 | Recruiter can view, edit, close, and repost their job listings |
| FR-4 | Recruiter can search the candidate pool with filters: skill tags, location, language combo, availability, certification |
| FR-5 | Recruiter has an applicant dashboard per job: list of applicants, their profile summary, CV download link, status selector (New / Reviewed / Shortlisted / Rejected) |
| FR-6 | Candidate can register, create a structured profile (experience entries, skill tags, certifications, language levels, location, availability flag) |
| FR-7 | Candidate can upload a PDF CV (≤ 10 MB); stored in Supabase Storage; downloadable only by recruiters who received an application from that candidate |
| FR-8 | Candidate can browse job listings with filters: role family, location/free zone, company, contract type, salary range |
| FR-9 | Candidate can apply to a job in one click if profile completeness ≥ 80% |
| FR-10 | Candidate can view their application history with status per job |
| FR-11 | Stripe checkout for pay-per-post (1,500 MAD ≈ 150 EUR) and annual subscriptions (Starter / Growth) |
| FR-12 | System sends transactional emails via Resend: welcome (both sides), application submitted (candidate), new applicant (employer), payment confirmation |
| FR-13 | Admin can approve/reject employer accounts, unpublish job postings, manage skill taxonomy |
| FR-14 | Salary benchmark pages: one page per role with median salary range, typical certifications, hiring companies — published as static content |
| FR-15 | All prices displayed in MAD; Stripe checkout shows EUR equivalent at time of purchase |

### Non-Functional Requirements

| ID | Requirement |
|---|---|
| NFR-1 | Performance: public pages (job listings, salary benchmarks) render server-side or statically; < 3s LCP on mobile |
| NFR-2 | Security: Supabase Auth (email + password, v1); row-level security on all candidate and employer data; CV files accessible only to authorized recruiters |
| NFR-3 | Privacy: compliant with Morocco Loi 09-08 (data protection equivalent to GDPR-lite); privacy policy published at launch; no CV data shared without explicit candidate application action |
| NFR-4 | Availability: Vercel free tier is acceptable for beta; upgrade path documented if >100 GB/month bandwidth |
| NFR-5 | Maintainability: solo developer — no framework or tooling that requires a team to operate |
| NFR-6 | Accessibility: WCAG 2.1 AA for core flows (job listing, apply, post job); not a blocker for beta |

---

## 6. Constraints & Assumptions

### Constraints
- Solo developer, 40 hours/week maximum
- Total budget ≤ $500 for first 6 months (hosting, email, payments, tools, basic legal)
- Vercel free tier: 100 GB bandwidth, 100 serverless function invocations/day (sufficient for <10,000 MAU)
- Supabase free tier: 500 MB database, 1 GB file storage, 50 MB per upload cap
- Stripe: available in Morocco (as of 2023); MAD not a supported settlement currency — charges in EUR, display in MAD
- Bank transfer / invoice billing for annual contracts must be handled manually in v1 (no automated invoicing tool)
- No CMI or local payment gateway in v1 — international card only via Stripe

### Assumptions
- French + English covers ≥ 90% of v1 target users (HR managers at multinational plants + IFMIA-trained candidates)
- Supabase free tier holds for the first 500–1,000 users before upgrade is needed (~$25/month for Pro)
- IFMIA partnership is achievable as a brand partnership (no cash required — mutual benefit)
- The founder will manually source ~200 candidate profiles to seed supply before launch (go-to-market assumption — not a product feature)
- Annual contracts with bank transfer are legally valid and expected in Moroccan B2B (this is standard practice)
- Pay-per-post at 1,500 MAD is accessible for SME suppliers; annual plans target larger OEM/tier-1 procurement

---

## 7. Risks

| # | Risk | Prob | Impact | Score | Mitigation |
|---|---|---|---|---|---|
| R-1 | **Empty marketplace** — candidates won't sign up without jobs; employers won't pay without candidates | H | H | 9 | Founder manually seeds 200 candidate profiles before launch; invite-only beta with 5–10 committed employers |
| R-2 | **Rekrute or LinkedIn launches automotive vertical** | M | H | 6 | Speed to market (6-week build); IFMIA partnership as a defensible moat; niche taxonomy as switching cost |
| R-3 | **OEM builds in-house ATS / talent pool** | L | M | 2 | Focus on multi-employer network effect and SME tier-1/2 where internal ATS is uneconomical |
| R-4 | **Morocco auto sector hiring slowdown** | L | H | 3 | Gotion pipeline locked in for 10 years; diversify into aerospace/pharma manufacturing in v2 if needed |
| R-5 | **Stripe friction for MAD billing** | H | M | 6 | Display MAD, charge EUR; offer bank transfer for annual; add CMI in v2 if demand justifies cost |
| R-6 | **Supabase free tier limits hit early** | M | M | 4 | Upgrade to Pro ($25/mo) — within 6-month budget; design schema to minimize storage from day 1 |
| R-7 | **Solo dev bandwidth** | H | H | 9 | Strict YAGNI; 6-week scoped build; feature freeze after sprint 3; no scope creep without explicit approval |
| R-8 | **Employer verification fraud** | M | M | 4 | Manual admin approval step before employer can post; LinkedIn/website check; free tier can't post |

---

## 8. Pricing Model

| Tier | Price (MAD) | EUR Equiv. | Details |
|---|---|---|---|
| Pay-per-post | 1,500 MAD | ~150 EUR | Single job posting, 30-day live |
| Starter Annual | 24,000 MAD/yr | ~2,400 EUR/yr | Up to 20 postings/year; basic analytics |
| Growth Annual | 60,000 MAD/yr | ~6,000 EUR/yr | Unlimited postings + featured slots + candidate search access |
| Enterprise | Custom (90,000+ MAD/yr) | — | Dedicated account, IFMIA verified pool, custom branding |

**Billing:** Stripe for card payments (EUR); PDF invoice + bank transfer for annual contracts (manual in v1).

---

## 9. Go-to-Market Strategy (acknowledged in product scope)

The empty marketplace risk is managed as a **founder-led supply seeding** strategy, not a product feature:

1. Founder personally recruits ~200 candidate profiles pre-launch (LinkedIn outreach, IFMIA alumni, automotive LinkedIn groups)
2. Invite-only employer beta with 5–10 companies (personal network + Kenitra/Tangier industrial clusters)
3. IFMIA partnership for co-branded "IFMIA Verified" candidate badge on profiles
4. Salary benchmark pages as SEO content to drive organic candidate acquisition
5. Sales outreach to HR managers at Gotion, Yazaki, Aptiv — timing aligned with Gotion Q3 2026 production ramp

This is acknowledged here so the architecture and stories do **not** over-engineer matching algorithms for a problem that will be solved manually in v1.

---

## 10. Timeline

| Milestone | Target Date |
|---|---|
| PRD Approved | 2026-04-27 |
| Architecture Approved | 2026-04-28 |
| Stories Approved | 2026-04-29 |
| Sprint 1 Complete (scaffold + auth + employer onboarding) | 2026-05-17 |
| Sprint 2 Complete (job posting + candidate profile + search) | 2026-05-31 |
| Sprint 3 Complete (applications + email + Stripe + admin) | 2026-06-14 |
| Sprint 4 Complete (salary benchmarks + SEO + polish) | 2026-06-28 |
| Closed Beta Launch (invite-only) | 2026-07-06 |
| Public Launch | 2026-07-20 |
| 90-Day Success Review | 2026-10-20 |

---

## PRD Validation Checklist

- [x] Problem clearly stated (sector gap, not a solution disguised as a problem)
- [x] Success metrics are measurable (10 employers, 1,500 candidates, 30–60k MAD MRR, 1 partnership)
- [x] Scope has explicit "out of scope" items (AI, mobile, Arabic, CMI, chat, ATS API)
- [x] User stories follow As a / I want / So that format
- [x] Requirements are testable (acceptance criteria can be written from each FR)
- [x] Risks identified with mitigations (8 risks, probability + impact scored)
- [x] YAGNI applied: no speculative features, no over-engineering
- [x] Moroccan context embedded (MAD pricing, Loi 09-08, bank transfer, free zones, FR+EN)
- [x] Empty marketplace risk explicitly acknowledged as a GTM problem, not a product problem
