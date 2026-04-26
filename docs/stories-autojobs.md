# Stories: AutoJobs.ma
**PRD**: docs/prd-autojobs.md
**Architecture**: docs/architecture-autojobs.md
**Version**: 1.0 | **Date**: 2026-04-26 | **Author**: Scrum Master + Test Architect

---

## Risk-Based Test Priority (Test Architect)

Before stories: risk scores to guide testing depth.

| Component | Failure Impact | Change Freq | Complexity | Risk | Test Level |
|---|---|---|---|---|---|
| Stripe payment + webhook | 5 | 2 | 5 | **12** | Maximum |
| Auth + RBAC + RLS | 5 | 2 | 4 | **11** | Maximum |
| Application flow + IDOR | 5 | 3 | 3 | **11** | Maximum |
| CV upload + access control | 5 | 2 | 3 | **10** | Maximum |
| Job posting flow | 3 | 4 | 3 | **10** | High |
| Candidate profile + completeness | 3 | 4 | 2 | **9** | High |
| Employer verification (admin) | 3 | 2 | 2 | **7** | Standard |
| Search + filters | 2 | 3 | 2 | **7** | Standard |
| Email notifications | 2 | 2 | 1 | **5** | Standard |
| Salary benchmarks (static) | 1 | 2 | 1 | **4** | Minimal |
| Admin taxonomy management | 1 | 2 | 1 | **4** | Minimal |

**Test framework**: Vitest (unit + integration) + Playwright (E2E on critical paths). Tests live in `/tests/` per architecture structure. MSW for mocking external APIs (Stripe, Resend) in integration tests.

---

## Epic 1: Project Scaffold & Infrastructure

*Delivers: A running Next.js app with Supabase connected, deployable to Vercel, with all security headers and the complete DB schema in place.*

### Story 1.1 — Initialize Next.js project
**Priority**: Must | **Size**: S | **Specialist**: Full-stack Dev

As a developer, I want a Next.js 14 App Router project initialized with TypeScript, Tailwind CSS, shadcn/ui, ESLint, and Prettier, so that every subsequent story builds on a consistent foundation.

**Acceptance Criteria**:
```
Given the repo is cloned
When `npm run dev` is executed
Then the app runs on localhost:3000 with no errors

Given a shadcn/ui component is imported
When rendered
Then it displays correctly with Tailwind styles applied
```

**Technical Notes**: `npx create-next-app@latest` with TypeScript + Tailwind + App Router. Add shadcn/ui via CLI. Configure path aliases (`@/`). Add `.env.local.example` with all required env var keys.

---

### Story 1.2 — Supabase project setup + DB migrations
**Priority**: Must | **Size**: M | **Specialist**: Full-stack Dev + DBA

As a developer, I want all 14 database tables created with indexes and RLS policies enabled, so that all subsequent stories can be built against a real schema.

**Acceptance Criteria**:
```
Given the Supabase project is linked
When migrations are run via `supabase db push`
Then all 14 tables exist with correct columns, constraints, and indexes

Given RLS is enabled on all tables
When a request is made without a valid session
Then no data is returned (empty result, not an error)
```

**Technical Notes**: Use Supabase CLI for local development. Migration files in `supabase/migrations/`. Run `supabase gen types typescript` after migrations to generate `types/database.ts`. Initial seed for admin profile (via SQL, not a public API).

**Dependencies**: None (first story)

---

### Story 1.3 — Vercel deployment + Cloudflare DNS
**Priority**: Must | **Size**: S | **Specialist**: DevOps

As a developer, I want the app deployed to Vercel with `autojobs.ma` pointing to it via Cloudflare, so that preview URLs and the production domain work before any features are built.

**Acceptance Criteria**:
```
Given a push to `main`
When Vercel build completes
Then the app is live at autojobs.ma with HTTPS

Given a push to a feature branch
When Vercel build completes
Then a preview URL is available (autojobs-git-[branch].vercel.app)
```

**Technical Notes**: Connect GitHub repo to Vercel. Set all env vars in Vercel dashboard (Production + Preview). Add Cloudflare A/CNAME record pointing to Vercel. Enable "Always Use HTTPS" in Cloudflare.

---

### Story 1.4 — Security headers + cookie consent
**Priority**: Must | **Size**: S | **Specialist**: Full-stack Dev

As a developer, I want security headers (CSP, HSTS, X-Frame-Options, etc.) set in `next.config.js` and a cookie consent banner wiring PostHog, so that the app is compliant with Loi 09-08 from day one.

**Acceptance Criteria**:
```
Given any page is loaded
When the response headers are inspected
Then X-Frame-Options: DENY, X-Content-Type-Options: nosniff, and HSTS are present

Given a user visits for the first time
When the page loads
Then a cookie consent banner appears and PostHog does NOT fire until accept is clicked
```

**Technical Notes**: Security headers in `next.config.js` headers() config. PostHog initialized client-side only after consent stored in localStorage. CSP nonce for inline scripts via Next.js middleware.

---

### Story 1.5 — Initial skill taxonomy seed
**Priority**: Must | **Size**: M | **Specialist**: Full-stack Dev

As an admin, I want ~60 skill tags seeded (role families, technical skills, certifications, languages) so that job posting and candidate profile forms have real options from launch.

