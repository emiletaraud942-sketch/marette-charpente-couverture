import type { Metadata } from "next";
import "./globals.css";
import { getCurrentEmploye } from "@/lib/auth";
import NavBar from "@/components/nav-bar";

export const metadata: Metadata = {
  title: "Marette Charpente Couverture",
  description: "Gestion RH et chantiers",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const employe = await getCurrentEmploye();

  return (
    <html lang="fr">
      <body className="min-h-screen bg-neutral-50 text-neutral-900 antialiased">
        {employe ? <NavBar employe={employe} /> : null}
        <div className="pb-20">{children}</div>
      </body>
    </html>
  );
}
