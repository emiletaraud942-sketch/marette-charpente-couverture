import { redirect } from "next/navigation";
import { getCurrentEmploye } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { aujourdhui, formatJourCourt, joursDeLaSemaine } from "@/lib/date";
import type { Affectation, Chantier, Employe } from "@/lib/types/database";

export default async function PlanningPage() {
  const moi = await getCurrentEmploye();
  if (!moi) redirect("/login");
  if (moi.role === "ouvrier") redirect("/moi");

  const jours = joursDeLaSemaine();
  const premierJour = jours[0];
  const dernierJour = jours[jours.length - 1];

  const supabase = await createClient();
  const [{ data: employes }, { data: affectations }] = await Promise.all([
    supabase.from("employes").select("*").order("nom").returns<Employe[]>(),
    supabase
      .from("affectations")
      .select("*, chantier:chantiers(*)")
      .lte("date_debut", dernierJour)
      .or(`date_fin.is.null,date_fin.gte.${premierJour}`)
      .returns<(Affectation & { chantier: Chantier })[]>(),
  ]);

  function chantierDuJour(employeId: string, jour: string) {
    return (affectations ?? []).find(
      (a) =>
        a.employe_id === employeId &&
        a.date_debut <= jour &&
        (!a.date_fin || a.date_fin >= jour),
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="mb-6 text-xl font-semibold">Planning de la semaine</h1>

      <div className="overflow-x-auto rounded border bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-neutral-50">
              <th className="px-3 py-2 text-left">Employé</th>
              {jours.map((jour) => (
                <th key={jour} className="px-3 py-2 text-left capitalize">
                  {formatJourCourt(jour)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(employes ?? []).map((employe) => (
              <tr key={employe.id} className="border-b last:border-0">
                <td className="whitespace-nowrap px-3 py-2 font-medium">
                  {employe.prenom} {employe.nom}
                </td>
                {jours.map((jour) => {
                  const aff = chantierDuJour(employe.id, jour);
                  return (
                    <td key={jour} className="px-3 py-2 text-neutral-600">
                      {aff ? aff.chantier.nom : ""}
                    </td>
                  );
                })}
              </tr>
            ))}
            {(employes ?? []).length === 0 ? (
              <tr>
                <td colSpan={8} className="px-3 py-4 text-center text-neutral-500">
                  Aucun employé enregistré.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-sm text-neutral-500">
        Pour affecter un employé, ouvrez la fiche du chantier concerné.
      </p>

      <section className="mt-6 rounded border bg-white p-4">
        <h2 className="mb-3 text-sm font-medium text-neutral-500">Disponibles aujourd&apos;hui</h2>
        <div className="flex flex-wrap gap-2">
          {(employes ?? [])
            .filter((e) => e.statut === "actif" && !chantierDuJour(e.id, aujourdhui()))
            .map((e) => (
              <span key={e.id} className="rounded-full bg-emerald-100 px-3 py-1 text-sm text-emerald-800">
                {e.prenom} {e.nom}
              </span>
            ))}
          {(employes ?? []).filter((e) => e.statut === "actif" && !chantierDuJour(e.id, aujourdhui()))
            .length === 0 ? (
            <p className="text-sm text-neutral-500">Tout le monde est affecté aujourd&apos;hui.</p>
          ) : null}
        </div>
      </section>
    </main>
  );
}