**Acceptance Criteria**:
```
Given the DB is seeded
When GET /api/v1/tags?category=role_family is called
Then at least 8 role families are returned

When GET /api/v1/tags is called
Then at least 50 active tags are returned across all categories
```

**Taxonomy seed (v1):**
- Role families (8): Assemblage & Production, Câblage Électrique, Ingénierie Électrique, Qualité & Audit, Maintenance Industrielle, Cellules & Batteries, Logistique & Supply Chain, Management & RH
- Technical skills (~25): cathode coating, BMS calibration, IATF 16949, wire harness assembly, PLC programming, lean manufacturing, FMEA, MSA, SPC, robot programming, EV powertrain, lithium cell formation, electrolyte filling, welding (MIG/TIG), CMM operation, AutoCAD, SAP MM, AMDEC, 5S, kaizen, PPAP, control plan, ...
- Certifications (~10): IATF 16949, ISO 9001, ISO 14001, OHSAS 18001, CACES, habilitation électrique BR/B1V, ASPAM, ...
- Languages (6): Français, Anglais, Arabe, Tamazight, Mandarin, Espagnol

---

## Epic 2: Authentication & Role Routing

*Delivers: Employer and candidate can register, verify email, log in, and land on the correct dashboard. Admin has a separate access path. Next.js middleware enforces all role routes.*

### Story 2.1 — Employer registration
**Priority**: Must | **Size**: M | **Specialist**: Full-stack Dev
**Risk**: Maximum — sets role, creates company record, must be verified before posting

As an HR manager, I want to register with email/password and create my company profile, so that I can start hiring once my account is verified by the admin.

**ATDD Acceptance Scenarios**:
```gherkin
Feature: Employer Registration

  Scenario: Successful registration
    Given I am on /inscription/employeur
    When I submit a valid email, password (min 8 chars), company name, and city
    Then my profile row is created with role='employer'
    And a company row is created with verified_at=NULL
    And a recruiter row is created with is_company_owner=TRUE
    And I receive a welcome email with a verification link
    And I am redirected to a "pending verification" screen

  Scenario: Duplicate email
    Given an account already exists with email "test@company.ma"
    When I submit registration with the same email
    Then I see an error "Un compte existe déjà avec cet email"
    And no new records are created

  Scenario: Weak password
    Given I am on the registration form
    When I submit a password shorter than 8 characters
    Then the form shows a validation error before submission
    And no API call is made

  Scenario: Role cannot be set by client
    Given I craft a POST request with role='admin' in the body
    When the /api/v1/auth/complete-profile endpoint processes it
    Then the created profile.role is 'employer' (hardcoded by endpoint, not from body)
```

**Technical Notes**: `/inscription/employeur` → Supabase signUp() → email verification → on verify, call `/api/v1/auth/complete-profile?type=employer` → create profiles + companies + recruiters rows. Status screen shows "Votre compte est en cours de vérification (24-48h)."

---

### Story 2.2 — Candidate registration
**Priority**: Must | **Size**: M | **Specialist**: Full-stack Dev

As a job seeker, I want to register with email/password and have a candidate profile stub created, so that I can immediately start filling in my profile.

**ATDD Acceptance Scenarios**:
```gherkin
Feature: Candidate Registration

  Scenario: Successful registration
    Given I am on /inscription/candidat
    When I submit valid email, password, first name, last name, and city
    Then my profile row is created with role='candidate'
    And a candidate row is created with profile_completeness=20
    And I receive a welcome email
    And I am redirected to /profil to complete my profile

  Scenario: Role cannot be set by client
    Given I craft a POST with role='employer' in the body
    When /api/v1/auth/complete-profile?type=candidate processes it
    Then the created profile.role is 'candidate'
```

---

### Story 2.3 — Login + role-based redirect
**Priority**: Must | **Size**: S | **Specialist**: Full-stack Dev

As any user, I want to log in with email/password and be redirected to my role-specific dashboard, so that I land in the right place without an extra click.

**ATDD Acceptance Scenarios**:
```gherkin
Feature: Login

  Scenario: Employer login
    Given I have a verified employer account
    When I log in with correct credentials
    Then I am redirected to /tableau-de-bord

  Scenario: Candidate login
    Given I have a candidate account
    When I log in with correct credentials
    Then I am redirected to /profil

  Scenario: Admin login
    Given I have an admin account
    When I log in with correct credentials
    Then I am redirected to /admin/entreprises

  Scenario: Unverified email login
    Given my email is not verified
    When I attempt to log in
    Then I see "Veuillez vérifier votre email avant de vous connecter"
    And I am not logged in

  Scenario: Wrong credentials
    Given I am on the login page
    When I submit incorrect credentials
    Then I see a generic error (no indication of which field is wrong)
```

---

### Story 2.4 — Next.js middleware route guards
**Priority**: Must | **Size**: S | **Specialist**: Full-stack Dev
**Risk**: Maximum — if this fails, all role isolation breaks

As the system, I want route-level auth enforcement so that unauthenticated users and users with wrong roles are always redirected, even if a component-level check is missed.

