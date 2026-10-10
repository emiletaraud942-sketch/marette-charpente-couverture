import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentEmploye } from "@/lib/auth";
import { versCsv } from "@/lib/csv";
import { formatDate, formatHeure } from "@/lib/date";
import type { Chantier, Employe, Pointage } from "@/lib/types/database";

export async function GET() {
  const moi = await getCurrentEmploye();
  if (moi?.role !== "admin") {
    return NextResponse.json({ error: "Réservé à l'administrateur" }, { status: 403 });
  }

  const supabase = await createClient();
  const { data: pointages } = await supabase
    .from("pointages")
    .select("*, employe:employes(*), chantier:chantiers(*)")
    .order("heure_entree", { ascending: false })
    .returns<(Pointage & { employe: Employe; chantier: Chantier | null })[]>();

  const lignes = [
    ["Employé", "Chantier", "Date", "Heure entrée", "Heure sortie", "Durée (h)"],
    ...(pointages ?? []).map((p) => {
      const duree = p.heure_sortie
        ? ((new Date(p.heure_sortie).getTime() - new Date(p.heure_entree).getTime()) / 3_600_000).toFixed(2)
        : "";
      return [
        `${p.employe.prenom} ${p.employe.nom}`,
        p.chantier?.nom ?? "",
        formatDate(p.heure_entree),
        formatHeure(p.heure_entree),
        p.heure_sortie ? formatHeure(p.heure_sortie) : "",
        duree,
      ];
    }),
  ];

  return new NextResponse(versCsv(lignes), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="heures-travaillees.csv"`,
    },
  });
}
