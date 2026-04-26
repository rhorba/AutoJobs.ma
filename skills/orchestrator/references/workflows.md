# Workflow Templates

Quick-start paths for common scenarios. The orchestrator uses these to skip unnecessary phases.

---

## 🐛 Bug Fix Workflow

**Duration**: 15-60 min | **Skills**: Tech Lead → Backend or Frontend (+ DBA if data issue) → Tester

```
1. REPRODUCE
   → User describes the bug
   → Locate the relevant code
   → If DB-related: DBA reviews queries/schema
   → Confirm: "I see the issue in [file:line]. Here's what's happening: [explanation]"

2. OPTIONS (simple → complex)
   🟢 Quick patch: [minimal change]
   🟡 Proper fix: [addresses root cause]
   🔴 Refactor: [fixes the pattern, not just this instance]
   → "Which approach?"

3. FIX
   → Apply the chosen fix
   → If migration needed: DBA writes migration
   → Show the diff briefly

4. TEST
   → Write/run test that would have caught this bug
   → Run existing tests to check no regressions
   → If auth/security related: Security Engineer quick review

5. DONE
   → "Fixed and tested. Ready to commit?"
```

---

## ✨ New Feature Workflow

**Duration**: 1-4 hours | **Skills**: PM → UX → Tech Lead → DBA → Backend/Frontend → UI → Tester → Security → Deployment

```
1. SCOPE (5 min)
   → What does the feature do? (1-2 sentences)
   → Who is it for?
   → What's the success criteria?
   → YAGNI check: what's the MINIMUM viable version?

2. UX DESIGN (10-20 min — skip for backend-only features)
   → UX Designer: user flow for the feature
   → Key screens wireframed (text-based)
   → Error/empty states defined
   → Copywriter: microcopy if needed

3. TECHNICAL DESIGN (10 min)
   → Tech Lead: architecture approach (2-3 options, simple→complex)
   → User picks approach
   → DBA: schema design if new data is involved
   → Security Engineer: quick threat check if auth/data involved
   → Define API contract / component structure

4. VISUAL DESIGN (10-15 min — skip if using existing design system)
   → UI Designer: design tokens or component styles
   → Only for new visual patterns, not existing ones

5. PLAN (5 min)
   → Scrum Master: break into batches
   📋 Batch 1: Data layer (migrations, models, API)
   📋 Batch 2: Business logic (services, validation)
   📋 Batch 3: UI (components, pages, integration)
   📋 Batch 4: Tests + polish

6. EXECUTE (batch by batch)
   → One task at a time
   → Checkpoint after each batch

7. VERIFY
   → Tester: run tests
   → Security Engineer: quick review (if auth/data touched)
   → User acceptance

8. SHIP (optional)
   → Deployment: push to staging/production
```

---

## 📝 Documentation Workflow

**Duration**: 15-60 min | **Skills**: Tech Lead → relevant specialist

```
1. WHAT TO DOCUMENT
   → README / API docs / Architecture / User guide / Setup guide?

2. GATHER
   → Read existing code/configs
   → Identify what's undocumented or outdated

3. WRITE
   → Follow the project's doc style
   → Code examples must be tested/runnable
   → Keep it scannable (headers, short paragraphs)

4. REVIEW
   → "Here's the draft. Anything to add or change?"
```

---

## 🚀 New Project Workflow

**Duration**: 2-6 hours | **Skills**: PM → UX → Tech Lead → DBA → all devs → DevOps → Security → Tester

