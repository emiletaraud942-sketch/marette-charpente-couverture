"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { getCurrentEmploye } from "@/lib/auth";

export async function creerProduit(formData: FormData) {
  const moi = await getCurrentEmploye();
  if (moi?.role !== "admin") throw new Error("Réservé à l'administrateur");

  const prix = String(formData.get("prix_indicatif") ?? "");
  const supabase = await createClient();
  const { error } = await supabase.from("produits_bois").insert({
    nom: String(formData.get("nom") ?? ""),
    description: String(formData.get("description") ?? "") || null,
    prix_indicatif: prix ? Number(prix) : null,
    unite: String(formData.get("unite") ?? "unité"),
  });
  if (error) throw new Error(error.message);

  revalidatePath("/catalogue");
  revalidatePath("/boutique");
  redirect("/catalogue");
}

export async function changerDisponibilite(produitId: string, disponible: boolean) {
  const moi = await getCurrentEmploye();
  if (moi?.role !== "admin") throw new Error("Réservé à l'administrateur");

  const supabase = await createClient();
  await supabase.from("produits_bois").update({ disponible }).eq("id", produitId);

  revalidatePath("/catalogue");
  revalidatePath("/boutique");
}

/** Formulaire public de demande de devis — accessible sans connexion. */
export async function deposerDemandeDevis(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("demandes_devis").insert({
    nom_client: String(formData.get("nom_client") ?? ""),
    telephone_client: String(formData.get("telephone_client") ?? ""),
    email_client: String(formData.get("email_client") ?? "") || null,
    produit_id: String(formData.get("produit_id") ?? "") || null,
    quantite: String(formData.get("quantite") ?? "") || null,
    message: String(formData.get("message") ?? "") || null,
  });
  if (error) throw new Error(error.message);

  redirect("/boutique/merci");
}

/** Résume/catégorise une demande de devis avec Claude (nécessite ANTHROPIC_API_KEY). */
export async function resumerDevisAvecIA(devisId: string) {
  const moi = await getCurrentEmploye();
  if (moi?.role !== "admin") throw new Error("Réservé à l'administrateur");

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Clé API IA non configurée — ajoutez ANTHROPIC_API_KEY dans les variables d'environnement.",
    );
  }

  const supabase = await createClient();
  const { data: devis } = await supabase
    .from("demandes_devis")
    .select("*, produit:produits_bois(*)")
    .eq("id", devisId)
    .maybeSingle();
  if (!devis) throw new Error("Demande introuvable");

  const anthropic = new Anthropic({ apiKey });
  const reponse = await anthropic.messages.create({
    model: "claude-sonnet-5-5",
    max_tokens: 200,
    messages: [
      {
        role: "user",
        content:
          "Résume en une phrase cette demande de devis pour une entreprise de vente de bois, " +
          "et indique son niveau d'urgence (faible/normal/élevé). Réponds en français, " +
          "sans préambule.\n\n" +
          `Produit demandé : ${devis.produit?.nom ?? "hors catalogue"}\n` +
          `Quantité : ${devis.quantite ?? "non précisée"}\n` +
          `Message du client : ${devis.message ?? "aucun"}`,
      },
    ],
  });

  const texte = reponse.content.find((bloc) => bloc.type === "text")?.text ?? "";
  await supabase.from("demandes_devis").update({ resume_ia: texte }).eq("id", devisId);
  revalidatePath("/devis");
}

export async function marquerDevisTraite(devisId: string) {
  const moi = await getCurrentEmploye();
  if (moi?.role !== "admin") throw new Error("Réservé à l'administrateur");

  const supabase = await createClient();
  await supabase.from("demandes_devis").update({ statut: "traitee" }).eq("id", devisId);
  revalidatePath("/devis");
}
