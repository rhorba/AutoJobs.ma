"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  email:    z.string().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

type FormValues = z.infer<typeof schema>;

const ROLE_HOME: Record<string, string> = {
  employer:  "/tableau-de-bord",
  candidate: "/profil",
  admin:     "/admin/entreprises",
};

export default function ConnexionPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    const supabase = createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email:    values.email,
      password: values.password,
    });

    if (error) {
      // Generic message — never reveal which field is wrong
      if (error.message.toLowerCase().includes("email not confirmed")) {
        setServerError("Veuillez vérifier votre email avant de vous connecter.");
      } else {
        setServerError("Identifiants incorrects. Vérifiez votre email et mot de passe.");
      }
      return;
    }

    // Fetch role from profiles table to redirect correctly
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    const role = profile?.role ?? "candidate";
    router.push(ROLE_HOME[role] ?? "/profil");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Se connecter</CardTitle>
          <CardDescription>
            Accédez à votre espace AutoJobs.ma
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="vous@email.com"
                autoComplete="email"
                {...register("email")}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                {...register("password")}
              />
              {errors.password && (
                <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            {serverError && (
              <p className="text-sm text-destructive">{serverError}</p>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Connexion..." : "Se connecter"}
            </Button>

            <div className="space-y-2 text-center text-sm text-muted-foreground">
              <p>
                Pas encore de compte ?{" "}
                <Link href="/inscription/candidat" className="underline underline-offset-4">
                  Candidat
                </Link>
                {" · "}
                <Link href="/inscription/employeur" className="underline underline-offset-4">
                  Recruteur
                </Link>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