**ATDD Acceptance Scenarios**:
```gherkin
Feature: Route Guards

  Scenario: Unauthenticated access to employer route
    Given I am not logged in
    When I navigate to /tableau-de-bord
    Then I am redirected to /connexion

  Scenario: Candidate accessing employer route
    Given I am logged in as a candidate
    When I navigate to /tableau-de-bord
    Then I am redirected to /profil

  Scenario: Employer accessing admin route
    Given I am logged in as an employer
    When I navigate to /admin/entreprises
    Then I receive a 403 response

  Scenario: Public route always accessible
    Given I am not logged in
    When I navigate to /jobs
    Then I see the public job listing with no redirect
```

**Technical Notes**: `middleware.ts` reads Supabase session cookie, checks `profiles.role`, routes accordingly. Protected route prefixes: `/tableau-de-bord`, `/offres`, `/talents`, `/facturation` → employer only; `/profil`, `/candidatures` → candidate only; `/admin` → admin only.

---

### Story 2.5 — Recruiter invite flow
**Priority**: Should | **Size**: M | **Specialist**: Full-stack Dev

As a company owner (first recruiter), I want to invite colleagues by email so they can join my company account without creating a separate company.

**Acceptance Criteria**:
```
Given I am the company owner
When I submit a colleague's email in the invite form
Then a recruiter_invites row is created with a UUID token and 7-day expiry
And an invite email is sent with /inscription/invite?token=[uuid]

Given the invitee visits the invite URL
When they complete registration
Then a recruiter row is created linked to the same company_id
And accepted_at is set on the invite
And the token cannot be used again

Given the invite token is expired (>7 days)
When the invitee visits the URL
Then they see "Ce lien d'invitation a expiré. Demandez un nouveau lien."
```

---

## Epic 3: Job Posting

*Delivers: Recruiters can create, manage, and publish jobs. Public job listing with SSR and search/filter.*

### Story 3.1 — Job posting form
**Priority**: Must | **Size**: L | **Specialist**: Full-stack Dev
**Risk**: High — this is the core employer value

As a recruiter, I want to fill out a structured job form and save it as a draft, so that I can review before paying to publish.

**Acceptance Criteria**:
```
Given I am a verified employer
When I submit the job form with all required fields
Then a job_postings row is created with status='draft'
And job_skills rows are created for selected skill tags
And I am redirected to my job list with a "Draft saved" confirmation

Given I am an unverified employer
When I navigate to /offres/nouvelle
Then I see "Votre compte est en attente de vérification" and cannot access the form

Given I leave required fields empty
When I try to submit the form
Then client-side validation prevents submission and highlights missing fields

Given I submit salary_max < salary_min
When the API processes the request
Then I receive a 422 error "Le salaire maximum doit être supérieur au salaire minimum"
```

**Form fields**: title, role_family (dropdown from taxonomy), skills (multi-select, up to 15 tags), city (dropdown: Tanger, Kénitra, Casablanca, Jorf Lasfar, Autre), free_zone (optional dropdown), contract_type (CDI/CDD/Intérim/Stage/Freelance), salary_min, salary_max (optional), language requirements (multi-select), description_fr (required, rich text min 100 chars), description_en (optional).

---

### Story 3.2 — Job payment + activation
**Priority**: Must | **Size**: L | **Specialist**: Full-stack Dev
**Risk**: Maximum — revenue-critical

As a recruiter, I want to pay for my job posting via Stripe and have it go live automatically, so that the process requires no manual admin step for pay-per-post.

**ATDD Acceptance Scenarios**:
```gherkin
Feature: Job Posting Payment

  Scenario: Successful pay-per-post via card
    Given I have a draft job posting
    When I click "Publier — 1 500 MAD" and complete Stripe Checkout
    Then Stripe fires a checkout.session.completed webhook
    And the webhook handler (verified by Stripe signature) sets job status='active'
    And a payment row is created with status='succeeded'
    And expires_at is set to NOW() + 30 days
    And I receive a payment confirmation email
    And the job appears in the public listing within 60 seconds

  Scenario: Payment cancelled / abandoned
    Given I am on the Stripe Checkout page
    When I click "Back" / close the browser
    Then the job remains in status='draft'
    And no payment record is created
    And I can re-initiate checkout later

  Scenario: Webhook received without valid Stripe signature
    Given an attacker sends a POST to /api/v1/payments/webhook
    When the signature header is missing or invalid
    Then the endpoint returns 400 without processing anything

  Scenario: Duplicate webhook (Stripe retry)
    Given a checkout.session.completed webhook was already processed for payment intent pi_abc
    When Stripe retries the same webhook
    Then the handler detects the payment_intent_id already exists in payments table
    And returns 200 without creating a duplicate payment or changing job status again

  Scenario: Subscription holder posts a job
    Given I have an active Growth Annual subscription with posts_remaining=NULL
    When I create a draft job posting
    Then no Stripe checkout is triggered
    And the job status moves directly to 'active' on submit
    And expires_at is set to NOW() + 30 days
```

**Technical Notes**: Stripe Checkout in hosted mode. `STRIPE_WEBHOOK_SECRET` env var. Webhook handler must be excluded from Next.js body parsing (raw body required for signature verification). Job activation happens ONLY in webhook handler, never on success redirect URL.

---

### Story 3.3 — Job management (employer)
**Priority**: Must | **Size**: M | **Specialist**: Full-stack Dev

