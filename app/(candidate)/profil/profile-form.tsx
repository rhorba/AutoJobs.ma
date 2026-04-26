"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import type { Database } from "@/types/database";

type Candidate = Database["public"]["Tables"]["candidates"]["Row"];
type SkillTag  = Pick<Database["public"]["Tables"]["skill_tags"]["Row"], "id" | "name" | "slug" | "category">;

const CITIES = ["Tanger","Kénitra","Casablanca","Jorf Lasfar","Rabat","Fès","Marrakech","Agadir","Autre"] as const;
const AVAILABILITY = [
  { value: "immediately",       label: "Immédiatement disponible" },
  { value: "within_1_month",   label: "Disponible sous 1 mois" },
  { value: "within_3_months",  label: "Disponible sous 3 mois" },
  { value: "not_looking",      label: "Ne cherche pas activement" },
] as const;

const CATEGORY_LABELS: Record<string, string> = {
  role_family:     "Familles de rôles",
  technical_skill: "Compétences techniques",
  certification:   "Certifications",
  language:        "Langues",
};

const schema = z.object({
  city:             z.string().min(1, "Ville requise"),
  years_experience: z.number().int().min(0).max(60),
  availability:     z.enum(["immediately","within_1_month","within_3_months","not_looking"]),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  candidate: Candidate;
  allTags: SkillTag[];
  selectedTagIds: string[];
}

export function ProfileForm({ candidate, allTags, selectedTagIds: initial }: Props) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(initial));
  const [saving, setSaving] = useState(false);

  const { register, control, handleSubmit, formState: { errors } } =
    useForm<FormValues>({
      resolver: zodResolver(schema),
      defaultValues: {
        city:             candidate.city,
        years_experience: candidate.years_experience ?? 0,
        availability:     candidate.availability,
      },
    });

  function toggleSkill(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 15) next.add(id);
      return next;
    });
  }

  async function onSubmit(values: FormValues) {
    setSaving(true);
    const res = await fetch("/api/v1/candidates/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...values, skill_tag_ids: Array.from(selectedIds) }),
    });
    setSaving(false);
    if (res.ok) {
      toast.success("Profil mis à jour");
      router.refresh();
    } else {
      toast.error("Erreur lors de la sauvegarde");
    }
  }

  // Group tags by category
  const grouped = allTags.reduce<Record<string, SkillTag[]>>((acc, tag) => {
    (acc[tag.category] ??= []).push(tag);
    return acc;
  }, {});

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic info */}
      <Card>
        <CardHeader><CardTitle>Informations personnelles</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="city">Ville</Label>
            <Controller name="city" control={control} render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger id="city"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CITIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            )} />
            {errors.city && <p className="mt-1 text-xs text-destructive">{errors.city.message}</p>}
          </div>

          <div>
            <Label htmlFor="years_experience">Années d&apos;expérience</Label>
            <Input id="years_experience" type="number" min={0} max={60} {...register("years_experience", { valueAsNumber: true })} />
          </div>

          <div>
            <Label htmlFor="availability">Disponibilité</Label>
            <Controller name="availability" control={control} render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger id="availability"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {AVAILABILITY.map((a) => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
                </SelectContent>
              </Select>
            )} />
          </div>
        </CardContent>
      </Card>

      {/* Skills */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Compétences</CardTitle>
            <Badge variant="secondary">{selectedIds.size} / 15</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(grouped).map(([cat, tags]) => (
            <div key={cat}>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {CATEGORY_LABELS[cat] ?? cat}
              </p>
              <div className="flex flex-wrap gap-3">
                {tags.map((tag) => (
                  <label key={tag.id} className="flex cursor-pointer items-center gap-2">
                    <Checkbox
                      checked={selectedIds.has(tag.id)}
                      onCheckedChange={() => toggleSkill(tag.id)}
                      disabled={!selectedIds.has(tag.id) && selectedIds.size >= 15}
                    />
                    <span className="text-sm">{tag.name}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Button type="submit" disabled={saving}>
        {saving ? "Sauvegarde..." : "Sauvegarder le profil"}
      </Button>
    </form>
  );
}
