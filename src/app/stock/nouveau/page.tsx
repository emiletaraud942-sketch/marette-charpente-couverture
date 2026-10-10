import { redirect } from "next/navigation";
import { getCurrentEmploye } from "@/lib/auth";
import { creerMateriau } from "@/lib/actions/stock";

export default async function NouveauMateriauPage() {
  const moi = await getCurrentEmploye();
  if (moi?.role !== "admin") redirect("/stock");

  return (
    <main className="mx-auto max-w-md px-4 py-6">
      <h1 className="mb-6 text-xl font-semibold">Nouveau matériau</h1>

      <form action={creerMateriau} className="flex flex-col gap-3">
        <input name="nom" required placeholder="Nom du matériau" className="rounded border px-3 py-2" />
        <select name="categorie" defaultValue="bois" className="rounded border px-3 py-2">
          <option value="bois">Bois</option>
          <option value="quincaillerie">Quincaillerie</option>
          <option value="isolation">Isolation</option>
          <option value="couverture">Couverture</option>
          <option value="autre">Autre</option>
        </select>
        <input name="unite" defaultValue="unité" placeholder="Unité (m³, ml, kg…)" className="rounded border px-3 py-2" />
        <label className="text-sm text-neutral-500">
          Seuil d&apos;alerte (optionnel)
          <input
            name="seuil_alerte"
            type="number"
            step="0.01"
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </label>
        <button type="submit" className="rounded bg-neutral-900 px-3 py-2 text-white">
          Créer
        </button>
      </form>
    </main>
  );
}
