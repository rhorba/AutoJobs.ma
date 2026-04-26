import type { Database } from "@/types/database";

type Candidate = Database["public"]["Tables"]["candidates"]["Row"];

export function calcCompleteness(
  candidate: Pick<Candidate, "first_name" | "last_name" | "city" | "years_experience" | "availability" | "cv_file_path">,
  skillCount: number,
  experienceCount: number
): number {
  let score = 0;
  if (candidate.first_name && candidate.last_name) score += 20;
  if (candidate.city)                              score += 10;
  if (candidate.years_experience !== null)         score += 10;
  if (candidate.availability)                      score += 10;
  if (experienceCount >= 1)                        score += 20;
  if (skillCount >= 3)                             score += 15;
  if (candidate.cv_file_path)                      score += 15;
  return Math.min(score, 100);
}
