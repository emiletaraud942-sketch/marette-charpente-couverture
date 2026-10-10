"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createIsolatedAuthClient, genererMotDePasseTemporaire } from "@/lib/supabase/isolated-auth-client";
import { getCurrentEmploye } from "@/lib/auth";
import type { RoleEmploye } from "@/lib/types/database";

export async function creerEmploye(formData: FormData) {
  const moi = await getCurrentEmploye();
  if (moi?.role !== "admin") throw new Error("Réservé à l'administrateur");

  const email = String(formData.get("email") ?? "");
  const nom = String(formData.get("nom") ?? "");
  const prenom = String(formData.get("prenom") ?? "");
  const telephone = String(formData.get("telephone") ?? "") || null;
  const role = String(formData.get("role") ?? "ouvrier") as RoleEmploye;

  const motDePasseTemporaire = genererMotDePasseTemporaire();
  const authIsole = createIsolatedAuthClient();
  const { data: inscription, error: erreurInscription } = await authIsole.auth.signUp({
    email,
    password: motDePasseTemporaire,
  });
  if (erreurInscription || !inscription.user) {
    throw new Error(erreurInscription?.message ?? "Création du compte impossible");
  }

  const supabase = await createClient();
  const { error: erreurProfil } = await supabase.from("employes").insert({
    id: inscription.user.id,
    nom,
    prenom,
    telephone,
    role,
  });
  if (erreurProfil) throw new Error(erreurProfil.message);

  revalidatePath("/employes");
  redirect(`/employes/${inscription.user.id}?motDePasseTemporaire=${motDePasseTemporaire}`);
}

export async function modifierEmploye(employeId: string, formData: FormData) {
  const moi = await getCurrentEmploye();
  if (moi?.role !== "admin") throw new Error("Réservé à l'administrateur");

  const supabase = await createClient();
  await supabase
    .from("employes")
    .update({
      nom: String(formData.get("nom") ?? ""),
      prenom: String(formData.get("prenom") ?? ""),
      telephone: String(formData.get("telephone") ?? "") || null,
      role: String(formData.get("role") ?? "ouvrier"),
      statut: String(formData.get("statut") ?? "actif"),
    })
    .eq("id", employeId);

  revalidatePath(`/employes/${employeId}`);
  revalidatePath("/employes");
}

export async function ajouterHabilitation(employeId: string, formData: FormData) {
  const supabase = await createClient();
  await supabase.from("habilitations").insert({
    employe_id: employeId,
    type: String(formData.get("type") ?? "autre"),
    libelle: String(formData.get("libelle") ?? "") || null,
    date_obtention: String(formData.get("date_obtention") ?? "") || null,
    date_expiration: String(formData.get("date_expiration") ?? "") || null,
  });

  revalidatePath(`/employes/${employeId}`);
}
