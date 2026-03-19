"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CatMap } from "@/components/cat-map";
import type { CatSighting, Coordinates, CreateSightingInput } from "@/lib/types";

const checklist = [
  "Clique sur la carte pour positionner le chat.",
  "Le quartier, la couleur et le commentaire restent facultatifs.",
  "La soumission part directement dans la file de moderation locale.",
  "L'upload photo viendra au branchement Cloudinary ou Supabase Storage.",
];

type SubmitSightingFormProps = {
  approvedSightings: CatSighting[];
};

const emptyForm: Omit<CreateSightingInput, "latitude" | "longitude"> = {
  name: "",
  neighborhood: "",
  color: "",
  behavior: "Social",
  note: "",
};

export function SubmitSightingForm({
  approvedSightings,
}: SubmitSightingFormProps) {
  const searchParams = useSearchParams();
  const initialLatitude = Number(searchParams.get("lat"));
  const initialLongitude = Number(searchParams.get("lng"));

  const initialCoordinates = useMemo<Coordinates | null>(() => {
    if (!Number.isFinite(initialLatitude) || !Number.isFinite(initialLongitude)) {
      return null;
    }

    return {
      latitude: initialLatitude,
      longitude: initialLongitude,
    };
  }, [initialLatitude, initialLongitude]);

  const [coordinates, setCoordinates] = useState<Coordinates | null>(
    initialCoordinates,
  );
  const [formValues, setFormValues] = useState(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    setCoordinates(initialCoordinates);
  }, [initialCoordinates]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!coordinates) {
      setFeedback("Choisis d'abord un point sur la carte.");
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    const payload: CreateSightingInput = {
      ...formValues,
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
    };

    const response = await fetch("/api/sightings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const body = (await response.json()) as { error?: string };
      setFeedback(body.error ?? "La soumission a echoue.");
      setIsSubmitting(false);
      return;
    }

    setFormValues(emptyForm);
    setFeedback("Signalement envoye en moderation locale.");
    setIsSubmitting(false);
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-10 sm:px-10 lg:px-12">
      <section className="rounded-[2rem] border border-border bg-surface px-6 py-8 shadow-[var(--shadow)] md:px-10">
        <p className="text-sm font-medium uppercase tracking-[0.28em] text-accent-deep">
          Ajouter un chat
        </p>
        <h1 className="mt-4 max-w-2xl text-4xl font-semibold tracking-tight text-foreground">
          La soumission passe maintenant par la carte.
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-muted">
          Clique sur la carte pour placer le chat, complete les infos utiles,
          puis envoie. L&apos;API locale enregistre le signalement en `pending`
          dans le projet.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="grid gap-4">
          <CatMap
            sightings={approvedSightings}
            selectable
            selectedCoordinates={coordinates}
            onSelectCoordinates={setCoordinates}
          />

          <div className="rounded-[1.5rem] border border-border bg-surface-strong p-5 shadow-sm">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-accent-deep">
              Point selectionne
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-[#f7e1d3] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-accent-deep">
                {coordinates
                  ? `${coordinates.latitude.toFixed(5)}, ${coordinates.longitude.toFixed(5)}`
                  : "Clique sur la carte"}
              </span>
              <button
                type="button"
                onClick={() => setCoordinates(null)}
                className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold text-foreground"
              >
                Reinitialiser
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-6">
          <form
            onSubmit={handleSubmit}
            className="rounded-[1.75rem] border border-border bg-surface-strong p-6 shadow-sm"
          >
            <div className="grid gap-5">
              <label className="grid gap-2 text-sm font-medium text-foreground">
                Nom du chat si tu en as un
                <input
                  value={formValues.name}
                  onChange={(event) =>
                    setFormValues((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  className="rounded-2xl border border-border bg-white px-4 py-3 text-sm font-normal outline-none transition focus:border-accent"
                  placeholder="Ex: Biscotte"
                />
              </label>

              <label className="grid gap-2 text-sm font-medium text-foreground">
                Quartier
                <input
                  value={formValues.neighborhood}
                  onChange={(event) =>
                    setFormValues((current) => ({
                      ...current,
                      neighborhood: event.target.value,
                    }))
                  }
                  className="rounded-2xl border border-border bg-white px-4 py-3 text-sm font-normal outline-none transition focus:border-accent"
                  placeholder="Ex: Saint-Cyprien"
                />
              </label>

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-medium text-foreground">
                  Couleur
                  <input
                    value={formValues.color}
                    onChange={(event) =>
                      setFormValues((current) => ({
                        ...current,
                        color: event.target.value,
                      }))
                    }
                    className="rounded-2xl border border-border bg-white px-4 py-3 text-sm font-normal outline-none transition focus:border-accent"
                    placeholder="Ex: Noir et blanc"
                  />
                </label>

                <label className="grid gap-2 text-sm font-medium text-foreground">
                  Comportement
                  <select
                    value={formValues.behavior}
                    onChange={(event) =>
                      setFormValues((current) => ({
                        ...current,
                        behavior: event.target.value,
                      }))
                    }
                    className="rounded-2xl border border-border bg-white px-4 py-3 text-sm font-normal outline-none transition focus:border-accent"
                  >
                    <option>Social</option>
                    <option>Timide</option>
                    <option>Fuyant</option>
                    <option>Gourmand</option>
                  </select>
                </label>
              </div>

              <label className="grid gap-2 text-sm font-medium text-foreground">
                Commentaire
                <textarea
                  value={formValues.note}
                  onChange={(event) =>
                    setFormValues((current) => ({
                      ...current,
                      note: event.target.value,
                    }))
                  }
                  className="min-h-36 rounded-[1.5rem] border border-border bg-white px-4 py-3 text-sm font-normal outline-none transition focus:border-accent"
                  placeholder="Ce chat a suivi un groupe sur 50 metres avec beaucoup de conviction."
                />
              </label>

              <div className="rounded-[1.5rem] border border-dashed border-border bg-[#f7efe2] px-4 py-5 text-sm text-muted">
                Upload photo encore en attente. Pour l&apos;instant, l&apos;API
                locale enregistre le point, les metadonnees et le statut
                `pending`.
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center rounded-full bg-[#2f241f] px-5 py-3 text-sm font-semibold text-[#f8f1e5] disabled:opacity-60"
              >
                {isSubmitting ? "Envoi..." : "Envoyer le signalement"}
              </button>

              {feedback ? (
                <p className="text-sm font-medium text-accent-deep">{feedback}</p>
              ) : null}
            </div>
          </form>

          <section className="rounded-[1.75rem] border border-border bg-[#2f241f] p-6 text-[#f8f1e5] shadow-sm">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#f1b388]">
              Checklist utile
            </p>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-[#e7d8c3]">
              {checklist.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        </div>
      </section>
    </main>
  );
}
