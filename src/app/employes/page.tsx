import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentEmploye } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Employe } from "@/lib/types/database";

export default async function EmployesPage() {
  const moi = await getCurrentEmploye();
  if (!moi) redirect("/login");

  const supabase = await createClient();
  const { data: employes } = await supabase
    .from("employes")
    .select("*")
    .order("nom")
    .returns<Employe[]>();

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Employés</h1>
        {moi.role === "admin" ? (
          <Link
            href="/employes/nouveau"
            className="rounded bg-neutral-900 px-3 py-2 text-sm text-white"
          >
            Nouvel employé
          </Link>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        {(employes ?? []).map((employe) => (
          <Link
            key={employe.id}
            href={`/employes/${employe.id}`}
            className="flex items-center justify-between rounded border bg-white px-4 py-3 hover:bg-neutral-50"
          >
            <div>
              <p className="font-medium">
                {employe.prenom} {employe.nom}
              </p>
              <p className="text-sm text-neutral-500">{employe.telephone ?? "—"}</p>
            </div>
            <span className="text-sm text-neutral-500">{employe.role}</span>
          </Link>
        ))}
        {(employes ?? []).length === 0 ? (
          <p className="text-sm text-neutral-500">Aucun employé enregistré.</p>
        ) : null}
      </div>
    </main>
  );
}