As a recruiter, I want to view, edit (draft only), close, and track my job postings, so that I can manage my pipeline.

**Acceptance Criteria**:
```
Given I navigate to /offres
Then I see all my company's job postings grouped by status

Given a job is in 'draft' status
When I click Edit
Then I can modify any field and save

Given a job is in 'active' status
When I click Edit
Then I can only edit description and language requirements (not title, role, city — to prevent bait-and-switch)

Given I click "Fermer l'offre" on an active job
Then its status changes to 'closed' and it disappears from the public listing

Given a job's expires_at has passed
When I view my job list
Then it shows as 'Expirée' and I see a "Republier" CTA
```

---

### Story 3.4 — Public job listing page
**Priority**: Must | **Size**: M | **Specialist**: Full-stack Dev

As a candidate, I want to browse active jobs with filters so that I find relevant openings quickly.

**Acceptance Criteria**:
```
Given I navigate to /jobs
Then I see all active job postings (SSR, SEO meta tags populated)
And each card shows: title, company name, city, contract type, salary range, days since posted

Given I apply the filter role_family=Câblage Électrique
Then only jobs with that role family are shown

Given I apply the filter city=Kénitra
Then only jobs in Kénitra are shown

Given no jobs match the filters
Then I see "Aucune offre ne correspond à vos critères"
And a "Effacer les filtres" CTA

Given I click on a job card
Then I navigate to /jobs/[id] (SSR page with full description and apply CTA)
```

---

## Epic 4: Candidate Profile

*Delivers: Candidates can build a complete profile, upload a CV, and reach 80% completeness to unlock the apply button.*

### Story 4.1 — Candidate profile form
**Priority**: Must | **Size**: M | **Specialist**: Full-stack Dev

As a candidate, I want to fill in my profile (personal info, skills, availability) and see my completeness score update in real time, so that I know exactly what to add to unlock applications.

**Acceptance Criteria**:
```
Given I am on /profil
Then I see a completeness bar showing my current score (%)

Given I add my city and years of experience
When the form saves
Then profile_completeness updates on the server
And the bar reflects the new score without a full page reload

Given my profile_completeness is < 80
When I view a job detail page
Then the "Postuler" button is disabled with tooltip "Complétez votre profil à 80% pour postuler"
```

**Completeness weights (per architecture):**
- first_name + last_name: +20
- city: +10
- years_experience: +10
- availability: +10
- ≥1 experience entry: +20
- ≥3 skill tags: +15
- cv_file_path set: +15

---

### Story 4.2 — Work experience entries
**Priority**: Must | **Size**: S | **Specialist**: Full-stack Dev

As a candidate, I want to add, edit, and delete work experience entries so that employers understand my history.

**Acceptance Criteria**:
```
Given I click "Ajouter une expérience"
When I fill in company, title, start date, and submit
Then a candidate_experiences row is created

Given end_date is left blank
Then the position is shown as "Poste actuel"

Given I have 0 experiences and add 1
Then profile_completeness increases by 20
```

---

### Story 4.3 — CV upload
**Priority**: Must | **Size**: M | **Specialist**: Full-stack Dev
**Risk**: Maximum — security-sensitive file handling

As a candidate, I want to upload my CV as a PDF so that employers can download it.

**ATDD Acceptance Scenarios**:
```gherkin
Feature: CV Upload

  Scenario: Successful PDF upload
    Given I am on /profil
    When I select a valid PDF file (2 MB)
    Then the file is uploaded to the private 'cvs' bucket
    And the path is stored as cvs/{candidate_id}/{timestamp}.pdf
    And cv_file_path is updated in my candidates row
    And profile_completeness increases by 15

  Scenario: Non-PDF file rejected
    Given I select a file with .docx extension (or a .pdf with wrong MIME type)
    When the server processes the upload
    Then the server returns 422 "Seuls les fichiers PDF sont acceptés"
    And no file is written to storage

  Scenario: Oversized file rejected
    Given I select a PDF file larger than 10 MB
    When the server processes the upload
    Then the server returns 413 "La taille maximale est 10 Mo"
    And no file is written to storage

  Scenario: Upload replaces previous CV
    Given I already have a CV uploaded at cvs/abc/old.pdf
    When I upload a new CV
    Then the old file is deleted from storage
    And cv_file_path points to the new file path
    And profile_completeness remains 100 (no double-counting)
```

**Technical Notes**: Server-side validation: check Content-Type header = `application/pdf` AND read first 4 bytes (magic bytes `%PDF`). Use `NextRequest.formData()` in API route. Write to Supabase Storage via service role client. Never use user-supplied filename — always generate `{candidate_id}/{Date.now()}.pdf`.

---

## Epic 5: Application Flow

*Delivers: Candidates apply in one click; employers have a per-job applicant dashboard with status management and CV download.*

### Story 5.1 — One-click apply
**Priority**: Must | **Size**: M | **Specialist**: Full-stack Dev
**Risk**: Maximum — IDOR risk, double-apply risk

As a candidate, I want to apply to a job in one click, so that I don't have to re-enter information I've already provided.