```
1. CHARTER (10 min)
   → PM: project charter (scope, goals, constraints)
   → YAGNI check: what's the absolute minimum to launch?

2. UX FOUNDATION (15-20 min)
   → UX Designer: core user flows (top 3 journeys)
   → UX Designer: site map / information architecture
   → Copywriter: key UI copy (app name, tagline, CTAs)

3. ARCHITECTURE (15 min)
   → Tech Lead: stack decision, project structure, ADRs
   → DBA: database selection and initial schema
   → Security Engineer: auth strategy, data protection requirements
   → User confirms

4. VISUAL FOUNDATION (10-15 min)
   → UI Designer: design tokens (colors, typography, spacing)
   → Or: pick a UI framework and move on (YAGNI)

5. SCAFFOLD (20 min)
   → Create project structure
   → Setup configs (linting, formatting, git)
   → Initial dependencies
   → Docker/docker-compose for dev
   → DBA: initial migration files

6. FOUNDATION (30-60 min)
   → Backend: DB setup, auth, base API
   → Frontend: routing, layout, base components
   → DevOps: CI pipeline, basic security scanning

7. FIRST FEATURE (varies)
   → Switch to Feature Workflow above

8. DEPLOY SETUP
   → DevOps: staging environment
   → Deployment: first deploy
```

---

## 📢 Marketing Launch Workflow

**Duration**: 1-3 hours | **Skills**: Digital Marketer → Copywriter → Content Marketer

```
1. STRATEGY (10 min)
   → Digital Marketer: campaign plan
   → Define audience, channels, goals

2. CONTENT CREATION (30-60 min)
   → Copywriter: landing page copy, CTAs, email copy
   → Content Marketer: blog post, social media posts

3. TECHNICAL SETUP (15 min)
   → Frontend Dev: implement landing page changes
   → Digital Marketer: analytics tracking, SEO

4. LAUNCH
   → Publish content
   → Send emails
   → Post to social media
   → Monitor initial metrics
```

---

## 🔒 Security Audit Workflow

**Duration**: 30-90 min | **Skills**: Security Engineer → DevOps/DevSecOps → DBA → Backend/Frontend

```
1. SCOPE (Security Engineer)
   → What's being audited? (full app / feature / infra)
   → YAGNI: match depth to risk level

2. THREAT MODEL (Security Engineer — 10 min)
   → STRIDE on key components
   → Attack surface analysis
   → Top risks identified

3. AUTOMATED SCAN (DevSecOps — 10 min)
   → Run SAST (Semgrep), SCA (Trivy), secrets scan (Gitleaks)
   → If Docker: container image scan
   → If IaC: Checkov scan
   → DBA: check DB access permissions, encryption

4. TRIAGE (Security Engineer — 10 min)
   → Classify findings: Critical / High / Medium / Low
   → Present to user: "Found X issues. Here are the critical ones:"

5. FIX (batch by severity)
   📋 Batch 1: Critical (fix now)
   📋 Batch 2: High (fix today)
   📋 Batch 3: Medium (track in backlog)

6. VERIFY
   → DevSecOps: re-run scans
   → Tester: confirm fixes don't break functionality
```

---

## 🔄 Refactor Workflow

**Duration**: 30-120 min | **Skills**: Tech Lead → Backend/Frontend → Tester

```
1. ASSESS
   → What needs refactoring and why?
   → Risk: what could break?
   → Scope: how much to change?

2. PLAN
   → Define the target state
   → Break into safe, incremental steps
   → Each step must leave code working

3. EXECUTE (step by step)
   → Make one change → run tests → confirm green
   → Repeat
   → Never make two structural changes at once

4. VERIFY
   → All tests pass
   → No behavior changes (unless intended)
   → Performance not degraded
```

---

## 🎨 UX/UI Design Workflow

**Duration**: 30-120 min | **Skills**: UX Designer → UI Designer → Frontend Dev → Copywriter

```
1. UNDERSTAND (5 min)
   → Who is the user? What's their goal?
   → YAGNI: do we need full personas or is a 1-liner enough?

2. FLOW (10-20 min)
   → UX Designer: happy path user flow
   → Error paths and edge cases
   → Screen states: empty, loading, error, success

3. WIREFRAME (10-20 min — skip if trivial)
   → Low-fi layout: content hierarchy, primary CTA
   → YAGNI: boxes + text only, no colors yet

4. VISUAL (10-20 min)
   → UI Designer: apply design tokens (colors, type, spacing)
   → YAGNI: use existing component library unless brand requires custom
   → Dark mode only if explicitly needed

5. COPY (5-10 min)
   → Copywriter: button labels, error messages, empty states
   → UX writing: help text, tooltips

6. HANDOFF → Frontend Dev
   → Specs: tokens used, states, responsive behavior
```

