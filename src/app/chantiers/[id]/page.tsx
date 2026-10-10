import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentEmploye } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/date";
import { affecterEmploye, modifierStatutChantier, retirerAffectation } from "@/lib/actions/chantiers";
import type { Affectation, Chantier, Employe } from "@/lib/types/database";

export default async function FicheChantierPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const moi = await getCurrentEmploye();
  if (!moi) redirect("/login");

  const supabase = await createClient();
  const [{ data: chantier }, { data: equipe }, { data: employes }] = await Promise.all([
    supabase.from("chantiers").select("*").eq("id", id).maybeSingle<Chantier>(),
    supabase
      .from("affectations")
      .select("*, employe:employes(*)")
      .eq("chantier_id", id)
      .order("date_debut")
      .returns<(Affectation & { employe: Employe })[]>(),
    moi.role === "admin"
      ? supabase.from("employes").select("*").order("nom").returns<Employe[]>()
      : Promise.resolve({ data: [] as Employe[] }),
  ]);

  if (!chantier) {
    return <main className="mx-auto max-w-2xl px-4 py-6">Chantier introuvable.</main>;
  }

  const estAdmin = moi.role === "admin";

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-1 flex items-center justify-between">
        <h1 className="text-xl font-semibold">{chantier.nom}</h1>
        {estAdmin ? (
          <form
            action={async (formData) =>
              modifierStatutChantier(chantier.id, String(formData.get("statut")))
            }
            className="flex items-center gap-2"
          >
            <select name="statut" defaultValue={chantier.statut} className="rounded border px-2 py-1 text-sm">
              <option value="a_venir">À venir</option>
              <option value="en_cours">En cours</option>
              <option value="termine">Terminé</option>
            </select>
            <button type="submit" className="rounded border px-2 py-1 text-sm hover:bg-neutral-50">
              Mettre à jour
            </button>
          </form>
        ) : null}
      </div>
      <p className="mb-6 text-sm text-neutral-500">
        {chantier.client ?? "—"} · {chantier.adresse ?? "—"} ·{" "}
        {formatDate(chantier.date_debut)} → {formatDate(chantier.date_fin)}
      </p>

      <section className="rounded border bg-white p-4">
        <h2 className="mb-3 text-sm font-medium text-neutral-500">Équipe affectée</h2>
        <div className="mb-4 flex flex-col gap-2">
          {(equipe ?? []).map((aff) => (
            <div key={aff.id} className="flex items-center justify-between text-sm">
              <Link href={`/employes/${aff.employe.id}`} className="hover:underline">
                {aff.employe.prenom} {aff.employe.nom}
                {aff.role_sur_chantier ? ` — ${aff.role_sur_chantier}` : ""}
              </Link>
              <div className="flex items-center gap-2 text-neutral-500">
                <span>
                  {formatDate(aff.date_debut)} → {formatDate(aff.date_fin)}
                </span>
                {estAdmin ? (
                  <form action={async () => retirerAffectation(chantier.id, aff.id)}>
                    <button type="submit" className="text-red-600 hover:underline">
                      Retirer
                    </button>
                  </form>
                ) : null}
              </div>
            </div>
          ))}
          {(equipe ?? []).length === 0 ? (
            <p className="text-sm text-neutral-500">Personne affecté pour le moment.</p>
          ) : null}
        </div>

        {estAdmin ? (
          <form
            action={async (formData) => affecterEmploye(chantier.id, formData)}
            className="flex flex-wrap gap-2 border-t pt-3"
          >
            <select name="employe_id" required className="rounded border px-2 py-1 text-sm">
              <option value="">Employé…</option>
              {(employes ?? []).map((e) => (
                <option key={e.id} value={e.id}>
                  {e.prenom} {e.nom}
                </option>
              ))}
            </select>
            <input name="role_sur_chantier" placeholder="Rôle (optionnel)" className="rounded border px-2 py-1 text-sm" />
            <input name="date_debut" type="date" required className="rounded border px-2 py-1 text-sm" />
            <input name="date_fin" type="date" className="rounded border px-2 py-1 text-sm" />
            <button type="submit" className="rounded bg-neutral-900 px-3 py-1 text-sm text-white">
              Affecter
            </button>
          </form>
        ) : null}
      </section>
    </main>
  );
}