**ATDD Acceptance Scenarios**:
```gherkin
Feature: Job Application

  Scenario: Successful application
    Given my profile completeness is >= 80%
    And I have not yet applied to this job
    When I click "Postuler" on /jobs/[id]
    Then an applications row is created with status='submitted'
    And I see a success toast "Candidature envoyée !"
    And the button changes to "Candidature envoyée" (disabled)
    And the candidate receives a confirmation email
    And the recruiter receives a "nouveau candidat" notification email

  Scenario: Duplicate application blocked by server
    Given I have already applied to job X
    When I send POST /api/v1/applications with job_posting_id=X again
    Then the server returns 409 "Vous avez déjà postulé à cette offre"
    And no duplicate row is created (UNIQUE constraint enforced)

  Scenario: Apply with incomplete profile (< 80%)
    Given my profile_completeness is 60
    When I send POST /api/v1/applications
    Then the server returns 403 "Complétez votre profil à 80% avant de postuler"
    And no application row is created

  Scenario: Apply to closed or expired job
    Given a job has status='closed'
    When I send POST /api/v1/applications with that job_posting_id
    Then the server returns 422 "Cette offre n'est plus disponible"

  Scenario: Apply to another candidate's profile
    Given I am candidate A
    When I send POST /api/v1/applications with candidate_id=[B's id]
    Then the server overrides candidate_id with my own candidate.id (from session)
    And candidate B's data is not touched
```

---

### Story 5.2 — Employer applicant dashboard
**Priority**: Must | **Size**: M | **Specialist**: Full-stack Dev

As a recruiter, I want to see all applicants for each job with their profile summary and status, so that I can manage my pipeline.

**Acceptance Criteria**:
```
Given I navigate to /offres/[id]/candidats
Then I see a list of all applications for that job
And each row shows: candidate name, city, years experience, top 3 skills, availability, application date, current status

Given I click "Voir le CV" for a candidate
Then the server generates a 60-minute signed URL
And the PDF opens in a new tab
And no signed URL is returned for a candidate from a different company's job

Given I change a candidate's status to "Présélectionné"
Then applications.status is updated to 'shortlisted'
And the change is reflected immediately in the UI

Given I navigate to another company's job's applicant URL (/offres/[other-company-job-id]/candidats)
Then I receive a 403 (enforced by RLS + API guard)
```

---

### Story 5.3 — CV signed URL access
**Priority**: Must | **Size**: S | **Specialist**: Full-stack Dev
**Risk**: Maximum — privacy-critical

As a recruiter, I want to download a candidate's CV only if they applied to my job, so that candidate data is never exposed without consent.

**ATDD Acceptance Scenarios**:
```gherkin
Feature: CV Access Control

  Scenario: Recruiter can access CV after application
    Given candidate A applied to job J belonging to company C
    And I am a recruiter for company C
    When I call GET /api/v1/candidates/[A-id]/cv-url
    Then the server verifies the application relationship in the DB
    And returns a signed URL expiring in 60 minutes
    And the URL allows downloading the PDF

  Scenario: Recruiter from different company cannot access CV
    Given candidate A applied only to company C's jobs
    And I am a recruiter for company D
    When I call GET /api/v1/candidates/[A-id]/cv-url
    Then the server returns 403 "Accès refusé"
    And no signed URL is generated

  Scenario: Unauthenticated request cannot access CV
    Given I am not logged in
    When I call GET /api/v1/candidates/[any-id]/cv-url
    Then the server returns 401

  Scenario: Direct storage URL does not work
    Given the CV is stored in a private bucket
    When I try to access the storage URL directly (without signed params)
    Then Supabase Storage returns 400 (private bucket)
```

---

### Story 5.4 — Candidate application tracker
**Priority**: Must | **Size**: S | **Specialist**: Full-stack Dev

As a candidate, I want to see all my applications with their current status, so that I can track where I stand.

**Acceptance Criteria**:
```
Given I navigate to /candidatures
Then I see a list of all my applications
And each row shows: job title, company name, date applied, current status (colour-coded)

Given a recruiter changes my status to 'shortlisted'
When I refresh /candidatures
Then my application shows "Présélectionné"

Given I try to call GET /api/v1/applications with another candidate's session
Then I only see my own applications (RLS enforces this)
```

---

## Epic 6: Payments & Billing

*See Story 3.2 for the core pay-per-post + webhook flow. This epic covers subscriptions and billing management.*

### Story 6.1 — Subscription checkout (Starter / Growth Annual)
**Priority**: Must | **Size**: M | **Specialist**: Full-stack Dev

As an employer, I want to subscribe to an annual plan via Stripe so that I get unlimited or bulk posting rights.

**Acceptance Criteria**:
```
Given I am on /facturation
When I click "Souscrire au plan Starter (24 000 MAD/an)"
Then I am redirected to Stripe Checkout with the correct Stripe Price ID
And the price is shown as ~2 400 EUR with a note "(≈ 24 000 MAD)"

Given Stripe fires customer.subscription.created or checkout.session.completed
When the webhook handler processes it
Then a subscriptions row is created with plan='starter_annual', status='active', ends_at = NOW()+1year
And posts_remaining is set to 20 (Starter) or NULL (Growth)

Given my subscription expires
When I try to create a new job posting
Then the system checks ends_at and prompts me to renew
```

---

### Story 6.2 — Company billing page
**Priority**: Should | **Size**: S | **Specialist**: Full-stack Dev

