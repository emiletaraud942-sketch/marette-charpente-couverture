import Link from "next/link";

export default function MerciPage() {
  return (
    <main className="mx-auto max-w-md px-4 py-16 text-center">
      <h1 className="mb-2 text-xl font-semibold">Merci !</h1>
      <p className="mb-6 text-neutral-600">
        Votre demande a bien été envoyée. Nous vous rappelons rapidement pour confirmer votre
        commande et son prix.
      </p>
      <Link href="/boutique" className="text-sm font-medium underline">
        Retour au catalogue
      </Link>
    </main>
  );
}
