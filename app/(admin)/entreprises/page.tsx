import { createServiceClient } from "@/lib/supabase/server";
import { CompanyActions } from "./company-actions";
import type { Database } from "@/types/database";

type Company = Database["public"]["Tables"]["companies"]["Row"];
type Status = "pending" | "verified";

export default async function EntreprisesAdminPage() {
  const supabase = await createServiceClient();

  const { data } = await supabase
    .from("companies")
    .select("id, name, city, website, verified_at, created_at")
    .order("created_at", { ascending: false });

  const companies = (data ?? []) as Company[];
  const pending  = companies.filter((c) => !c.verified_at);
  const verified = companies.filter((c) => !!c.verified_at);

  const sections: { label: string; items: typeof pending; status: Status }[] = [
    { label: "En attente de vérification", items: pending,  status: "pending"  },
    { label: "Vérifiées",                  items: verified, status: "verified" },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Entreprises</h1>

      {sections.map(({ label, items, status }) => (
        <section key={status}>
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">
            {label} ({items.length})
          </h2>

          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune entreprise.</p>
          ) : (
            <div className="overflow-hidden rounded-lg border bg-background">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium">Entreprise</th>
                    <th className="px-4 py-2 text-left font-medium">Ville</th>
                    <th className="px-4 py-2 text-left font-medium">Site web</th>
                    <th className="px-4 py-2 text-left font-medium">Inscrite le</th>
                    <th className="px-4 py-2 text-left font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {items.map((company) => (
                    <tr key={company.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{company.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{company.city}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {company.website ? (
                          <a href={company.website} target="_blank" rel="noopener noreferrer"
                             className="underline underline-offset-4">
                            {company.website.replace(/^https?:\/\//, "")}
                          </a>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(company.created_at).toLocaleDateString("fr-MA")}
                      </td>
                      <td className="px-4 py-3">
                        {status === "pending" && (
                          <CompanyActions companyId={company.id} />
                        )}
                        {status === "verified" && (
                          <span className="text-xs text-green-600">✓ Vérifiée</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
