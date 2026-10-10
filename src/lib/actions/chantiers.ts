"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentEmploye } from "@/lib/auth";

export async function creerChantier(formData: FormData) {
  const moi = await getCurrentEmploye();
  if (moi?.role !== "admin") throw new Error("Réservé à l'administrateur");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("chantiers")
    .insert({
      nom: String(formData.get("nom") ?? ""),
      client: String(formData.get("client") ?? "") || null,
      adresse: String(formData.get("adresse") ?? "") || null,
      date_debut: String(formData.get("date_debut") ?? "") || null,
      date_fin: String(formData.get("date_fin") ?? "") || null,
    })
    .select("id")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Création impossible");

  revalidatePath("/chantiers");
  redirect(`/chantiers/${data.id}`);
}

export async function modifierStatutChantier(chantierId: string, statut: string) {
  const supabase = await createClient();
  await supabase.from("chantiers").update({ statut }).eq("id", chantierId);
  revalidatePath(`/chantiers/${chantierId}`);
  revalidatePath("/chantiers");
}

export async function affecterEmploye(chantierId: string, formData: FormData) {
  const supabase = await createClient();
  await supabase.from("affectations").insert({
    chantier_id: chantierId,
    employe_id: String(formData.get("employe_id") ?? ""),
    date_debut: String(formData.get("date_debut") ?? ""),
    date_fin: String(formData.get("date_fin") ?? "") || null,
    role_sur_chantier: String(formData.get("role_sur_chantier") ?? "") || null,
  });

  revalidatePath(`/chantiers/${chantierId}`);
  revalidatePath("/");
  revalidatePath("/planning");
}

export async function retirerAffectation(chantierId: string, affectationId: string) {
  const supabase = await createClient();
  await supabase.from("affectations").delete().eq("id", affectationId);
  revalidatePath(`/chantiers/${chantierId}`);
  revalidatePath("/");
  revalidatePath("/planning");
}
