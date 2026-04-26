// Manually maintained until `npx supabase gen types typescript --local > types/database.ts`
// Each table requires Row / Insert / Update / Relationships to satisfy GenericTable.

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          role: "employer" | "candidate" | "admin"
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          role: "employer" | "candidate" | "admin"
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          role?: "employer" | "candidate" | "admin"
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      companies: {
        Row: {
          id: string
          name: string
          slug: string
          website: string | null
          size_range: "1-50" | "51-200" | "201-1000" | "1000+" | null
          city: string
          free_zone: string | null
          logo_path: string | null
          verified_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          website?: string | null
          size_range?: "1-50" | "51-200" | "201-1000" | "1000+" | null
          city: string
          free_zone?: string | null
          logo_path?: string | null
          verified_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          website?: string | null
          size_range?: "1-50" | "51-200" | "201-1000" | "1000+" | null
          city?: string
          free_zone?: string | null
          logo_path?: string | null
          verified_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      recruiters: {
        Row: {
          id: string
          user_id: string
          company_id: string
          first_name: string
          last_name: string
          title: string | null
          is_company_owner: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          company_id: string
          first_name: string
          last_name: string
          title?: string | null
          is_company_owner?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          company_id?: string
          first_name?: string
          last_name?: string
          title?: string | null
          is_company_owner?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      candidates: {
        Row: {
          id: string
          user_id: string
          first_name: string
          last_name: string
          phone: string | null
          city: string
          cv_file_path: string | null
          years_experience: number | null
          availability: "immediately" | "within_1_month" | "within_3_months" | "not_looking"
          profile_completeness: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          first_name: string
          last_name: string
          phone?: string | null
          city: string
          cv_file_path?: string | null
          years_experience?: number | null
          availability?: "immediately" | "within_1_month" | "within_3_months" | "not_looking"
          profile_completeness?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          first_name?: string
          last_name?: string
          phone?: string | null
          city?: string
          cv_file_path?: string | null
          years_experience?: number | null
          availability?: "immediately" | "within_1_month" | "within_3_months" | "not_looking"
          profile_completeness?: number
          updated_at?: string
        }
        Relationships: []
      }
      candidate_experiences: {
        Row: {
          id: string
          candidate_id: string
          company_name: string
          title: string
          start_date: string
          end_date: string | null
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          candidate_id: string
          company_name: string
          title: string
          start_date: string
          end_date?: string | null
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          candidate_id?: string
          company_name?: string
          title?: string
          start_date?: string
          end_date?: string | null
          description?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      skill_tags: {
        Row: {
          id: string
          name: string
          slug: string
          category: "role_family" | "technical_skill" | "certification" | "language" | "soft_skill"
          parent_id: string | null
          is_active: boolean
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          category: "role_family" | "technical_skill" | "certification" | "language" | "soft_skill"
          parent_id?: string | null
          is_active?: boolean
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          category?: "role_family" | "technical_skill" | "certification" | "language" | "soft_skill"
          parent_id?: string | null
          is_active?: boolean
          sort_order?: number
        }
        Relationships: []
      }
      candidate_skills: {
        Row: {
          candidate_id: string
          skill_tag_id: string
          level: "beginner" | "intermediate" | "expert" | null
        }
        Insert: {
          candidate_id: string
          skill_tag_id: string
          level?: "beginner" | "intermediate" | "expert" | null
        }
        Update: {
          candidate_id?: string
          skill_tag_id?: string
          level?: "beginner" | "intermediate" | "expert" | null
        }
        Relationships: []
      }
      job_postings: {
        Row: {
          id: string
          company_id: string
          recruiter_id: string
          title: string
          role_family_id: string | null
          description_fr: string
          description_en: string | null
          city: string
          free_zone: string | null
          contract_type: "CDI" | "CDD" | "Interim" | "Stage" | "Freelance"
          salary_min: number | null
          salary_max: number | null
          language_requirements: string[] | null
          status: "draft" | "pending_payment" | "active" | "closed" | "expired"
          expires_at: string | null
          is_featured: boolean
          views_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          recruiter_id: string
          title: string
          role_family_id?: string | null
          description_fr: string
          description_en?: string | null
          city: string
          free_zone?: string | null
          contract_type: "CDI" | "CDD" | "Interim" | "Stage" | "Freelance"
          salary_min?: number | null
          salary_max?: number | null
          language_requirements?: string[] | null
          status?: "draft" | "pending_payment" | "active" | "closed" | "expired"
          expires_at?: string | null
          is_featured?: boolean
          views_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          recruiter_id?: string
          title?: string
          role_family_id?: string | null
          description_fr?: string
          description_en?: string | null
          city?: string
          free_zone?: string | null
          contract_type?: "CDI" | "CDD" | "Interim" | "Stage" | "Freelance"
          salary_min?: number | null
          salary_max?: number | null
          language_requirements?: string[] | null
          status?: "draft" | "pending_payment" | "active" | "closed" | "expired"
          expires_at?: string | null
          is_featured?: boolean
          views_count?: number
          updated_at?: string
        }
        Relationships: []
      }
      job_skills: {
        Row: { job_posting_id: string; skill_tag_id: string; is_required: boolean }
        Insert: { job_posting_id: string; skill_tag_id: string; is_required?: boolean }
        Update: { job_posting_id?: string; skill_tag_id?: string; is_required?: boolean }
        Relationships: []
      }
      applications: {
        Row: {
          id: string
          job_posting_id: string
          candidate_id: string
          status: "submitted" | "viewed" | "shortlisted" | "rejected"
          cover_note: string | null
          applied_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          job_posting_id: string
          candidate_id: string
          status?: "submitted" | "viewed" | "shortlisted" | "rejected"
          cover_note?: string | null
          applied_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          job_posting_id?: string
          candidate_id?: string
          status?: "submitted" | "viewed" | "shortlisted" | "rejected"
          cover_note?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          id: string
          company_id: string
          plan: "pay_per_post" | "starter_annual" | "growth_annual" | "enterprise"
          stripe_subscription_id: string | null
          stripe_customer_id: string | null
          status: "active" | "cancelled" | "past_due" | "trial"
          posts_remaining: number | null
          starts_at: string
          ends_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          plan: "pay_per_post" | "starter_annual" | "growth_annual" | "enterprise"
          stripe_subscription_id?: string | null
          stripe_customer_id?: string | null
          status?: "active" | "cancelled" | "past_due" | "trial"
          posts_remaining?: number | null
          starts_at?: string
          ends_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          plan?: "pay_per_post" | "starter_annual" | "growth_annual" | "enterprise"
          stripe_subscription_id?: string | null
          stripe_customer_id?: string | null
          status?: "active" | "cancelled" | "past_due" | "trial"
          posts_remaining?: number | null
          starts_at?: string
          ends_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          id: string
          company_id: string
          subscription_id: string | null
          job_posting_id: string | null
          stripe_payment_intent_id: string | null
          amount_eur_cents: number
          amount_mad: number
          status: "pending" | "succeeded" | "failed" | "refunded"
          payment_method: "stripe_card" | "bank_transfer"
          created_at: string
        }
        Insert: {
          id?: string
          company_id: string
          subscription_id?: string | null
          job_posting_id?: string | null
          stripe_payment_intent_id?: string | null
          amount_eur_cents: number
          amount_mad: number
          status?: "pending" | "succeeded" | "failed" | "refunded"
          payment_method?: "stripe_card" | "bank_transfer"
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          subscription_id?: string | null
          job_posting_id?: string | null
          stripe_payment_intent_id?: string | null
          amount_eur_cents?: number
          amount_mad?: number
          status?: "pending" | "succeeded" | "failed" | "refunded"
          payment_method?: "stripe_card" | "bank_transfer"
        }
        Relationships: []
      }
      recruiter_invites: {
        Row: {
          id: string
          company_id: string
          invited_by: string
          email: string
          token: string
          expires_at: string
          accepted_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          company_id: string
          invited_by: string
          email: string
          token: string
          expires_at: string
          accepted_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          invited_by?: string
          email?: string
          token?: string
          expires_at?: string
          accepted_at?: string | null
        }
        Relationships: []
      }
      salary_benchmarks: {
        Row: {
          id: string
          role_title_fr: string
          role_title_en: string | null
          slug: string
          role_family_id: string | null
          salary_min_mad: number
          salary_max_mad: number
          salary_median_mad: number
          typical_certifications: string[] | null
          typical_hiring_companies: string[] | null
          experience_range: string | null
          content_fr: string
          content_en: string | null
          published_at: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          role_title_fr: string
          role_title_en?: string | null
          slug: string
          role_family_id?: string | null
          salary_min_mad: number
          salary_max_mad: number
          salary_median_mad: number
          typical_certifications?: string[] | null
          typical_hiring_companies?: string[] | null
          experience_range?: string | null
          content_fr: string
          content_en?: string | null
          published_at?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          role_title_fr?: string
          role_title_en?: string | null
          slug?: string
          role_family_id?: string | null
          salary_min_mad?: number
          salary_max_mad?: number
          salary_median_mad?: number
          typical_certifications?: string[] | null
          typical_hiring_companies?: string[] | null
          experience_range?: string | null
          content_fr?: string
          content_en?: string | null
          published_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
