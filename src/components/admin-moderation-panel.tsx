"use client";

import { useState } from "react";
import { CatSightingCard } from "@/components/cat-sighting-card";
import type { CatSighting } from "@/lib/types";

const moderationRules = [
  "Verifier que la photo montre surtout un chat, pas des humains.",
  "Refuser les points trop vagues ou clairement faux.",
  "Garder la publication en pending par defaut.",
];

type AdminModerationPanelProps = {
  initialSightings: CatSighting[];
};

export function AdminModerationPanel({
  initialSightings,
}: AdminModerationPanelProps) {
  const [sightings, setSightings] = useState(initialSightings);
  const [feedback, setFeedback] = useState<string | null>(null);

  const pendingSightings = sightings.filter(
    (sighting) => sighting.status === "pending",
  );
  const approvedSightings = sightings.filter(
    (sighting) => sighting.status === "approved",
  );

  async function approveSighting(id: string) {
    const response = await fetch(`/api/sightings/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "approved" }),
    });

    if (!response.ok) {
      setFeedback("Impossible d'approuver ce signalement.");
      return;
    }

    const updated = (await response.json()) as CatSighting;
    setSightings((current) =>
      current.map((sighting) => (sighting.id === id ? updated : sighting)),
    );
    setFeedback("Signalement approuve.");
  }

  async function removeSighting(id: string) {
    const response = await fetch(`/api/sightings/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      setFeedback("Impossible de supprimer ce signalement.");
      return;
    }

    setSightings((current) => current.filter((sighting) => sighting.id !== id));
    setFeedback("Signalement supprime.");
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-10 sm:px-10 lg:px-12">
      <section className="rounded-[2rem] border border-border bg-surface px-6 py-8 shadow-[var(--shadow)] md:px-10">
        <p className="text-sm font-medium uppercase tracking-[0.28em] text-accent-deep">
          Admin
        </p>
        <h1 className="mt-4 max-w-2xl text-4xl font-semibold tracking-tight text-foreground">
          Moderation locale connectee a l&apos;API.
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-muted">
          Les actions approuver et supprimer modifient maintenant les donnees
          du projet. Les listings deja approuves restent eux aussi supprimables.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.86fr_1.14fr]">
        <aside className="rounded-[1.75rem] border border-border bg-[#915b76] p-6 text-[#fff7fb] shadow-sm">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#ffe1eb]">
            Regles de moderation
          </p>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-[#fff1f6]">
            {moderationRules.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>

          <div className="mt-8 rounded-[1.5rem] bg-[rgba(255,255,255,0.12)] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#ffe1eb]">
              Etat courant
            </p>
            <p className="mt-3 text-sm leading-6 text-[#fff1f6]">
              {pendingSightings.length} en attente, {approvedSightings.length} deja
              publies.
            </p>
          </div>

          {feedback ? (
            <p className="mt-4 text-sm font-medium text-[#ffe1eb]">{feedback}</p>
          ) : null}
        </aside>

        <div className="grid gap-8">
          <section className="grid gap-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-accent-deep">
                En attente
              </p>
              <p className="mt-2 text-sm text-muted">
                Les signalements en attente peuvent etre approuves ou supprimes.
              </p>
            </div>

            {pendingSightings.length === 0 ? (
              <section className="rounded-[1.75rem] border border-border bg-surface-strong p-6 shadow-sm">
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-accent-deep">
                  File vide
                </p>
                <p className="mt-3 text-sm leading-6 text-muted">
                  Plus rien a moderer pour l&apos;instant.
                </p>
              </section>
            ) : null}

            {pendingSightings.map((sighting) => (
              <section key={sighting.id} className="grid gap-3">
                <CatSightingCard sighting={sighting} compact />
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => approveSighting(sighting.id)}
                    className="rounded-full bg-[#915b76] px-4 py-2 text-sm font-semibold text-[#fff7fb]"
                  >
                    Approuver
                  </button>
                  <button
                    type="button"
                    onClick={() => removeSighting(sighting.id)}
                    className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold text-foreground"
                  >
                    Supprimer
                  </button>
                </div>
              </section>
            ))}
          </section>

          <section className="grid gap-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-accent-deep">
                Deja approuves
              </p>
              <p className="mt-2 text-sm text-muted">
                Les listings deja publies restent supprimables a tout moment.
              </p>
            </div>

            {approvedSightings.map((sighting) => (
              <section key={sighting.id} className="grid gap-3">
                <CatSightingCard sighting={sighting} compact />
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => removeSighting(sighting.id)}
                    className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold text-foreground"
                  >
                    Supprimer ce listing
                  </button>
                </div>
              </section>
            ))}
          </section>
        </div>
      </section>
    </main>
  );
}
