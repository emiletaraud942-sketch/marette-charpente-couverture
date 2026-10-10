import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { ProduitBois } from "@/lib/types/database";

export default async function BoutiquePage() {
  const supabase = await createClient();
  const { data: produits } = await supabase
    .from("produits_bois")
    .select("*")
    .eq("disponible", true)
    .order("nom")
    .returns<ProduitBois[]>();

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-semibold">Notre catalogue</h1>
      <p className="mb-6 text-neutral-600">
        Demandez un devis en ligne, nous vous rappelons pour confirmer. Paiement par carte ou en
        espèces à la commande ou à la livraison (paiement en ligne à venir).
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {(produits ?? []).map((produit) => (
          <div key={produit.id} className="flex flex-col justify-between rounded border p-4">
            <div>
              <h2 className="font-medium">{produit.nom}</h2>
              {produit.description ? (
                <p className="mt-1 text-sm text-neutral-600">{produit.description}</p>
              ) : null}
              {produit.prix_indicatif !== null ? (
                <p className="mt-2 text-sm text-neutral-500">
                  À partir de {produit.prix_indicatif} € / {produit.unite}
                </p>
              ) : null}
            </div>
            <Link
              href={`/boutique/devis?produit=${produit.id}`}
              className="mt-4 rounded bg-neutral-900 px-3 py-2 text-center text-sm text-white"
            >
              Demander un devis
            </Link>
          </div>
        ))}
        {(produits ?? []).length === 0 ? (
          <p className="text-sm text-neutral-500">
            Catalogue en cours de préparation — contactez-nous directement.
          </p>
        ) : null}
      </div>

      <div className="mt-8 rounded border bg-neutral-50 p-4 text-center">
        <p className="mb-2 text-sm text-neutral-600">Un besoin particulier, hors catalogue ?</p>
        <Link href="/boutique/devis" className="text-sm font-medium underline">
          Faites-nous votre demande
        </Link>
      </div>
    </main>
  );
}
