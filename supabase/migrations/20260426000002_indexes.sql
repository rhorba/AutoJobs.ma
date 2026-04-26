-- ============================================================
-- AutoJobs.ma — Indexes
-- ============================================================

-- Auth / profile lookups
CREATE UNIQUE INDEX idx_profiles_id ON profiles(id);

-- Company lookup by slug (public URL)
CREATE UNIQUE INDEX idx_companies_slug ON companies(slug);

-- Recruiter lookup by user
CREATE UNIQUE INDEX idx_recruiters_user_id ON recruiters(user_id);

-- Candidate lookup by user
CREATE UNIQUE INDEX idx_candidates_user_id ON candidates(user_id);

-- Job search (most common queries)
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
