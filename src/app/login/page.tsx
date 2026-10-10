import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function login(formData: FormData) {
  "use server";

  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?erreur=${encodeURIComponent(error.message)}`);
  }

  redirect("/");
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const { erreur } = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-4">
      <div>
        <h1 className="text-xl font-semibold">Marette Charpente Couverture</h1>
        <p className="text-sm text-neutral-500">Connexion</p>
      </div>

      <form action={login} className="flex flex-col gap-3">
        <input
          name="email"
          type="email"
          required
          placeholder="Email"
          className="rounded border px-3 py-2"
        />
        <input
          name="password"
          type="password"
          required
          placeholder="Mot de passe"
          className="rounded border px-3 py-2"
        />
        {erreur ? <p className="text-sm text-red-600">{erreur}</p> : null}
        <button
          type="submit"
          className="rounded bg-neutral-900 px-3 py-2 text-white"
        >
          Se connecter
        </button>
      </form>
    </main>
  );
}
