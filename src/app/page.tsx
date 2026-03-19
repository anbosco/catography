import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { CatSightingCard } from "@/components/cat-sighting-card";
import { HomeMapPanel } from "@/components/home-map-panel";
import { getSightings } from "@/lib/sightings-store";

export const dynamic = "force-dynamic";

export default async function Home() {
  noStore();

  const approvedSightings = await getSightings("approved");
  const pendingSightings = await getSightings("pending");

  const numbers = [
    {
      label: "Publics",
      detail: "Chats visibles sur la carte",
      value: approvedSightings.length.toString().padStart(2, "0"),
    },
    {
      label: "En attente",
      detail: "Soumissions a moderer",
      value: pendingSightings.length.toString().padStart(2, "0"),
    },
    {
      label: "Quartiers",
      detail: "Zones deja couvertes",
      value: new Set(
        approvedSightings.map((sighting) => sighting.neighborhood),
      )
        .size.toString()
        .padStart(2, "0"),
    },
  ];

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-10 sm:px-10 lg:px-12">
      <section className="relative overflow-hidden rounded-[2rem] border border-border bg-surface px-6 py-8 shadow-[var(--shadow)] backdrop-blur md:px-10 md:py-12">
        <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top,_rgba(240,140,171,0.28),_transparent_70%)]" />
        <div className="relative grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div className="flex flex-col gap-5">
            <p className="text-sm font-medium uppercase tracking-[0.28em] text-accent-deep">
              Catography
            </p>
            <div className="max-w-3xl space-y-4">
              <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                La carte inutilement serieuse des chats de Toulouse.
              </h1>
              <p className="max-w-2xl text-base leading-8 text-muted sm:text-lg">
                Fonctionnalites d&apos;abord : la home lit les signalements
                depuis l&apos;API locale, la soumission se fait par clic sur la
                carte et l&apos;admin peut moderer pour de vrai.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/submit"
                className="inline-flex items-center justify-center rounded-full bg-[#915b76] px-5 py-3 text-sm font-semibold text-[#fff7fb]"
              >
                Ajouter un chat
              </Link>
              <Link
                href="/admin"
                className="inline-flex items-center justify-center rounded-full border border-border bg-surface-strong px-5 py-3 text-sm font-semibold text-foreground"
              >
                Voir la moderation
              </Link>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-3">
              {numbers.map((item) => (
                <article
                  key={item.label}
                  className="min-w-0 rounded-[1.5rem] border border-border bg-surface-strong p-5"
                >
                  <p className="text-sm font-semibold uppercase tracking-[0.14em] text-accent-deep">
                    {item.label}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted">
                    {item.detail}
                  </p>
                  <p className="mt-4 text-4xl font-semibold tracking-tight text-foreground">
                    {item.value}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr]">
        <HomeMapPanel sightings={approvedSightings} />

        <aside className="space-y-6">
          <section className="rounded-[1.75rem] border border-border bg-[#915b76] p-6 text-[#fff7fb] shadow-sm">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#ffe1eb]">
              Fonctionnel maintenant
            </p>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-[#fff1f6]">
              <li>Vraie carte raster de Toulouse.</li>
              <li>Selection d&apos;un point pour lancer un signalement.</li>
              <li>API locale de lecture, ajout, approbation et suppression.</li>
              <li>Donnees persistantes dans `data/sightings.json`.</li>
            </ul>
          </section>

          <section className="rounded-[1.75rem] border border-border bg-surface-strong p-6 shadow-sm">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-accent-deep">
              Plus tard
            </p>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-muted">
              <li>Supabase pour sortir du stockage fichier local.</li>
              <li>Upload photo reel.</li>
              <li>Auth admin unique.</li>
            </ul>
          </section>
        </aside>
      </section>

      <section className="grid gap-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-accent-deep">
              Chats deja affichables
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
              Quelques specimen toulousains tres serieux.
            </h2>
          </div>
          <Link
            href="/submit"
            className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold text-foreground"
          >
            Proposer un nouveau chat
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {approvedSightings.map((sighting) => (
            <CatSightingCard key={sighting.id} sighting={sighting} compact />
          ))}
        </div>
      </section>
    </main>
  );
}
