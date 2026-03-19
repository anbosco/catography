"use client";

import { useMemo, useState } from "react";
import { CatMap } from "@/components/cat-map";
import { CatSightingCard } from "@/components/cat-sighting-card";
import {
  applyCatalogFilters,
  neighborhoodHighlightPalette,
  toggleFilterValue,
  type SortOption,
} from "@/lib/catalog-filters";
import type { CatSighting, ToggleLikeResult } from "@/lib/types";

type CatsCatalogProps = {
  initialSightings: CatSighting[];
};

const pageSizeOptions = [10, 20, 40];

async function toggleLike(id: string) {
  const response = await fetch(`/api/sightings/${id}/like`, {
    method: "POST",
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as ToggleLikeResult;
}

export function CatsCatalog({ initialSightings }: CatsCatalogProps) {
  const [sightings, setSightings] = useState(initialSightings);
  const [selectedNeighborhoods, setSelectedNeighborhoods] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedBehaviors, setSelectedBehaviors] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  const neighborhoods = useMemo(
    () =>
      [...new Set(sightings.map((sighting) => sighting.neighborhood))].sort((a, b) =>
        a.localeCompare(b, "fr"),
      ),
    [sightings],
  );
  const colors = useMemo(
    () =>
      [...new Set(sightings.map((sighting) => sighting.color))].sort((a, b) =>
        a.localeCompare(b, "fr"),
      ),
    [sightings],
  );
  const behaviors = useMemo(
    () =>
      [...new Set(sightings.flatMap((sighting) => sighting.behaviors))].sort((a, b) =>
        a.localeCompare(b, "fr"),
      ),
    [sightings],
  );

  const filteredSightings = useMemo(
    () =>
      applyCatalogFilters(sightings, {
        neighborhoods: selectedNeighborhoods,
        colors: selectedColors,
        behaviors: selectedBehaviors,
        sortBy,
      }),
    [selectedBehaviors, selectedColors, selectedNeighborhoods, sightings, sortBy],
  );

  const totalPages = Math.max(1, Math.ceil(filteredSightings.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedSightings = filteredSightings.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  );

  const highlightedNeighborhoods = selectedNeighborhoods.map((name, index) => ({
    name,
    color: neighborhoodHighlightPalette[index % neighborhoodHighlightPalette.length],
  }));

  const activeFilters = [
    ...(sortBy !== "recent"
      ? [
          {
            key: "sort",
            label: sortBy === "popular" ? "Tri: plus populaire" : "Tri: alphabétique",
            onRemove: () => {
              setSortBy("recent");
              setPage(1);
            },
          },
        ]
      : []),
    ...selectedNeighborhoods.map((neighborhood) => ({
      key: `neighborhood-${neighborhood}`,
      label: neighborhood,
      onRemove: () => {
        setSelectedNeighborhoods((current) =>
          current.filter((entry) => entry !== neighborhood),
        );
        setPage(1);
      },
    })),
    ...selectedColors.map((color) => ({
      key: `color-${color}`,
      label: color,
      onRemove: () => {
        setSelectedColors((current) => current.filter((entry) => entry !== color));
        setPage(1);
      },
    })),
    ...selectedBehaviors.map((behavior) => ({
      key: `behavior-${behavior}`,
      label: behavior,
      onRemove: () => {
        setSelectedBehaviors((current) =>
          current.filter((entry) => entry !== behavior),
        );
        setPage(1);
      },
    })),
  ];

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
    <div className="grid gap-8">
      <section className="rounded-[1.9rem] border border-border bg-surface px-6 py-7 shadow-[var(--shadow)]">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-accent-deep">
              Tous les chats
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-foreground">
              Filtrer Toulouse quartier par quartier.
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-muted">
              Cumule quartier, couleur, comportements et tri. La carte et la
              liste réagissent ensemble.
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-border bg-surface-strong px-5 py-4 text-sm text-muted shadow-sm">
            {filteredSightings.length} chat{filteredSightings.length > 1 ? "s" : ""} •
            page {safePage}/{totalPages}
          </div>
        </div>

        <div className="mt-6 flex min-h-12 flex-wrap items-center gap-3">
          {activeFilters.length > 0 ? (
            activeFilters.map((filter) => (
              <button
                key={filter.key}
                type="button"
                onClick={filter.onRemove}
                className="rounded-full bg-[rgba(240,140,171,0.16)] px-4 py-2 text-sm font-semibold text-accent-deep"
              >
                {filter.label} ×
              </button>
            ))
          ) : (
            <span className="rounded-full bg-[rgba(255,255,255,0.78)] px-4 py-2 text-sm text-muted">
              Aucun filtre actif
            </span>
          )}

          <button
            type="button"
            onClick={() => {
              setSortBy("recent");
              setSelectedNeighborhoods([]);
              setSelectedColors([]);
              setSelectedBehaviors([]);
              setPage(1);
            }}
            className="rounded-full border border-border bg-white/80 px-4 py-2 text-sm font-semibold text-foreground"
          >
            Réinitialiser tout
          </button>
        </div>
      </section>

      <section className="grid gap-6">
        <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
          <aside className="grid content-start gap-3 self-start rounded-[1.9rem] border border-border bg-surface-strong p-4 shadow-sm">
          <div className="grid gap-2">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent-deep">
              Tri
            </p>
            <div className="flex flex-wrap gap-3">
              {[
                { value: "recent", label: "Plus récent" },
                { value: "popular", label: "Plus populaire" },
                { value: "name", label: "Nom" },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setSortBy(option.value as SortOption);
                    setPage(1);
                  }}
                  className={`rounded-full px-4 py-1.5 text-sm font-semibold ${
                    sortBy === option.value
                      ? "bg-[#915b76] text-[#fff7fb]"
                      : "border border-border bg-white/80 text-foreground"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent-deep">
                Quartiers
              </p>
              <span className="text-xs text-muted">
                {selectedNeighborhoods.length} sélectionné(s)
              </span>
            </div>
            <div className="flex max-h-44 flex-wrap gap-2 overflow-y-auto pr-1">
              {neighborhoods.map((neighborhood) => (
                <button
                  key={neighborhood}
                  type="button"
                  onClick={() => {
                    setSelectedNeighborhoods((current) =>
                      toggleFilterValue(current, neighborhood),
                    );
                    setPage(1);
                  }}
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

          <div className="grid gap-2">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent-deep">
              Couleurs
            </p>
            <div className="flex flex-wrap gap-2">
              {colors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => {
                    setSelectedColors((current) =>
                      toggleFilterValue(current, color),
                    );
                    setPage(1);
                  }}
                  className={`rounded-full px-3 py-2 text-sm ${
                    selectedColors.includes(color)
                      ? "bg-[#ffd9e8] font-semibold text-accent-deep"
                      : "bg-white/80 text-muted"
                  }`}
                >
                  {color}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-2">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent-deep">
              Comportements
            </p>
            <div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto pr-1">
              {behaviors.map((behavior) => (
                <button
                  key={behavior}
                  type="button"
                  onClick={() => {
                    setSelectedBehaviors((current) =>
                      toggleFilterValue(current, behavior),
                    );
                    setPage(1);
                  }}
                  className={`rounded-full px-3 py-2 text-sm ${
                    selectedBehaviors.includes(behavior)
                      ? "bg-[#ffd9e8] font-semibold text-accent-deep"
                      : "bg-white/80 text-muted"
                  }`}
                >
                  {behavior}
                </button>
              ))}
            </div>
          </div>

          <label className="grid gap-2 text-sm font-medium text-foreground">
            Chats par page
            <select
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setPage(1);
              }}
              className="rounded-2xl border border-border bg-white px-4 py-3 text-sm font-normal outline-none"
            >
              {pageSizeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          </aside>

          <div className="grid gap-4 self-start">
          <CatMap
            sightings={filteredSightings}
            onToggleLike={handleToggleLike}
            heightClassName="h-[18rem] xl:h-[21rem]"
            highlightedNeighborhoods={highlightedNeighborhoods}
          />
          </div>
        </div>

        {pagedSightings.length === 0 ? (
          <section className="rounded-[1.8rem] border border-border bg-surface-strong p-8 shadow-sm">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-accent-deep">
              Aucun résultat
            </p>
            <p className="mt-3 text-sm leading-6 text-muted">
              Essaie en retirant un filtre ou en choisissant un autre quartier.
            </p>
          </section>
        ) : null}

        {pagedSightings.length > 0 ? (
          <div className="grid gap-6 xl:grid-cols-2">
            {pagedSightings.map((sighting) => (
              <CatSightingCard
                key={sighting.id}
                sighting={sighting}
                compact
                onToggleLike={handleToggleLike}
              />
            ))}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-4 rounded-[1.6rem] border border-border bg-surface-strong px-5 py-4 shadow-sm">
          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }, (_, index) => index + 1).map(
              (pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  onClick={() => setPage(pageNumber)}
                  className={`h-10 min-w-10 rounded-full px-3 text-sm font-semibold ${
                    pageNumber === safePage
                      ? "bg-[#915b76] text-[#fff7fb]"
                      : "border border-border bg-white/80 text-foreground"
                  }`}
                >
                  {pageNumber}
                </button>
              ),
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={safePage === 1}
              className="rounded-full border border-border bg-white/80 px-4 py-2 text-sm font-semibold text-foreground disabled:opacity-45"
            >
              Page précédente
            </button>
            <button
              type="button"
              onClick={() =>
                setPage((current) => Math.min(totalPages, current + 1))
              }
              disabled={safePage === totalPages}
              className="rounded-full border border-border bg-white/80 px-4 py-2 text-sm font-semibold text-foreground disabled:opacity-45"
            >
              Page suivante
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
