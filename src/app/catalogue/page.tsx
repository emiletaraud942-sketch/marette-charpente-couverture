import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentEmploye } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { changerDisponibilite } from "@/lib/actions/boutique";
import type { ProduitBois } from "@/lib/types/database";

export default async function CataloguePage() {
  const moi = await getCurrentEmploye();
  if (moi?.role !== "admin") redirect("/");

  const supabase = await createClient();
  const { data: produits } = await supabase
    .from("produits_bois")
    .select("*")
    .order("nom")
    .returns<ProduitBois[]>();

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Catalogue bois (vitrine publique)</h1>
        <Link href="/catalogue/nouveau" className="rounded bg-neutral-900 px-3 py-2 text-sm text-white">
          Nouveau produit
        </Link>
      </div>

      <div className="flex flex-col gap-2">
        {(produits ?? []).map((produit) => (
          <div key={produit.id} className="flex items-center justify-between rounded border bg-white px-4 py-3">
            <div>
              <p className="font-medium">{produit.nom}</p>
              <p className="text-sm text-neutral-500">
                {produit.prix_indicatif !== null ? `${produit.prix_indicatif} € / ${produit.unite}` : "Sans prix indicatif"}
              </p>
            </div>
            <form action={async () => changerDisponibilite(produit.id, !produit.disponible)}>
              <button
                type="submit"
                className={`rounded-full px-3 py-1 text-xs ${
                  produit.disponible ? "bg-green-100 text-green-800" : "bg-neutral-100 text-neutral-600"
                }`}
              >
                {produit.disponible ? "Visible sur la vitrine" : "Masqué"}
              </button>
            </form>
          </div>
        ))}
        {(produits ?? []).length === 0 ? (
          <p className="text-sm text-neutral-500">Aucun produit dans le catalogue.</p>
        ) : null}
      </div>

      <p className="mt-4 text-sm text-neutral-500">
        Vitrine publique : <a href="/boutique" className="underline">/boutique</a>
      </p>
    </main>
  );
}