---

## 🗄️ Database Design Workflow

**Duration**: 15-60 min | **Skills**: DBA → Tech Lead → Backend Dev

```
1. REQUIREMENTS (5 min)
   → What data? What queries? How much volume?
   → YAGNI: don't design for scale you don't have

2. SCHEMA (10-20 min)
   → DBA: entities, relationships, table design
   → Normalize to 3NF by default
   → YAGNI: no denormalization until you've measured a real bottleneck

3. MIGRATION (5-10 min)
   → Write migration files
   → Ensure backward-compatible (nullable new columns first)

4. INDEXES (5 min)
   → Foreign keys + WHERE clause columns
   → YAGNI: don't index everything, add when queries are slow

5. VERIFY
   → Run migration on dev
   → Test key queries with EXPLAIN ANALYZE
```

---

## 🔐 Security Review Workflow

**Duration**: 20-60 min | **Skills**: Security Engineer → DevSecOps → Backend/Frontend

```
1. SCOPE (5 min)
   → What are we reviewing? (new feature / full app / infra)
   → YAGNI: match depth to risk level
     - Internal tool → quick checklist
     - Public app handling PII → full review

2. THREAT MODEL (10 min)
   → Security Engineer: 5-minute threat model
   → Identify top 3 threats
   → YAGNI: STRIDE only for high-risk components

3. REVIEW (10-20 min)
   → Security checklist (auth, input, data, infra)
   → Run automated scans if code exists

4. REMEDIATE
   → Fix critical/high issues
   → Backlog medium/low
   → YAGNI: don't add WAF for an internal dashboard

5. VERIFY
   → Re-scan, confirm fixes
```

---

## 🎨 UX/UI Design Workflow

**Duration**: 30-120 min | **Skills**: UX Designer → UI Designer → Frontend Dev

```
1. UNDERSTAND (5 min)
   → Who is the user?
   → What task are they completing?
   → YAGNI check: how much design is actually needed?
     Small (button/modal)   → skip to step 4
     Medium (page/feature)  → start at step 2
     Large (new product)    → full flow

2. FLOW (UX — 15 min)
   → User flow diagram (text-based)
   → Key screens identified
   → Error/empty states planned

3. WIREFRAME (UX — 15 min)
   → Text-based wireframe for key screens
   → Navigation + hierarchy decisions
   → Usability heuristic check

4. VISUAL (UI — 15-30 min)
   → Design tokens (or pick UI framework)
   → Component styling decisions
   → Responsive adaptations noted

5. HANDOFF → Frontend Dev
   → Flow + wireframe + visual specs
   → Interaction details (hover, focus, transitions)
   → Copy from Copywriter if needed
```

---

## 🗄️ Database Design Workflow

**Duration**: 15-60 min | **Skills**: DBA → Backend Dev → Security Engineer

```
1. REQUIREMENTS (5 min)
   → What entities? What relationships?
   → Read vs write heavy?
   → YAGNI: start with Postgres unless there's a real reason not to

2. SCHEMA (10-20 min)
   → Entity list → relationship map → table design
   → YAGNI: only tables/columns needed for current feature
   → Naming conventions applied

3. MIGRATION (5-10 min)
   → Migration file(s) with up + down
   → Test on dev data

4. INDEXES (5 min)
   → Index foreign keys + frequent WHERE columns
   → YAGNI: don't preemptively index everything

5. SECURITY CHECK
   → Encryption for sensitive columns?
   → Row-level security for multi-tenant?
   → Access permissions scoped?

6. HANDOFF → Backend Dev
   → Schema + migrations + query patterns
```

---

## 🔐 Security Review Workflow

**Duration**: 20-60 min | **Skills**: Security Engineer → DevSecOps → relevant dev

