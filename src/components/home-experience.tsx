"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CatMap } from "@/components/cat-map";
import { CatSightingCard } from "@/components/cat-sighting-card";
import { neighborhoodHighlightPalette, toggleFilterValue } from "@/lib/catalog-filters";
import type {
  CatSighting,
  Coordinates,
  MapFocusTarget,
  ToggleLikeResult,
} from "@/lib/types";

type HomeExperienceProps = {
  initialSightings: CatSighting[];
  initialMapFocus?: MapFocusTarget | null;
};

async function toggleLike(id: string) {
  const response = await fetch(`/api/sightings/${id}/like`, {
    method: "POST",
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as ToggleLikeResult;
}

export function HomeExperience({
  initialSightings,
  initialMapFocus = null,
}: HomeExperienceProps) {
  const [sightings, setSightings] = useState(initialSightings);
  const [selectedCoordinates, setSelectedCoordinates] =
    useState<Coordinates | null>(null);
  const [selectedNeighborhoods, setSelectedNeighborhoods] = useState<string[]>([]);

  const neighborhoods = useMemo(
    () =>
      [...new Set(sightings.map((sighting) => sighting.neighborhood))].sort((a, b) =>
        a.localeCompare(b, "fr"),
      ),
    [sightings],
  );

  const filteredSightings = useMemo(
    () =>
      selectedNeighborhoods.length === 0
        ? sightings
        : sightings.filter((sighting) =>
            selectedNeighborhoods.includes(sighting.neighborhood),
          ),
    [selectedNeighborhoods, sightings],
  );

  const recentSightings = filteredSightings.slice(0, 4);

  const totalApprovedCats = sightings.length;
  const totalCroquettes = useMemo(
    () => sightings.reduce((sum, sighting) => sum + sighting.likesCount, 0),
    [sightings],
  );

  const highlightedNeighborhoods = selectedNeighborhoods.map((name, index) => ({
    name,
    color: neighborhoodHighlightPalette[index % neighborhoodHighlightPalette.length],
  }));

  const submitHref = useMemo(() => {
    if (!selectedCoordinates) {
      return "/submit";
    }

    const params = new URLSearchParams({
      lat: selectedCoordinates.latitude.toFixed(6),
      lng: selectedCoordinates.longitude.toFixed(6),
    });

    return `/submit?${params.toString()}`;
  }, [selectedCoordinates]);

  async function handleToggleLike(id: string) {
    const result = await toggleLike(id);

    if (!result) {
      return;
    }

    setSightings((current) =>
      current.map((sighting) =>
        sighting.id === id
          ? {
              ...sighting,
              likesCount: result.likesCount,
              likedByViewer: result.likedByViewer,
            }
          : sighting,
      ),
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-[88rem] flex-1 flex-col gap-8 px-6 py-10 sm:px-10 lg:px-12">
      <section className="grid gap-6 xl:grid-cols-[1.18fr_0.82fr]">
        <section className="order-1 rounded-[1.8rem] border border-border bg-surface px-6 py-7 shadow-sm xl:order-2">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-accent-deep">
            Carte des chats
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-foreground xl:text-5xl">
            Cat-ographie des chats croisés dans les rues de Toulouse.
          </h1>
          <p className="mt-4 text-base leading-8 text-muted">
            Parcours les chats déjà validés, filtre par quartier, et
            ajoute un nouveau chat directement depuis la carte.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <div className="min-w-[10rem] rounded-[1.2rem] border border-border bg-surface-strong px-4 py-3 shadow-sm text-center">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-accent-deep">
                Chats observés
              </p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
                {totalApprovedCats}
              </p>
            </div>

            <div className="min-w-[10rem] rounded-[1.2rem] border border-border bg-surface-strong px-4 py-3 shadow-sm text-center">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-accent-deep">
                Croquettes distribuées
              </p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
                {totalCroquettes}
              </p>
            </div>
          </div>
        </section>

        <div className="order-2 grid gap-4 xl:order-1 xl:row-span-2">
          <CatMap
            sightings={filteredSightings}
            selectable
            selectedCoordinates={selectedCoordinates}
            onSelectCoordinates={setSelectedCoordinates}
            onToggleLike={handleToggleLike}
            heightClassName="h-[22rem] md:h-[28rem] xl:h-[38rem]"
            highlightedNeighborhoods={highlightedNeighborhoods}
            initialFocus={initialMapFocus}
          />

          <div className="rounded-[1.7rem] border border-border bg-surface-strong p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-accent-deep">
                  Ajouter depuis la carte
                </p>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
                  Clique sur un point pour pré-remplir la soumission, puis ajoute
                  la photo et les détails du chat.
                </p>
              </div>
              <span className="rounded-full bg-[#ffe2ed] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-accent-deep">
                {selectedCoordinates
                  ? `${selectedCoordinates.latitude.toFixed(5)}, ${selectedCoordinates.longitude.toFixed(5)}`
                  : "Aucun point choisi"}
              </span>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href={submitHref}
                className="inline-flex items-center justify-center rounded-full bg-[#915b76] px-5 py-3 text-sm font-semibold text-[#fff7fb]"
              >
                Proposer un chat ici
              </Link>
              <Link
                href="/cats"
                className="inline-flex items-center justify-center rounded-full border border-border bg-white/80 px-5 py-3 text-sm font-semibold text-foreground"
              >
                Voir tous les chats
              </Link>
            </div>
          </div>
        </div>

        <aside className="order-3 self-start rounded-[1.8rem] border border-border bg-surface-strong p-6 shadow-sm xl:order-3">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent-deep">
            Filtres quartier
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {selectedNeighborhoods.map((neighborhood) => (
              <button
                key={neighborhood}
                type="button"
                onClick={() =>
                  setSelectedNeighborhoods((current) =>
                    current.filter((entry) => entry !== neighborhood),
                  )
                }
                className="rounded-full bg-[rgba(240,140,171,0.16)] px-4 py-2 text-sm font-semibold text-accent-deep"
              >
                {neighborhood} ×
              </button>
            ))}
            {selectedNeighborhoods.length === 0 ? (
              <span className="rounded-full bg-white/80 px-4 py-2 text-sm text-muted">
                Tous les quartiers affichés
              </span>
            ) : null}
          </div>

          <div className="mt-5 grid gap-4">
            <div className="grid gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                Quartiers
              </p>
              <div className="flex flex-wrap gap-2">
                {neighborhoods.map((neighborhood) => (
                  <button
                    key={neighborhood}
                    type="button"
                    onClick={() =>
                      setSelectedNeighborhoods((current) =>
                        toggleFilterValue(current, neighborhood),
                      )
                    }
                    className={`rounded-full px-3 py-2 text-sm ${
                      selectedNeighborhoods.includes(neighborhood)
                        ? "bg-[#ffd9e8] font-semibold text-accent-deep"
                        : "bg-white/80 text-muted"
                    }`}
                  >
                    {neighborhood}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </section>

      <section className="grid gap-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-accent-deep">
              Chats récents
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
              Les derniers chats ajoutés.
            </h2>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/cats"
              className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold text-foreground"
            >
              Voir tous les chats
            </Link>
            <Link
              href="/classement"
              className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold text-foreground"
            >
              Voir le classement
            </Link>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          {recentSightings.map((sighting) => (
            <CatSightingCard
              key={sighting.id}
              sighting={sighting}
              compact
              onToggleLike={handleToggleLike}
              showMapLink
            />
          ))}
        </div>
      </section>
    </main>
  );
}
