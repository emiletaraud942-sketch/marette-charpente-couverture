import { redirect } from "next/navigation";
import { getCurrentEmploye } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { aujourdhui, formatDate, formatHeure, joursAvant } from "@/lib/date";
import { pointerEntree, pointerSortie } from "@/lib/actions/pointages";
import type { Affectation, Chantier, Habilitation, Pointage } from "@/lib/types/database";

export default async function MonEspacePage() {
  const moi = await getCurrentEmploye();
  if (!moi) redirect("/login");

  const supabase = await createClient();
  const today = aujourdhui();

  const [{ data: affectation }, { data: pointageOuvert }, { data: habilitations }] =
    await Promise.all([
      supabase
        .from("affectations")
        .select("*, chantier:chantiers(*)")
        .eq("employe_id", moi.id)
        .lte("date_debut", today)
        .or(`date_fin.is.null,date_fin.gte.${today}`)
        .maybeSingle<Affectation & { chantier: Chantier }>(),
      supabase
        .from("pointages")
        .select("*")
        .eq("employe_id", moi.id)
        .is("heure_sortie", null)
        .maybeSingle<Pointage>(),
      supabase
        .from("habilitations")
        .select("*")
        .eq("employe_id", moi.id)
        .returns<Habilitation[]>(),
    ]);

  return (
    <main className="mx-auto max-w-md px-4 py-6">
      <h1 className="mb-1 text-xl font-semibold">
        Bonjour {moi.prenom}
      </h1>
      <p className="mb-6 text-sm text-neutral-500">
        {new Date().toLocaleDateString("fr-FR", {
          weekday: "long",
          day: "numeric",
          month: "long",
        })}
      </p>

      <section className="mb-6 rounded border bg-white p-4">
        <h2 className="mb-2 text-sm font-medium text-neutral-500">Chantier du jour</h2>
        {affectation ? (
          <div>
            <p className="text-lg font-semibold">{affectation.chantier.nom}</p>
            <p className="text-sm text-neutral-500">{affectation.chantier.adresse}</p>
          </div>
        ) : (
          <p className="text-sm text-neutral-500">Aucun chantier affecté aujourd&apos;hui.</p>
        )}
      </section>

      <section className="mb-6 rounded border bg-white p-4">
        <h2 className="mb-3 text-sm font-medium text-neutral-500">Pointage</h2>
        {pointageOuvert ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm">
              Pointé depuis <strong>{formatHeure(pointageOuvert.heure_entree)}</strong>
            </p>
            <form action={async () => pointerSortie(pointageOuvert.id)}>
              <button
                type="submit"
                className="w-full rounded bg-red-600 px-4 py-3 font-medium text-white"
              >
                Pointer la sortie
              </button>
            </form>
          </div>
        ) : (
          <form action={async () => pointerEntree(affectation?.chantier_id ?? null)}>
            <button
              type="submit"
              className="w-full rounded bg-emerald-600 px-4 py-3 font-medium text-white"
            >
              Pointer l&apos;entrée
            </button>
          </form>
        )}
      </section>

      <section className="rounded border bg-white p-4">
        <h2 className="mb-3 text-sm font-medium text-neutral-500">Mes habilitations</h2>
        <div className="flex flex-col gap-2">
          {(habilitations ?? []).map((h) => {
            const jours = joursAvant(h.date_expiration);
            const couleur =
              jours === null
                ? "bg-neutral-100 text-neutral-600"
                : jours < 0
                  ? "bg-red-100 text-red-800"
                  : jours <= 30
                    ? "bg-orange-100 text-orange-800"
                    : "bg-green-100 text-green-800";

            return (
              <div key={h.id} className="flex items-center justify-between text-sm">
                <span>{h.libelle || h.type}</span>
                <span className={`rounded-full px-2 py-1 text-xs ${couleur}`}>
                  {h.date_expiration ? `Expire le ${formatDate(h.date_expiration)}` : "Sans échéance"}
                </span>
              </div>
            );
          })}
          {(habilitations ?? []).length === 0 ? (
            <p className="text-sm text-neutral-500">Aucune habilitation enregistrée.</p>
          ) : null}
        </div>
      </section>
    </main>
  );
}
