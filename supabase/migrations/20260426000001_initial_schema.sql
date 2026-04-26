-- ============================================================
-- AutoJobs.ma — Initial Schema
-- 14 tables in dependency order
-- ============================================================

-- Utility: auto-update updated_at on any row change
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─── 1. profiles ─────────────────────────────────────────────
-- Extends auth.users; created immediately on signup via complete-profile endpoint
CREATE TABLE profiles (
    id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role       TEXT NOT NULL CHECK (role IN ('employer', 'candidate', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── 2. skill_tags ───────────────────────────────────────────
-- Master taxonomy: role families, technical skills, certifications, languages
CREATE TABLE skill_tags (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name       TEXT NOT NULL UNIQUE,
    slug       TEXT NOT NULL UNIQUE,
    category   TEXT NOT NULL CHECK (category IN ('role_family','technical_skill','certification','language','soft_skill')),
    parent_id  UUID REFERENCES skill_tags(id),
    is_active  BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 3. companies ────────────────────────────────────────────
CREATE TABLE companies (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL,
    slug        TEXT NOT NULL UNIQUE,
    website     TEXT,
    size_range  TEXT CHECK (size_range IN ('1-50','51-200','201-1000','1000+')),
    city        TEXT NOT NULL,
    free_zone   TEXT,
    logo_path   TEXT,
    verified_at TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── 4. recruiters ───────────────────────────────────────────
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

CREATE TRIGGER trg_recruiters_updated_at
  BEFORE UPDATE ON recruiters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── 5. candidates ───────────────────────────────────────────
CREATE TABLE candidates (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id              UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name           TEXT NOT NULL,
    last_name            TEXT NOT NULL,
    phone                TEXT,
    city                 TEXT NOT NULL,
    cv_file_path         TEXT,
    years_experience     INTEGER CHECK (years_experience >= 0),
    availability         TEXT NOT NULL DEFAULT 'immediately'
                         CHECK (availability IN ('immediately','within_1_month','within_3_months','not_looking')),
    profile_completeness INTEGER NOT NULL DEFAULT 0 CHECK (profile_completeness BETWEEN 0 AND 100),
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_candidates_updated_at
  BEFORE UPDATE ON candidates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── 6. candidate_skills ─────────────────────────────────────
CREATE TABLE candidate_skills (
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    skill_tag_id UUID NOT NULL REFERENCES skill_tags(id) ON DELETE CASCADE,
    level        TEXT CHECK (level IN ('beginner','intermediate','expert')),
    PRIMARY KEY (candidate_id, skill_tag_id)
);

-- ─── 7. candidate_experiences ────────────────────────────────
CREATE TABLE candidate_experiences (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    title        TEXT NOT NULL,
    start_date   DATE NOT NULL,
    end_date     DATE,
    description  TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_candidate_experiences_updated_at
  BEFORE UPDATE ON candidate_experiences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── 8. job_postings ─────────────────────────────────────────
CREATE TABLE job_postings (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id            UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    recruiter_id          UUID NOT NULL REFERENCES recruiters(id),
    title                 TEXT NOT NULL,
    role_family_id        UUID REFERENCES skill_tags(id),
    description_fr        TEXT NOT NULL,
    description_en        TEXT,
    city                  TEXT NOT NULL,
    free_zone             TEXT,
    contract_type         TEXT NOT NULL CHECK (contract_type IN ('CDI','CDD','Interim','Stage','Freelance')),
    salary_min            INTEGER CHECK (salary_min > 0),
    salary_max            INTEGER CHECK (salary_max >= salary_min),
    language_requirements TEXT[],
    status                TEXT NOT NULL DEFAULT 'draft'
                          CHECK (status IN ('draft','pending_payment','active','closed','expired')),
    expires_at            TIMESTAMPTZ,
    is_featured           BOOLEAN NOT NULL DEFAULT FALSE,
    views_count           INTEGER NOT NULL DEFAULT 0,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_job_postings_updated_at
  BEFORE UPDATE ON job_postings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── 9. job_skills ───────────────────────────────────────────
CREATE TABLE job_skills (
    job_posting_id UUID NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
    skill_tag_id   UUID NOT NULL REFERENCES skill_tags(id) ON DELETE CASCADE,
    is_required    BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY (job_posting_id, skill_tag_id)
);

-- ─── 10. applications ────────────────────────────────────────
CREATE TABLE applications (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_posting_id UUID NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
    candidate_id   UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    status         TEXT NOT NULL DEFAULT 'submitted'
                   CHECK (status IN ('submitted','viewed','shortlisted','rejected')),
    cover_note     TEXT,
    applied_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (job_posting_id, candidate_id)
);

CREATE TRIGGER trg_applications_updated_at
  BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── 11. subscriptions ───────────────────────────────────────
CREATE TABLE subscriptions (
    id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id             UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    plan                   TEXT NOT NULL CHECK (plan IN ('pay_per_post','starter_annual','growth_annual','enterprise')),
    stripe_subscription_id TEXT UNIQUE,
    stripe_customer_id     TEXT,
    status                 TEXT NOT NULL DEFAULT 'active'
                           CHECK (status IN ('active','cancelled','past_due','trial')),
    posts_remaining        INTEGER,
    starts_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ends_at                TIMESTAMPTZ,
    created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── 12. payments ────────────────────────────────────────────
CREATE TABLE payments (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id               UUID NOT NULL REFERENCES companies(id),
    subscription_id          UUID REFERENCES subscriptions(id),
    job_posting_id           UUID REFERENCES job_postings(id),
    stripe_payment_intent_id TEXT UNIQUE,
    amount_eur_cents         INTEGER NOT NULL,
    amount_mad               INTEGER NOT NULL,
    status                   TEXT NOT NULL DEFAULT 'pending'
                             CHECK (status IN ('pending','succeeded','failed','refunded')),
    payment_method           TEXT NOT NULL DEFAULT 'stripe_card'
                             CHECK (payment_method IN ('stripe_card','bank_transfer')),
    created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 13. recruiter_invites ───────────────────────────────────
CREATE TABLE recruiter_invites (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id  UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    invited_by  UUID NOT NULL REFERENCES recruiters(id),
    email       TEXT NOT NULL,
    token       TEXT NOT NULL UNIQUE,
    expires_at  TIMESTAMPTZ NOT NULL,
    accepted_at TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 14. salary_benchmarks ───────────────────────────────────
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
    experience_range         TEXT,
    content_fr               TEXT NOT NULL,
    content_en               TEXT,
    published_at             TIMESTAMPTZ,
    updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_salary_benchmarks_updated_at
  BEFORE UPDATE ON salary_benchmarks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