```
1. SCOPE
   → What's being reviewed? (feature / architecture / full app)
   → YAGNI: match security depth to project maturity

2. THREAT MODEL (Security Engineer)
   → STRIDE on relevant components only
   → Identify top 3-5 risks

3. REQUIREMENTS
   → Auth/authz design
   → Data protection needs
   → Logging requirements

4. SCAN (DevSecOps)
   → Run automated scanners
   → Triage findings by severity

5. REMEDIATE
   → Fix critical/high findings
   → Backlog medium/low

6. VERIFY
   → Re-scan
   → Confirm fixes
```

---

## 💡 Brainstorm / Ideation Workflow

**Duration**: 15-45 min | **Skills**: Creative Intelligence → PM or Tech Lead

```
1. FRAME (5 min)
   → What are we exploring? (feature idea / product direction / problem solving)
   → Any constraints? (time, budget, tech, audience)
   → YAGNI: quick brainstorm or full design thinking workshop?

2. DIVERGE (10-15 min — Creative Intelligence)
   → Pick framework: Brainstorming / SCAMPER / Design Thinking / First Principles
   → Generate 10+ ideas, no filtering
   → "Yes, and..." mindset

3. CLUSTER (5 min)
   → Group ideas by theme
   → Identify patterns

4. CONVERGE (5 min)
   → Score ideas: Impact × Confidence / Effort
   → Present top 3 ranked options
   → "Which resonates? Or combine elements?"

5. VALIDATE (5 min)
   → Quick feasibility check with Tech Lead
   → Quick user fit check with UX Designer
   → Decision logged to .logs/decisions.md

6. HANDOFF
   → If building: → PM for scope → normal feature workflow
   → If pitching: → Copywriter/Content for narrative
```

---

## 📋 Document-First Build Workflow

**Duration**: 1-2 hrs (planning) + execution | **Skills**: PM → Tech Lead → DBA → Security → Scrum → Test Architect → devs

Use for new projects and large features (3+ days of work).
Read `references/document-chain.md` for full templates.

```
1. PRD (PM — 15-20 min)
   → Problem, goals, user stories, scope, requirements, risks
   → Save to docs/prd-[name].md
   → User approves before proceeding
   📝 Log: MILESTONE "PRD approved"

2. ARCHITECTURE (Tech Lead + DBA + Security — 15-20 min)
   → ADRs, system design, data model, API design, security
   → Save to docs/architecture-[name].md
   → User approves before proceeding
   📝 Log: MILESTONE "Architecture approved"
   📝 Log: ARCHITECTURE decisions

3. STORIES (Scrum Master + Test Architect — 10-15 min)
   → Epics → stories with ATDD acceptance criteria
   → Save to docs/stories-[name].md
   → User approves before proceeding
   📝 Log: MILESTONE "Stories ready"

4. EXECUTE (normal batch execution)
   → Follow the stories, batch by batch
   → Each story references PRD requirement + architecture decision
   → Test Architect validates acceptance criteria pass

5. VERIFY
   → Test Architect: adversarial review on high-risk components
   → Traceability check: every requirement → story → test → code
```

---

## 🧪 Test Strategy Workflow

**Duration**: 20-60 min | **Skills**: Test Architect → Tester → Security Engineer

```
1. RISK ASSESSMENT (Test Architect — 10 min)
   → Score each component: impact × frequency × complexity
   → Classify: maximum / high / standard / minimal testing
   → Set coverage targets per risk level

2. ATDD SPECIFICATIONS (Test Architect — 10-15 min)
   → Write Gherkin acceptance scenarios for critical paths
   → User reviews and approves scenarios
   → These become the test suite

3. TEST PLAN (Test Architect — 5 min)
   → Map: unit / integration / e2e / adversarial per component
   → Set release gate criteria
   → Hand off to Tester for implementation

4. ADVERSARIAL REVIEW (Test Architect — 10-20 min)
   → Run adversarial checklist on high-risk components
   → Input abuse, auth abuse, race conditions, business logic
   → Log findings to .logs/issues.md

5. EDGE CASE HUNT (Test Architect — 5-10 min)
   → Apply boundary/type/time/state/network categories
   → Document edge cases as additional test cases

6. REPORT
   → Traceability matrix: requirement → test → status
   → Release readiness assessment
   📝 Log: SPRINT_SNAPSHOT with test metrics
```
