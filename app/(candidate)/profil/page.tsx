import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { ProfileForm } from "./profile-form";
import { ExperienceSection } from "./experience-section";
import { CvUpload } from "./cv-upload";
import { Progress } from "@/components/ui/progress";

export default async function ProfilPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const service = await createServiceClient();

  const [candidateRes, skillsRes, experiencesRes, tagsRes] = await Promise.all([
    service.from("candidates").select("*").eq("user_id", user.id).single(),
    service.from("candidate_skills").select("skill_tag_id, level").eq("candidate_id",
      (await service.from("candidates").select("id").eq("user_id", user.id).single()).data?.id ?? ""
    ),
    service.from("candidate_experiences").select("*").order("start_date", { ascending: false }),
    service.from("skill_tags").select("id, name, slug, category").eq("is_active", true).order("sort_order"),
  ]);

  const candidate = candidateRes.data;
  if (!candidate) redirect("/connexion");

  const mySkillIds = new Set((skillsRes.data ?? []).map((s) => s.skill_tag_id));
  const myExperiences = (experiencesRes.data ?? []).filter(
    (e) => e.candidate_id === candidate.id
  );
  const allTags = tagsRes.data ?? [];
  const completeness = candidate.profile_completeness;

  return (
    <div className="space-y-8">
      {/* Header + completeness */}
      <div className="rounded-lg border bg-background p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold">
              {candidate.first_name} {candidate.last_name}
            </h1>
            <p className="text-sm text-muted-foreground">{candidate.city}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">{completeness}% complet</p>
            {completeness < 80 && (
              <p className="text-xs text-amber-600">80% requis pour postuler</p>
            )}
          </div>
        </div>
        <Progress value={completeness} className="mt-4" />
      </div>

      {/* Profile form */}
      <ProfileForm
        candidate={candidate}
        allTags={allTags}
        selectedTagIds={Array.from(mySkillIds)}
      />

      {/* CV upload */}
      <CvUpload hasCv={!!candidate.cv_file_path} />

      {/* Experience section */}
      <ExperienceSection experiences={myExperiences} />
    </div>
  );
}
