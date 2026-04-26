# Risk Log
<!-- Tracks risks identified and their mitigations -->
<!-- Format: ### [YYYY-MM-DD HH:MM] SECURITY/PERFORMANCE/DEPENDENCY — Title -->


### [2026-04-26 01:00] SECURITY — Adversarial findings logged
Critical (5): P-1 webhook not verified, P-2 success redirect activates job, A-1 role from client, AP-1 candidate_id from client, CV-1 non-PDF bypass
High (8): P-3 duplicate webhook, P-4 subscription bypass, A-2 employer→admin, A-3 unverified employer posts, A-4 XSS/cookie, A-5 cross-company job edit, AP-2 double-apply race, AP-3 profile bypass
All have documented mitigations in docs/stories-autojobs.md adversarial review section.
