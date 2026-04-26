-- ============================================================
-- AutoJobs.ma — Row Level Security Policies
-- Enforcement layer 3: DB-level isolation (defence-in-depth)
-- Layers 1+2: Next.js middleware + API route guards in app code
-- ============================================================

-- ─── profiles ────────────────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles: own read/update" ON profiles
  USING (id = auth.uid());

-- ─── companies ───────────────────────────────────────────────
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Public sees verified companies (for job listing context)
CREATE POLICY "companies: public reads verified" ON companies
  FOR SELECT USING (verified_at IS NOT NULL);

-- Recruiters can read and manage their own company
CREATE POLICY "companies: recruiters manage own" ON companies
  FOR ALL USING (
    id IN (SELECT company_id FROM recruiters WHERE user_id = auth.uid())
  );

-- ─── recruiters ──────────────────────────────────────────────
ALTER TABLE recruiters ENABLE ROW LEVEL SECURITY;

-- Recruiter reads own row
CREATE POLICY "recruiters: own read" ON recruiters
  FOR SELECT USING (user_id = auth.uid());

-- Company owner can read all recruiters in their company (for team management)
CREATE POLICY "recruiters: company owner reads all" ON recruiters
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM recruiters
      WHERE user_id = auth.uid() AND is_company_owner = TRUE
    )
  );

-- ─── candidates ──────────────────────────────────────────────
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "candidates: own read" ON candidates
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "candidates: own update" ON candidates
  FOR UPDATE USING (user_id = auth.uid());

-- Employer can read candidate only if they applied to that employer's job
CREATE POLICY "candidates: employer reads applied" ON candidates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM applications a
      JOIN job_postings jp ON a.job_posting_id = jp.id
      JOIN recruiters r ON jp.company_id = r.company_id
      WHERE a.candidate_id = candidates.id
        AND r.user_id = auth.uid()
    )
  );

-- ─── candidate_skills ────────────────────────────────────────
ALTER TABLE candidate_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "candidate_skills: own all" ON candidate_skills
  FOR ALL USING (
    candidate_id IN (SELECT id FROM candidates WHERE user_id = auth.uid())
  );

-- Employer reads skills of applied candidates
CREATE POLICY "candidate_skills: employer reads applied" ON candidate_skills
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM applications a
      JOIN job_postings jp ON a.job_posting_id = jp.id
      JOIN recruiters r ON jp.company_id = r.company_id
      WHERE a.candidate_id = candidate_skills.candidate_id
        AND r.user_id = auth.uid()
    )
  );

-- ─── candidate_experiences ───────────────────────────────────
ALTER TABLE candidate_experiences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "candidate_experiences: own all" ON candidate_experiences
  FOR ALL USING (
    candidate_id IN (SELECT id FROM candidates WHERE user_id = auth.uid())
  );

-- Employer reads experiences of applied candidates
CREATE POLICY "candidate_experiences: employer reads applied" ON candidate_experiences
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM applications a
      JOIN job_postings jp ON a.job_posting_id = jp.id
      JOIN recruiters r ON jp.company_id = r.company_id
      WHERE a.candidate_id = candidate_experiences.candidate_id
        AND r.user_id = auth.uid()
    )
  );

-- ─── skill_tags ──────────────────────────────────────────────
ALTER TABLE skill_tags ENABLE ROW LEVEL SECURITY;

-- Active tags are public (needed for job listing filters, registration forms)
CREATE POLICY "skill_tags: public reads active" ON skill_tags
  FOR SELECT USING (is_active = TRUE);

-- ─── job_postings ────────────────────────────────────────────
ALTER TABLE job_postings ENABLE ROW LEVEL SECURITY;

-- Public reads active jobs
CREATE POLICY "job_postings: public reads active" ON job_postings
  FOR SELECT USING (status = 'active');

-- Recruiter manages own company's jobs (all statuses)
CREATE POLICY "job_postings: recruiter manages own" ON job_postings
  FOR ALL USING (
    company_id IN (
      SELECT company_id FROM recruiters WHERE user_id = auth.uid()
    )
  );

-- ─── job_skills ──────────────────────────────────────────────
ALTER TABLE job_skills ENABLE ROW LEVEL SECURITY;

-- Public reads skills for active jobs
CREATE POLICY "job_skills: public reads active jobs" ON job_skills
  FOR SELECT USING (
    job_posting_id IN (SELECT id FROM job_postings WHERE status = 'active')
  );

-- Recruiter manages skills for own company's jobs
CREATE POLICY "job_skills: recruiter manages own" ON job_skills
  FOR ALL USING (
    job_posting_id IN (
      SELECT jp.id FROM job_postings jp
      JOIN recruiters r ON jp.company_id = r.company_id
      WHERE r.user_id = auth.uid()
    )
  );

-- ─── applications ────────────────────────────────────────────
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Candidate sees and inserts own applications
CREATE POLICY "applications: candidate sees own" ON applications
  FOR SELECT USING (
    candidate_id IN (SELECT id FROM candidates WHERE user_id = auth.uid())
  );

CREATE POLICY "applications: candidate inserts own" ON applications
  FOR INSERT WITH CHECK (
    candidate_id IN (SELECT id FROM candidates WHERE user_id = auth.uid())
  );

-- Recruiter reads applications to their company's jobs
CREATE POLICY "applications: recruiter reads own company" ON applications
  FOR SELECT USING (
    job_posting_id IN (
      SELECT jp.id FROM job_postings jp
      JOIN recruiters r ON jp.company_id = r.company_id
      WHERE r.user_id = auth.uid()
    )
  );

-- Recruiter updates status on their company's job applications
CREATE POLICY "applications: recruiter updates status" ON applications
  FOR UPDATE USING (
    job_posting_id IN (
      SELECT jp.id FROM job_postings jp
      JOIN recruiters r ON jp.company_id = r.company_id
      WHERE r.user_id = auth.uid()
    )
  );

-- ─── subscriptions ───────────────────────────────────────────
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subscriptions: recruiter reads own company" ON subscriptions
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM recruiters WHERE user_id = auth.uid()
    )
  );

-- ─── payments ────────────────────────────────────────────────
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payments: recruiter reads own company" ON payments
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM recruiters WHERE user_id = auth.uid()
    )
  );

-- ─── recruiter_invites ───────────────────────────────────────
ALTER TABLE recruiter_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "recruiter_invites: company owner manages" ON recruiter_invites
  FOR ALL USING (
    company_id IN (
      SELECT company_id FROM recruiters
      WHERE user_id = auth.uid() AND is_company_owner = TRUE
    )
  );

-- ─── salary_benchmarks ───────────────────────────────────────
ALTER TABLE salary_benchmarks ENABLE ROW LEVEL SECURITY;

-- Public reads published benchmarks
CREATE POLICY "salary_benchmarks: public reads published" ON salary_benchmarks
  FOR SELECT USING (published_at IS NOT NULL);
