import { redirect } from "next/navigation";
import { getCurrentEmploye } from "@/lib/auth";
import { creerProduit } from "@/lib/actions/boutique";

export default async function NouveauProduitPage() {
  const moi = await getCurrentEmploye();
  if (moi?.role !== "admin") redirect("/catalogue");

  return (
    <main className="mx-auto max-w-md px-4 py-6">
      <h1 className="mb-6 text-xl font-semibold">Nouveau produit (vitrine bois)</h1>

      <form action={creerProduit} className="flex flex-col gap-3">
        <input name="nom" required placeholder="Nom du produit" className="rounded border px-3 py-2" />
        <textarea name="description" placeholder="Description" className="rounded border px-3 py-2" rows={3} />
        <label className="text-sm text-neutral-500">
          Prix indicatif € (optionnel)
          <input name="prix_indicatif" type="number" step="0.01" className="mt-1 w-full rounded border px-3 py-2" />
        </label>
        <input name="unite" defaultValue="unité" placeholder="Unité (m³, ml, kg…)" className="rounded border px-3 py-2" />
        <button type="submit" className="rounded bg-neutral-900 px-3 py-2 text-white">
          Créer
        </button>
      </form>
    </main>
  );
}
