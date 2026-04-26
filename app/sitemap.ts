import type { MetadataRoute } from "next";
import { createServiceClient } from "@/lib/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://autojobs.ma";

  const service = await createServiceClient();
  const { data: jobs } = await service
    .from("job_postings")
    .select("id, updated_at")
    .eq("status", "active")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  const jobUrls: MetadataRoute.Sitemap = (jobs ?? []).map((job) => ({
    url: `${base}/jobs/${job.id}`,
    lastModified: new Date(job.updated_at),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [
    { url: base,            lastModified: new Date(), changeFrequency: "daily",  priority: 1.0 },
    { url: `${base}/jobs`,  lastModified: new Date(), changeFrequency: "hourly", priority: 0.9 },
    ...jobUrls,
  ];
}
