"use client";

import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Database } from "@/types/database";

type SkillTag = Pick<Database["public"]["Tables"]["skill_tags"]["Row"], "id" | "name">;
type ContractType = Database["public"]["Tables"]["job_postings"]["Row"]["contract_type"];

const CONTRACT_TYPES: ContractType[] = ["CDI", "CDD", "Interim", "Stage", "Freelance"];

const CITIES = ["Tanger","Kénitra","Casablanca","Jorf Lasfar","Rabat","Fès","Marrakech","Agadir","Autre"] as const;

const schema = z.object({
  title:          z.string().min(2, "Intitulé requis"),
  city:           z.string().min(1, "Ville requise"),
  contract_type:  z.enum(["CDI", "CDD", "Interim", "Stage", "Freelance"]),
  description_fr: z.string().min(50, "Description requise (min. 50 caractères)").max(5000),
  role_family_id: z.string().optional(),
  salary_min:     z.number().int().min(0).max(999999).optional(),
  salary_max:     z.number().int().min(0).max(999999).optional(),
});

type FormValues = z.infer<typeof schema>;

export function JobForm({ roleFamilies }: { roleFamilies: SkillTag[] }) {
  const router = useRouter();
  const { register, control, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    const res = await fetch("/api/v1/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...values,
        role_family_id: values.role_family_id || null,
        salary_min: values.salary_min ?? null,
        salary_max: values.salary_max ?? null,
      }),
    });

    if (res.ok) {
      const { data } = await res.json();
      toast.success("Offre créée — procédez au paiement pour la publier");
      router.push(`/offres/${data.job.id}/paiement`);
    } else {
      const json = await res.json().catch(() => ({}));
      toast.error(json.error ?? "Erreur lors de la création");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Informations principales</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Intitulé du poste</Label>
            <Input id="title" placeholder="Technicien câblage automobile" {...register("title")} />
            {errors.title && <p className="mt-1 text-xs text-destructive">{errors.title.message}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="city">Ville</Label>
              <Controller name="city" control={control} render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value ?? ""}>
                  <SelectTrigger id="city"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent>
                    {CITIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              )} />
              {errors.city && <p className="mt-1 text-xs text-destructive">{errors.city.message}</p>}
            </div>

            <div>
              <Label htmlFor="contract_type">Type de contrat</Label>
              <Controller name="contract_type" control={control} render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value ?? ""}>
                  <SelectTrigger id="contract_type"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent>
                    {CONTRACT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              )} />
              {errors.contract_type && <p className="mt-1 text-xs text-destructive">{errors.contract_type.message}</p>}
            </div>

            <div>
              <Label htmlFor="role_family_id">Famille de rôles <span className="text-muted-foreground">(optionnel)</span></Label>
              <Controller name="role_family_id" control={control} render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value ?? ""}>
                  <SelectTrigger id="role_family_id"><SelectValue placeholder="Aucune" /></SelectTrigger>
                  <SelectContent>
                    {roleFamilies.map((rf) => <SelectItem key={rf.id} value={rf.id}>{rf.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              )} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="salary_min">Salaire min. MAD/mois <span className="text-muted-foreground">(optionnel)</span></Label>
              <Input
                id="salary_min"
                type="number"
                min={0}
                placeholder="4000"
                {...register("salary_min", { valueAsNumber: true, setValueAs: (v) => v === "" ? undefined : Number(v) })}
              />
            </div>
            <div>
              <Label htmlFor="salary_max">Salaire max. MAD/mois <span className="text-muted-foreground">(optionnel)</span></Label>
              <Input
                id="salary_max"
                type="number"
                min={0}
                placeholder="8000"
                {...register("salary_max", { valueAsNumber: true, setValueAs: (v) => v === "" ? undefined : Number(v) })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Description du poste</CardTitle></CardHeader>
        <CardContent>
          <Label htmlFor="description_fr">Description (français)</Label>
          <Textarea
            id="description_fr"
            rows={10}
            placeholder="Décrivez les missions, le profil recherché, les avantages..."
            {...register("description_fr")}
          />
          {errors.description_fr && <p className="mt-1 text-xs text-destructive">{errors.description_fr.message}</p>}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>Annuler</Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Création..." : "Créer l'offre →"}
        </Button>
      </div>
    </form>
  );
}
