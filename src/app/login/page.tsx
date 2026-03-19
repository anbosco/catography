import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAdminAccount } from "@/lib/admin-auth";
import { createClient } from "@/lib/supabase/server";
import { login } from "./actions";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  const nextPath = params.next || "/admin";
  const error = params.error;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const currentAdmin = await getCurrentAdminAccount(user);

  if (currentAdmin) {
    redirect(nextPath);
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 items-center px-6 py-12 sm:px-10 lg:px-12">
      <section className="mx-auto grid w-full max-w-4xl gap-8 rounded-[2rem] border border-border bg-surface px-6 py-8 shadow-[var(--shadow)] md:grid-cols-[0.9fr_1.1fr] md:px-10">
        <aside className="rounded-[1.75rem] bg-[#915b76] p-6 text-[#fff7fb]">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-[#ffe1eb]">
            Admin
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">
            Accès à l&apos;espace admin.
          </h1>
          <p className="mt-4 text-sm leading-7 text-[#fff1f6]">
            Connecte-toi pour valider les nouveaux signalements et gérer les
            chats déjà publiés.
          </p>
        </aside>

        <div className="rounded-[1.75rem] border border-border bg-surface-strong p-6 shadow-sm">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-accent-deep">
            Connexion
          </p>
          <p className="mt-3 text-sm leading-6 text-muted">
            Utilise les identifiants admin configurés pour ouvrir la
            modération.
          </p>

          <form action={login} className="mt-8 grid gap-5">
            <input type="hidden" name="next" value={nextPath} />

            <label className="grid gap-2 text-sm font-medium text-foreground">
              Identifiant
              <input
                name="username"
                className="rounded-2xl border border-border bg-white px-4 py-3 text-sm font-normal outline-none transition focus:border-accent"
                autoComplete="username"
                required
              />
            </label>

            <label className="grid gap-2 text-sm font-medium text-foreground">
              Mot de passe
              <input
                name="password"
                type="password"
                className="rounded-2xl border border-border bg-white px-4 py-3 text-sm font-normal outline-none transition focus:border-accent"
                autoComplete="current-password"
                required
              />
            </label>

            {error ? (
              <p className="rounded-2xl border border-[#f0c0d2] bg-[#fff2f7] px-4 py-3 text-sm text-accent-deep">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-full bg-[#915b76] px-5 py-3 text-sm font-semibold text-[#fff7fb]"
            >
              Ouvrir la moderation
            </button>
          </form>

          <Link
            href="/"
            className="mt-4 inline-flex text-sm font-medium text-muted underline-offset-4 hover:underline"
          >
            Retour a la carte
          </Link>
        </div>
      </section>
    </main>
  );
}