As an employer, I want to see my current plan and payment history, so that I understand what I'm paying for.

**Acceptance Criteria**:
```
Given I navigate to /facturation
Then I see my active plan (or "Aucun abonnement actif")
And a list of past payments (amount MAD, amount EUR, date, status)
And a "Changer de plan" CTA

Given I have a bank transfer pending
Then I see "Virement bancaire en attente — votre compte sera activé sous 48h"
```

---

### Story 6.3 — Bank transfer flow
**Priority**: Should | **Size**: S | **Specialist**: Full-stack Dev

As an employer, I want to request an invoice for an annual plan so that I can pay by bank transfer (standard in Moroccan B2B).

**Acceptance Criteria**:
```
Given I click "Payer par virement bancaire"
When I confirm the plan and my company details
Then an email is sent to admin with the request details
And I see bank transfer instructions (RIB, reference to use)
And a subscriptions row is created with status='trial' (pending activation)

Given the admin marks the transfer as received in /admin/paiements
Then the subscription status changes to 'active'
And I receive an activation email
```

---

## Epic 7: Email Notifications

### Story 7.1 — Transactional email setup + templates
**Priority**: Must | **Size**: M | **Specialist**: Full-stack Dev

As the system, I want React Email templates for all transactional emails sent via Resend, so that communications are professional and consistent.

**Emails to build (6 templates):**
1. Welcome — Employer (with "pending verification" message)
2. Welcome — Candidate (with profile completion CTA)
3. Application submitted — to candidate (job title, company name)
4. New application — to recruiter (candidate name, city, skills summary)
5. Payment confirmation — to employer (plan, amount MAD + EUR, receipt link)
6. Employer verified — admin approval notification

**Acceptance Criteria**:
```
Given any triggering event (apply, signup, payment)
When the corresponding Resend API call is made in the API route
Then the email is delivered within 60 seconds (in non-test environments)
And the email renders correctly in Gmail, Outlook, and Apple Mail

Given Resend is unreachable
When the email send fails
Then the primary action (application saved, payment recorded) is NOT rolled back
And the error is logged (do not throw, log and continue)
```

---

## Epic 8: Admin Panel

### Story 8.1 — Company verification
**Priority**: Must | **Size**: M | **Specialist**: Full-stack Dev

As an admin, I want to review and approve or reject employer registrations so that only legitimate companies post jobs.

**Acceptance Criteria**:
```
Given I navigate to /admin/entreprises
Then I see companies grouped by status: Pending, Verified, Rejected
And each row shows company name, city, website, registration date, recruiter email

Given I click "Vérifier" on a company
Then verified_at is set to NOW()
And the employer receives a "compte vérifié" email
And they can now access the job posting form

Given I click "Rejeter"
Then I am prompted for a reason (free text)
And verified_at remains NULL
And the employer receives a rejection email with the reason
```

---

### Story 8.2 — Job moderation
**Priority**: Must | **Size**: S | **Specialist**: Full-stack Dev

As an admin, I want to unpublish any job posting that violates platform rules, so that the job board stays professional.

**Acceptance Criteria**:
```
Given I navigate to /admin/offres
Then I see all active job postings with company, title, date, views count

Given I click "Dépublier" on a job
Then status changes to 'closed'
And the job disappears from the public listing immediately
```

---

### Story 8.3 — Salary benchmark management
**Priority**: Must | **Size**: S | **Specialist**: Full-stack Dev

As an admin, I want to create and publish salary benchmark pages so that they drive SEO traffic.

**Acceptance Criteria**:
```
Given I navigate to /admin/benchmarks/nouveau
When I fill in all fields and click "Publier"
Then published_at is set to NOW()
And the page is accessible at /salaire/[slug] (ISR revalidated within 24h)

Given I leave published_at as NULL
Then the benchmark is in draft and not publicly accessible
```

---

## Epic 9: SEO & Launch Readiness

### Story 9.1 — Public pages SEO
**Priority**: Must | **Size**: M | **Specialist**: Full-stack Dev

As a potential user finding AutoJobs.ma via Google, I want correct meta tags, Open Graph data, and structured data on all public pages, so that the site ranks and previews well.

**Acceptance Criteria**:
```
Given I view /jobs/[id]
Then <title> = "[Job title] — [Company] | AutoJobs.ma"
And <meta name="description"> is the first 160 chars of description_fr
And og:title, og:description, og:url are set

Given I view /salaire/[slug]
Then <title> = "Salaire [role_title_fr] au Maroc | AutoJobs.ma"

Given a search engine crawls /jobs
Then all active job postings are in the rendered HTML (SSR confirmed)
```

---

### Story 9.2 — Landing page
**Priority**: Must | **Size**: M | **Specialist**: Full-stack Dev

As a visitor, I want a landing page that immediately communicates the value proposition for both employers and candidates, so that I understand what AutoJobs.ma offers.

**Sections (French primary, English toggle):**
1. Hero — headline, sub-headline, two CTAs: "Je recrute" / "Je cherche un poste"
2. Stats bar — 1,500+ candidats, [N] offres actives, [N] entreprises
3. Featured jobs (latest 6 active)
4. "Comment ça marche" — 3 steps for each side
5. Key companies logos (Stellantis, Gotion, Yazaki, etc. — with permission, else sector logos)
6. CTA bar — "Publiez votre première offre"
7. Footer — links, privacy, contact

