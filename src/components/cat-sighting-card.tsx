import Image from "next/image";
import type { CatSighting } from "@/lib/types";

type CatSightingCardProps = {
  sighting: CatSighting;
  compact?: boolean;
};

export function CatSightingCard({
  sighting,
  compact = false,
}: CatSightingCardProps) {
  return (
    <article className="overflow-hidden rounded-[1.5rem] border border-border bg-surface-strong shadow-sm">
      <div className={`grid ${compact ? "md:grid-cols-[0.92fr_1.08fr]" : ""}`}>
        <div className="relative min-h-52 bg-[#efe3cf]">
          <Image
            src={sighting.image}
            alt={sighting.name}
            fill
            className="object-cover"
            sizes={compact ? "(max-width: 768px) 100vw, 22rem" : "100vw"}
          />
        </div>
        <div className="flex flex-col gap-4 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold text-foreground">
                {sighting.name}
              </h3>
              <p className="text-sm text-muted">{sighting.neighborhood}</p>
            </div>
            <span className="rounded-full bg-[#f7e1d3] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-accent-deep">
              {sighting.status}
            </span>
          </div>

          <dl className="grid gap-3 text-sm text-muted sm:grid-cols-2">
            <div>
              <dt className="font-medium text-foreground">Couleur</dt>
              <dd>{sighting.color}</dd>
            </div>
            <div>
              <dt className="font-medium text-foreground">Comportement</dt>
              <dd>{sighting.behavior}</dd>
            </div>
            <div>
              <dt className="font-medium text-foreground">Vu le</dt>
              <dd>{sighting.seenAt}</dd>
            </div>
            <div>
              <dt className="font-medium text-foreground">Coordonnees</dt>
              <dd>
                {sighting.latitude.toFixed(4)}, {sighting.longitude.toFixed(4)}
              </dd>
            </div>
          </dl>

          <p className="text-sm leading-6 text-muted">{sighting.note}</p>
        </div>
      </div>
    </article>
  );
}
