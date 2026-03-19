"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { LikeToggleButton } from "@/components/like-toggle-button";
import type { CatSighting } from "@/lib/types";

type CatSightingCardProps = {
  sighting: CatSighting;
  compact?: boolean;
  onToggleLike?: (id: string) => void;
  rankingLabel?: string;
  showStatusBadge?: boolean;
  showMapLink?: boolean;
};

export function CatSightingCard({
  sighting,
  compact = false,
  onToggleLike,
  rankingLabel,
  showStatusBadge = false,
  showMapLink = false,
}: CatSightingCardProps) {
  const [isImageOpen, setIsImageOpen] = useState(false);
  const mapHref = `/?lat=${sighting.latitude.toFixed(6)}&lng=${sighting.longitude.toFixed(6)}&zoom=14.6`;

  return (
    <>
      <article
        id={`cat-${sighting.id}`}
        className="scroll-mt-32 overflow-hidden rounded-[1.75rem] border border-border bg-surface-strong shadow-sm"
      >
        <div
          className={`grid ${
            compact ? "md:grid-cols-[0.94fr_1.06fr]" : ""
          }`}
        >
          <button
            type="button"
            onClick={() => setIsImageOpen(true)}
            className={`relative bg-[#f2d8e2] text-left ${
              compact ? "min-h-[17rem] md:min-h-full" : "min-h-64"
            }`}
          >
            <Image
              src={sighting.image}
              alt={sighting.name}
              fill
              className="object-cover"
              sizes={
                compact
                  ? "(max-width: 768px) 100vw, (max-width: 1536px) 50vw, 33vw"
                  : "100vw"
              }
              unoptimized
            />
            <span className="absolute bottom-4 left-4 rounded-full bg-[rgba(255,248,251,0.92)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-accent-deep">
              Agrandir
            </span>
          </button>

          <div
            className={`min-w-0 flex h-full flex-col justify-between ${
              compact ? "gap-4 p-5 md:p-6" : "gap-5 p-5 md:p-6"
            }`}
          >
            <div className="grid gap-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 space-y-1">
                  {rankingLabel ? (
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent-deep">
                      {rankingLabel}
                    </p>
                  ) : null}
                  <h3
                    className={`font-semibold tracking-tight text-foreground ${
                      compact
                        ? "text-[1.6rem] leading-[1.05] md:text-[1.85rem]"
                        : "text-2xl"
                    }`}
                  >
                    {sighting.name}
                  </h3>
                  <p className="text-sm text-muted">{sighting.neighborhood}</p>
                </div>

                <div className="flex items-center gap-3">
                  <LikeToggleButton
                    liked={sighting.likedByViewer}
                    count={sighting.likesCount}
                    onToggle={
                      onToggleLike ? () => onToggleLike(sighting.id) : undefined
                    }
                  />
                  {showStatusBadge ? (
                    <span className="rounded-full bg-[#ffe2ed] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-accent-deep">
                      {sighting.status}
                    </span>
                  ) : null}
                </div>
              </div>

              <dl
                className={`grid text-sm text-muted sm:grid-cols-2 ${
                  compact ? "gap-x-5 gap-y-3" : "gap-4"
                }`}
              >
                <div>
                  <dt className="font-medium text-foreground">Couleur</dt>
                  <dd>{sighting.color}</dd>
                </div>
                <div>
                  <dt className="font-medium text-foreground">Comportements</dt>
                  <dd className="break-words">{sighting.behaviorLabel}</dd>
                </div>
                <div>
                  <dt className="font-medium text-foreground">Vu le</dt>
                  <dd>{sighting.seenAt}</dd>
                </div>
                <div>
                  <dt className="font-medium text-foreground">Coordonnées</dt>
                  <dd className="break-words">
                    {sighting.latitude.toFixed(4)}, {sighting.longitude.toFixed(4)}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="grid gap-3">
              <p
                className={`break-words text-sm text-muted ${
                  compact ? "leading-6" : "leading-7"
                }`}
              >
                {sighting.note}
              </p>
              {showMapLink ? (
                <div>
                  <Link
                    href={mapHref}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-accent-deep"
                  >
                    <span aria-hidden="true">🗺️</span>
                    Voir sur la carte
                  </Link>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </article>

      {isImageOpen ? (
        <div className="fixed inset-0 z-[70] bg-[rgba(32,18,28,0.72)] p-6 backdrop-blur-sm">
          <button
            type="button"
            onClick={() => setIsImageOpen(false)}
            className="absolute right-6 top-6 rounded-full bg-[rgba(255,255,255,0.16)] px-4 py-2 text-sm font-semibold text-white"
          >
            Fermer
          </button>
          <div className="flex h-full items-center justify-center">
            <div className="relative h-[min(82vh,1100px)] w-[min(92vw,1400px)] overflow-hidden rounded-[2rem] border border-[rgba(255,255,255,0.18)] bg-[rgba(255,248,251,0.08)] shadow-2xl">
              <Image
                src={sighting.image}
                alt={sighting.name}
                fill
                className="object-contain"
                sizes="92vw"
                unoptimized
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
