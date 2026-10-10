/** Construit un CSV (RFC 4180) à partir de lignes de cellules déjà formatées en texte. */
export function versCsv(lignes: string[][]): string {
  const echapper = (valeur: string) => {
    if (/[",\n]/.test(valeur)) {
      return `"${valeur.replace(/"/g, '""')}"`;
    }
    return valeur;
  };

  return lignes.map((ligne) => ligne.map(echapper).join(",")).join("\r\n");
}
