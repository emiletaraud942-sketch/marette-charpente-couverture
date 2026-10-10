import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentEmploye } from "@/lib/auth";
import { aujourdhui } from "@/lib/date";
import type { Affectation, Chantier, Employe, Pointage } from "@/lib/types/database";

const STATUT_LABEL: Record<Employe["statut"], string> = {
  actif: "Actif",
  conge: "Congé",
  arret: "Arrêt",
  inactif: "Inactif",
};

const STATUT_COULEUR: Record<Employe["statut"], string> = {
  actif: "bg-green-100 text-green-800",
  conge: "bg-blue-100 text-blue-800",
  arret: "bg-red-100 text-red-800",
  inactif: "bg-neutral-100 text-neutral-600",
};

export default async function TableauDuJourPage() {
  const moi = await getCurrentEmploye();
  if (!moi) redirect("/login");
  if (moi.role === "ouvrier") redirect("/moi");

  const supabase = await createClient();
  const today = aujourdhui();

  const [{ data: employes }, { data: affectations }, { data: pointagesOuverts }] =
    await Promise.all([
      supabase.from("employes").select("*").order("nom"),
      supabase
        .from("affectations")
        .select("*, chantier:chantiers(*)")
        .lte("date_debut", today)
        .or(`date_fin.is.null,date_fin.gte.${today}`)
        .returns<(Affectation & { chantier: Chantier })[]>(),
      supabase.from("pointages").select("*").is("heure_sortie", null).returns<Pointage[]>(),
    ]);

  const affectationParEmploye = new Map<string, Affectation & { chantier: Chantier }>();
  for (const aff of affectations ?? []) {
    affectationParEmploye.set(aff.employe_id, aff);
  }
  const pointageParEmploye = new Map<string, Pointage>();
  for (const p of pointagesOuverts ?? []) {
    pointageParEmploye.set(p.employe_id, p);
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="mb-1 text-xl font-semibold">Tableau du jour</h1>
      <p className="mb-6 text-sm text-neutral-500">
        Qui est où, qui fait quoi — {new Date().toLocaleDateString("fr-FR", {
          weekday: "long",
          day: "numeric",
          month: "long",
        })}
      </p>

      <div className="flex flex-col gap-2">
        {(employes ?? []).map((employe: Employe) => {
          const affectation = affectationParEmploye.get(employe.id);
          const pointage = pointageParEmploye.get(employe.id);

          return (
            <div
              key={employe.id}
              className="flex items-center justify-between rounded border bg-white px-4 py-3"
            >
              <div>
                <p className="font-medium">
                  {employe.prenom} {employe.nom}
                </p>
                <p className="text-sm text-neutral-500">
                  {affectation ? affectation.chantier.nom : "Aucun chantier affecté"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {pointage ? (
                  <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs text-emerald-800">
                    Pointé depuis{" "}
                    {new Date(pointage.heure_entree).toLocaleTimeString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                ) : null}
                <span
                  className={`rounded-full px-2 py-1 text-xs ${STATUT_COULEUR[employe.statut]}`}
                >
                  {STATUT_LABEL[employe.statut]}
                </span>
              </div>
            </div>
          );
        })}

        {(employes ?? []).length === 0 ? (
          <p className="text-sm text-neutral-500">Aucun employé enregistré pour le moment.</p>
        ) : null}
      </div>
    </main>
  );
}