---

### Story 9.3 — sitemap.xml + robots.txt
**Priority**: Should | **Size**: S | **Specialist**: Full-stack Dev

**Acceptance Criteria**:
```
Given /sitemap.xml is requested
Then it includes all active job postings and published salary benchmarks
And is regenerated on each deploy or ISR revalidation

Given /robots.txt is requested
Then it allows all public paths and disallows /admin, /api
```

---

### Story 9.4 — Privacy policy page
**Priority**: Must | **Size**: S | **Specialist**: Full-stack Dev

As a visitor, I want to read the privacy policy in French so that I understand how my data is used (Loi 09-08 requirement).

**Content**: Data collected, legal basis (consent), sub-processors (Supabase EU, Vercel EU, Resend EU, Stripe, PostHog), retention periods, right to deletion (email contact), cookies.

---

## Adversarial Review (Test Architect)

### Adversarial Review: Payment Flow

| # | Finding | Severity | Attack Vector | Remediation |
|---|---|---|---|---|
| P-1 | Webhook not signature-verified | **Critical** | POST fake webhook to activate job for free | Verify `stripe-signature` header with `stripe.webhooks.constructEvent()` — reject 400 if invalid |
| P-2 | Success redirect activates job (not webhook) | **Critical** | Intercept/replay success URL to activate job without paying | Job activation happens ONLY in webhook handler. Success page only shows "thank you" and polls status |
| P-3 | Duplicate webhook replay | **High** | Stripe retry fires twice → duplicate active job or subscription | Store `stripe_payment_intent_id`; check uniqueness before processing |
| P-4 | Subscription bypass on job create | **High** | POST to create job directly with status='active' in body | Status is server-set only. Client cannot set status. RLS prevents direct writes |
| P-5 | Client-side MAD/EUR price manipulation | **Medium** | Change price in browser before checkout | Price is fetched from server/Stripe Price ID — never taken from client request body |

---

### Adversarial Review: Auth & RBAC

| # | Finding | Severity | Attack Vector | Remediation |
|---|---|---|---|---|
| A-1 | Role set from client body | **Critical** | POST `{"role":"admin"}` to complete-profile | Role hardcoded server-side by endpoint type (`?type=employer` or `?type=candidate`). Never from request body |
| A-2 | Employer accesses /admin routes | **High** | Navigate to /admin/entreprises as employer | Next.js middleware reads role from session and returns 403 for wrong role |
| A-3 | Unverified employer creates job | **High** | POST /api/v1/jobs before company is verified | API route checks `companies.verified_at IS NOT NULL` before allowing job creation |
| A-4 | Session cookie theft (XSS) | **High** | Inject script to steal session token | HttpOnly cookie prevents JS access. CSP header blocks inline scripts. Next.js escapes output |
| A-5 | Recruiter accesses other company's jobs | **High** | PATCH /api/v1/jobs/[other-company-job-id] | RLS policy: job_postings company_id must match recruiter's company_id |

---

### Adversarial Review: Application Flow

| # | Finding | Severity | Attack Vector | Remediation |
|---|---|---|---|---|
| AP-1 | Candidate sets own candidate_id | **Critical** | POST application with `candidate_id=[other-candidate-id]` | Server always sets candidate_id from session: `const candidate = await getCandidateByUserId(session.user.id)` |
| AP-2 | Double-apply race condition | **High** | Two simultaneous POSTs for same job | UNIQUE constraint (job_posting_id, candidate_id) at DB level — second insert throws on conflict |
| AP-3 | Apply with incomplete profile (< 80%) bypassed | **High** | Disable client-side check, POST directly to API | Server reads `candidates.profile_completeness` from DB. Client state not trusted |
| AP-4 | Recruiter reads applications for other company | **High** | GET /api/v1/jobs/[other-company-job-id]/applications | RLS policy checks recruiter.company_id = job_postings.company_id |
| AP-5 | Candidate reads other candidate's applications | **Medium** | GET /api/v1/applications with manipulated session | RLS: candidate_id = candidates.id WHERE user_id = auth.uid() |

---

### Adversarial Review: CV Upload & Access

| # | Finding | Severity | Attack Vector | Remediation |
|---|---|---|---|---|
| CV-1 | Non-PDF masquerading as PDF | **High** | Upload .php renamed to .pdf | Validate Content-Type AND read first 4 bytes (magic: `%PDF`). Reject if mismatch |
| CV-2 | Path traversal via filename | **High** | filename: `../../etc/passwd` | Server generates path: `cvs/{candidate_id}/{Date.now()}.pdf`. User filename never used |
| CV-3 | Recruiter accesses CV without application | **High** | GET /api/v1/candidates/[id]/cv-url without applying | Server queries: `applications JOIN job_postings WHERE company_id = recruiter.company_id AND candidate_id = :id`. 403 if 0 rows |
| CV-4 | Direct storage URL bypass | **Medium** | Guess storage URL and access directly | Bucket is private. All access requires Supabase Storage service role to generate signed URL |
| CV-5 | Oversized file | **Medium** | Upload 500 MB file to exhaust storage quota | Server enforces 10 MB limit before calling Supabase Storage. Return 413 if exceeded |

