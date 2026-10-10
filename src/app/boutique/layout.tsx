import Link from "next/link";

export default function BoutiqueLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b bg-neutral-900 px-4 py-4 text-white">
        <Link href="/boutique" className="text-lg font-semibold">
          Marette Bois &amp; Matériaux
        </Link>
        <p className="text-sm text-neutral-300">Vente de bois et matériaux aux particuliers</p>
      </header>
      {children}
      <footer className="border-t px-4 py-6 text-center text-sm text-neutral-500">
        MARETTE BOIS &amp; MATERIAUX · 42 route de Calmare, 76210 Beuzeville-la-Grenier
      </footer>
    </div>
  );
}
