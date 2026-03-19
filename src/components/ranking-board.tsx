"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CatSightingCard } from "@/components/cat-sighting-card";
import type { CatSighting, ToggleLikeResult } from "@/lib/types";

type RankingBoardProps = {
  initialSightings: CatSighting[];
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

export function RankingBoard({ initialSightings }: RankingBoardProps) {
  const [sightings, setSightings] = useState(initialSightings);

  const ranking = useMemo(
    () =>
      [...sightings].sort(
        (left, right) =>
          right.likesCount - left.likesCount ||
          right.seenAt.localeCompare(left.seenAt),
      ),
    [sightings],
  );

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
      <section className="rounded-[1.9rem] border border-border bg-surface px-6 py-8 shadow-[var(--shadow)] md:px-10">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-accent-deep">
          Classement
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-foreground">
          Les chats les plus aimés du moment.
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-8 text-muted">
          Le classement évolue avec les cœurs ajoutés depuis la carte et les
          fiches complètes.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/cats"
            className="rounded-full border border-border bg-white/80 px-4 py-2 text-sm font-semibold text-foreground"
          >
            Voir tous les chats
          </Link>
          <Link
            href="/"
            className="rounded-full border border-border bg-white/80 px-4 py-2 text-sm font-semibold text-foreground"
          >
            Retour à la carte
          </Link>
        </div>
      </section>

      <section className="grid gap-6">
        {ranking.map((sighting, index) => (
          <CatSightingCard
            key={sighting.id}
            sighting={sighting}
            compact
            rankingLabel={`#${index + 1} • ${sighting.likesCount} cœur${sighting.likesCount > 1 ? "s" : ""}`}
            onToggleLike={handleToggleLike}
          />
        ))}
      </section>
    </main>
  );
}
