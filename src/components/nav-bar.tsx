import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Employe } from "@/lib/types/database";

async function seDeconnecter() {
  "use server";
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export default function NavBar({ employe }: { employe: Employe }) {
  const liensChefChantier = [
    { href: "/", label: "Tableau du jour" },
    { href: "/planning", label: "Planning" },
    { href: "/employes", label: "Employés" },
    { href: "/chantiers", label: "Chantiers" },
    { href: "/stock", label: "Stock" },
  ];
  const liensAdmin = [
    ...liensChefChantier,
    { href: "/alertes", label: "Alertes" },
    { href: "/catalogue", label: "Catalogue" },
    { href: "/devis", label: "Devis" },
  ];
  const liensOuvrier = [{ href: "/moi", label: "Mon espace" }];

  const liens =
    employe.role === "ouvrier" ? liensOuvrier : employe.role === "admin" ? liensAdmin : liensChefChantier;

  return (
    <nav className="flex items-center justify-between border-b bg-white px-4 py-3">
      <div className="flex gap-4 text-sm">
        {liens.map((lien) => (
          <Link key={lien.href} href={lien.href} className="font-medium hover:underline">
            {lien.label}
          </Link>
        ))}
      </div>
      <div className="flex items-center gap-3 text-sm text-neutral-600">
        <span>
          {employe.prenom} {employe.nom}
        </span>
        <form action={seDeconnecter}>
          <button type="submit" className="hover:underline">
            Déconnexion
          </button>
        </form>
      </div>
    </nav>
  );
}
