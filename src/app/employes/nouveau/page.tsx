import { redirect } from "next/navigation";
import { getCurrentEmploye } from "@/lib/auth";
import { creerEmploye } from "@/lib/actions/employes";

export default async function NouvelEmployePage() {
  const moi = await getCurrentEmploye();
  if (moi?.role !== "admin") redirect("/employes");

  return (
    <main className="mx-auto max-w-md px-4 py-6">
      <h1 className="mb-6 text-xl font-semibold">Nouvel employé</h1>

      <form action={creerEmploye} className="flex flex-col gap-3">
        <input name="prenom" required placeholder="Prénom" className="rounded border px-3 py-2" />
        <input name="nom" required placeholder="Nom" className="rounded border px-3 py-2" />
        <input
          name="telephone"
          placeholder="Téléphone"
          className="rounded border px-3 py-2"
        />
        <input
          name="email"
          type="email"
          required
          placeholder="Email (pour la connexion)"
          className="rounded border px-3 py-2"
        />
        <select name="role" className="rounded border px-3 py-2" defaultValue="ouvrier">
          <option value="ouvrier">Ouvrier</option>
          <option value="chef_chantier">Chef de chantier</option>
          <option value="admin">Admin / RH</option>
        </select>
        <button type="submit" className="rounded bg-neutral-900 px-3 py-2 text-white">
          Créer le compte
        </button>
      </form>
    </main>
  );
}
