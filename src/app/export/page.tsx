import { redirect } from "next/navigation";
import { getCurrentEmploye } from "@/lib/auth";

export default async function ExportPage() {
  const moi = await getCurrentEmploye();
  if (moi?.role !== "admin") redirect("/");

  return (
    <main className="mx-auto max-w-md px-4 py-6">
      <h1 className="mb-2 text-xl font-semibold">Exports pour la comptabilité</h1>
      <p className="mb-6 text-sm text-neutral-500">
        Fichiers CSV à transmettre à votre comptable ou à importer dans votre outil de gestion.
      </p>

      <div className="flex flex-col gap-3">
        <a
          href="/api/export/heures"
          className="rounded border bg-white px-4 py-3 font-medium hover:bg-neutral-50"
        >
          Heures travaillées (pointages)
        </a>
        <a
          href="/api/export/stock"
          className="rounded border bg-white px-4 py-3 font-medium hover:bg-neutral-50"
        >
          Mouvements de stock
        </a>
      </div>
    </main>
  );
}