---

## Sprint Allocation

| Sprint | Dates | Goal | Epics / Stories |
|---|---|---|---|
| **Sprint 1** | May 11–24 | Scaffold + Auth + Taxonomy | Epic 1 (all 5 stories), Epic 2 (2.1–2.4), Epic 3 admin verification (8.1), Epic 1.5 (taxonomy seed) |
| **Sprint 2** | May 25–Jun 7 | Job Posting + Candidate Profile | Epic 3 (3.1–3.4 public listing), Epic 4 (4.1–4.3 with CV upload), Epic 7.1 (email templates setup) |
| **Sprint 3** | Jun 8–21 | Applications + Payments + Admin + Email | Epic 5 (5.1–5.4), Epic 6 (6.1–6.3), Epic 7.1 (email sends wired), Epic 8 (8.2–8.3), Epic 2.5 (invite) |
| **Sprint 4** | Jun 22–28 | SEO + Landing + Polish | Epic 9 (all), final QA, beta invite list |
| **Beta** | Jul 6 | Invite-only beta | 5–10 employers, 200 seeded candidates |
| **Launch** | Jul 20 | Public launch | Domain live, Stripe live, outreach begins |

### Sprint 1 — Batch breakdown (~80h)
```
📋 Batch 1.A: Scaffold (~10h)
  ├── Initialize Next.js + TS + Tailwind + shadcn/ui
  ├── Configure Supabase CLI + local dev project
  └── Set up Vercel + GitHub integration + Cloudflare DNS

📋 Batch 1.B: Database (~12h)
  ├── Write all 14 migration files
  ├── Add indexes
  ├── Enable RLS + write key policies (profiles, candidates, jobs, applications)
  └── Generate TypeScript types

📋 Batch 1.C: Auth (employer) (~12h)
  ├── /inscription/employeur page + Supabase signUp()
  ├── /api/v1/auth/complete-profile?type=employer
  └── "Pending verification" screen

📋 Batch 1.D: Auth (candidate + login + routing) (~10h)
  ├── /inscription/candidat page
  ├── /connexion shared login page
  ├── Next.js middleware (route guards)
  └── Role-based redirect after login

📋 Batch 1.E: Security + Taxonomy (~8h)
  ├── Security headers in next.config.js
  ├── Cookie consent banner (PostHog)
  ├── Taxonomy seed SQL (60 tags)
  └── GET /api/v1/tags endpoint

📋 Batch 1.F: Admin company verification (~10h)
  ├── /admin/entreprises page (pending / verified / rejected)
  ├── PATCH /api/v1/admin/companies/:id (verify/reject)
  └── Welcome + verification emails via Resend
```

### Definition of Done (all sprints)
- [ ] Code written; no TypeScript errors (`npm run typecheck` passes)
- [ ] ESLint passes (`npm run lint`)
- [ ] All ATDD acceptance scenarios manually verified
- [ ] No critical/high adversarial findings unmitigated
- [ ] Deployed to Vercel preview URL and smoke-tested
- [ ] RLS policies tested: cross-user data access returns empty/403
- [ ] No secrets committed to git

---

## Traceability Matrix

| PRD Requirement | Story | Risk Level | Unit Test | Integration | E2E |
|---|---|---|---|---|---|
| FR-1 Employer multi-recruiter | 2.1, 2.5 | High | planned | planned | planned |
| FR-2 Structured job posting | 3.1 | High | planned | planned | planned |
| FR-3 Job management | 3.3 | Standard | planned | planned | — |
| FR-4 Candidate search | 7.2 (Sprint 4) | Standard | planned | planned | — |
| FR-5 Applicant dashboard + status | 5.2, 5.3 | Maximum | planned | planned | planned |
| FR-6 Candidate profile | 4.1, 4.2 | High | planned | planned | planned |
| FR-7 CV upload | 4.3 | Maximum | planned | planned | planned |
| FR-8 Job search + filters | 3.4 | Standard | planned | planned | planned |
| FR-9 One-click apply (profile ≥ 80%) | 5.1 | Maximum | planned | planned | planned |
| FR-10 Application tracking | 5.4 | High | planned | planned | planned |
| FR-11 Stripe checkout | 3.2, 6.1 | Maximum | planned | planned | planned |
| FR-12 Transactional email | 7.1 | Standard | planned | planned | — |
| FR-13 Admin panel | 8.1, 8.2, 8.3 | Standard | planned | planned | — |
| FR-14 Salary benchmark pages | 8.3, 9.1 | Minimal | — | — | smoke |
| FR-15 MAD pricing display | 3.2, 6.1 | Standard | planned | — | — |

---

## Story Validation Checklist

- [x] Every PRD requirement (FR-1 through FR-15) maps to at least one story
- [x] Every high-risk story has Gherkin acceptance criteria
- [x] Dependencies are identified and ordered correctly (Scaffold → Auth → Features)
- [x] All stories are S, M, or L (nothing larger — XL would need splitting)
- [x] Architecture decisions referenced in technical notes per story
- [x] Adversarial review completed for 4 critical flows: payments, auth, applications, CV
- [x] Sprint allocation fits 6-week build at 40h/week (solo dev)
- [x] Security requirements reflected in relevant stories (RLS, signed URLs, signature verification)
