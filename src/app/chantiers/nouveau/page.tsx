import { redirect } from "next/navigation";
import { getCurrentEmploye } from "@/lib/auth";
import { creerChantier } from "@/lib/actions/chantiers";

export default async function NouveauChantierPage() {
  const moi = await getCurrentEmploye();
  if (moi?.role !== "admin") redirect("/chantiers");

  return (
    <main className="mx-auto max-w-md px-4 py-6">
      <h1 className="mb-6 text-xl font-semibold">Nouveau chantier</h1>

      <form action={creerChantier} className="flex flex-col gap-3">
        <input name="nom" required placeholder="Nom du chantier" className="rounded border px-3 py-2" />
        <input name="client" placeholder="Client" className="rounded border px-3 py-2" />
        <input name="adresse" placeholder="Adresse" className="rounded border px-3 py-2" />
        <label className="text-sm text-neutral-500">
          Début
          <input name="date_debut" type="date" className="mt-1 w-full rounded border px-3 py-2" />
        </label>
        <label className="text-sm text-neutral-500">
          Fin prévue
          <input name="date_fin" type="date" className="mt-1 w-full rounded border px-3 py-2" />
        </label>
        <button type="submit" className="rounded bg-neutral-900 px-3 py-2 text-white">
          Créer
        </button>
      </form>
    </main>
  );
}
