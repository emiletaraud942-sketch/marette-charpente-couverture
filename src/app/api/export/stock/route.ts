import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentEmploye } from "@/lib/auth";
import { versCsv } from "@/lib/csv";
import { formatDate } from "@/lib/date";
import type { Chantier, Materiau, StockMouvement } from "@/lib/types/database";

export async function GET() {
  const moi = await getCurrentEmploye();
  if (moi?.role !== "admin") {
    return NextResponse.json({ error: "Réservé à l'administrateur" }, { status: 403 });
  }

  const supabase = await createClient();
  const { data: mouvements } = await supabase
    .from("stock_mouvements")
    .select("*, materiau:materiaux(*), chantier:chantiers(*)")
    .order("created_at", { ascending: false })
    .returns<(StockMouvement & { materiau: Materiau; chantier: Chantier | null })[]>();

  const lignes = [
    ["Date", "Matériau", "Type", "Quantité", "Unité", "Chantier", "Motif"],
    ...(mouvements ?? []).map((m) => [
      formatDate(m.created_at),
      m.materiau.nom,
      m.type === "entree" ? "Entrée" : "Sortie",
      String(m.quantite),
      m.materiau.unite,
      m.chantier?.nom ?? "",
      m.motif ?? "",
    ]),
  ];

  return new NextResponse(versCsv(lignes), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="mouvements-stock.csv"`,
    },
  });
}
