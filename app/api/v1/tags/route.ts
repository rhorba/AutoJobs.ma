import { createServiceClient } from "@/lib/supabase/server";
import { ok, err } from "@/lib/api-response";
import type { Database } from "@/types/database";

type TagCategory = Database["public"]["Tables"]["skill_tags"]["Row"]["category"];
const VALID_CATEGORIES: TagCategory[] = [
  "role_family", "technical_skill", "certification", "language", "soft_skill",
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") as TagCategory | null;

  if (category && !VALID_CATEGORIES.includes(category)) {
    return err(`Invalid category. Must be one of: ${VALID_CATEGORIES.join(", ")}`, 400);
  }

  const supabase = await createServiceClient();
  let query = supabase
    .from("skill_tags")
    .select("id, name, slug, category, parent_id, sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (category) {
    query = query.eq("category", category);
  }

  const { data, error } = await query;
  if (error) return err("Failed to fetch tags", 500);

  return ok({ tags: data, total: data.length });
}
