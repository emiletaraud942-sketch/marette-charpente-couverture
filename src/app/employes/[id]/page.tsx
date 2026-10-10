import { redirect } from "next/navigation";
import { getCurrentEmploye } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate, joursAvant } from "@/lib/date";
import { ajouterHabilitation, modifierEmploye } from "@/lib/actions/employes";
import type { Affectation, Chantier, Employe, Habilitation } from "@/lib/types/database";

export default async function FicheEmployePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ motDePasseTemporaire?: string }>;
}) {
  const { id } = await params;
  const { motDePasseTemporaire } = await searchParams;
  const moi = await getCurrentEmploye();
  if (!moi) redirect("/login");

  const supabase = await createClient();
  const [{ data: employe }, { data: habilitations }, { data: historique }] = await Promise.all([
    supabase.from("employes").select("*").eq("id", id).maybeSingle<Employe>(),
    supabase
      .from("habilitations")
      .select("*")
      .eq("employe_id", id)
      .order("date_expiration")
      .returns<Habilitation[]>(),
    supabase
      .from("affectations")
      .select("*, chantier:chantiers(*)")
      .eq("employe_id", id)
      .order("date_debut", { ascending: false })
      .returns<(Affectation & { chantier: Chantier })[]>(),
  ]);

  if (!employe) {
    return <main className="mx-auto max-w-2xl px-4 py-6">Employé introuvable.</main>;
  }

  const estAdmin = moi.role === "admin";

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="mb-1 text-xl font-semibold">
        {employe.prenom} {employe.nom}
      </h1>
      <p className="mb-6 text-sm text-neutral-500">{employe.telephone ?? "Pas de téléphone"}</p>

      {motDePasseTemporaire ? (
        <div className="mb-6 rounded border border-amber-300 bg-amber-50 p-4 text-sm">
          Compte créé. Mot de passe temporaire à communiquer à l&apos;employé :{" "}
          <strong>{motDePasseTemporaire}</strong>
          <br />
          Il devra le changer dès sa première connexion. Ce message ne sera plus affiché après.
        </div>
      ) : null}

      {estAdmin ? (
        <form
          action={async (formData) => modifierEmploye(employe.id, formData)}
          className="mb-8 flex flex-col gap-3 rounded border bg-white p-4"
        >
          <h2 className="text-sm font-medium text-neutral-500">Informations</h2>
          <input name="prenom" defaultValue={employe.prenom} className="rounded border px-3 py-2" />
          <input name="nom" defaultValue={employe.nom} className="rounded border px-3 py-2" />
          <input
            name="telephone"
            defaultValue={employe.telephone ?? ""}
            className="rounded border px-3 py-2"
          />
          <select name="role" defaultValue={employe.role} className="rounded border px-3 py-2">
            <option value="ouvrier">Ouvrier</option>
            <option value="chef_chantier">Chef de chantier</option>
            <option value="admin">Admin / RH</option>
          </select>
          <select name="statut" defaultValue={employe.statut} className="rounded border px-3 py-2">
            <option value="actif">Actif</option>
            <option value="conge">Congé</option>
            <option value="arret">Arrêt</option>
            <option value="inactif">Inactif</option>
          </select>
          <button type="submit" className="rounded bg-neutral-900 px-3 py-2 text-white">
            Enregistrer
          </button>
        </form>
      ) : null}

      <section className="mb-8 rounded border bg-white p-4">
        <h2 className="mb-3 text-sm font-medium text-neutral-500">Habilitations</h2>
        <div className="mb-4 flex flex-col gap-2">
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

        {estAdmin ? (
          <form
            action={async (formData) => ajouterHabilitation(employe.id, formData)}
            className="flex flex-wrap gap-2 border-t pt-3"
          >
            <select name="type" className="rounded border px-2 py-1 text-sm" defaultValue="autre">
              <option value="caces">CACES</option>
              <option value="habilitation_electrique">Habilitation électrique</option>
              <option value="travail_hauteur">Travail en hauteur</option>
              <option value="visite_medicale">Visite médicale</option>
              <option value="autre">Autre</option>
            </select>
            <input
              name="libelle"
              placeholder="Libellé (optionnel)"
              className="rounded border px-2 py-1 text-sm"
            />
            <input
              name="date_obtention"
              type="date"
              className="rounded border px-2 py-1 text-sm"
            />
            <input
              name="date_expiration"
              type="date"
              className="rounded border px-2 py-1 text-sm"
            />
            <button type="submit" className="rounded bg-neutral-900 px-3 py-1 text-sm text-white">
              Ajouter
            </button>
          </form>
        ) : null}
      </section>

      <section className="rounded border bg-white p-4">
        <h2 className="mb-3 text-sm font-medium text-neutral-500">Historique chantiers</h2>
        <div className="flex flex-col gap-2">
          {(historique ?? []).map((aff) => (
            <div key={aff.id} className="flex items-center justify-between text-sm">
              <span>{aff.chantier.nom}</span>
              <span className="text-neutral-500">
                {formatDate(aff.date_debut)} → {formatDate(aff.date_fin)}
              </span>
            </div>
          ))}
          {(historique ?? []).length === 0 ? (
            <p className="text-sm text-neutral-500">Aucune affectation.</p>
          ) : null}
        </div>
      </section>
    </main>
  );
}
