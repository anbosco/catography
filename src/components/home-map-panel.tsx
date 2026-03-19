"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CatMap } from "@/components/cat-map";
import type { CatSighting, Coordinates } from "@/lib/types";

type HomeMapPanelProps = {
  sightings: CatSighting[];
};

export function HomeMapPanel({ sightings }: HomeMapPanelProps) {
  const [selectedCoordinates, setSelectedCoordinates] =
    useState<Coordinates | null>(null);

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

  return (
    <div className="grid gap-4">
      <CatMap
        sightings={sightings}
        selectable
        selectedCoordinates={selectedCoordinates}
        onSelectCoordinates={setSelectedCoordinates}
      />

      <div className="rounded-[1.5rem] border border-border bg-surface-strong p-5 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-accent-deep">
          Ajouter depuis la carte
        </p>
        <p className="mt-3 text-sm leading-6 text-muted">
          Clique sur un point de la carte pour pre-remplir les coordonnees du
          futur signalement.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-[#ffe2ed] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-accent-deep">
            {selectedCoordinates
              ? `${selectedCoordinates.latitude.toFixed(5)}, ${selectedCoordinates.longitude.toFixed(5)}`
              : "Aucun point choisi"}
          </span>
          <Link
            href={submitHref}
            className="inline-flex items-center justify-center rounded-full bg-[#915b76] px-4 py-2 text-sm font-semibold text-[#fff7fb]"
          >
            Proposer un chat ici
          </Link>
        </div>
      </div>
    </div>
  );
}
