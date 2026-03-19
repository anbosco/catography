"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { CatMap } from "@/components/cat-map";
import {
  catBehaviorOptions,
  catColorOptions,
} from "@/lib/cat-taxonomy";
import { inferNeighborhoodFromCoordinates } from "@/lib/toulouse-neighborhoods";
import type {
  CatSighting,
  Coordinates,
  CreateSightingInput,
  ToggleLikeResult,
} from "@/lib/types";

const checklist = [
  "Clique sur la carte pour positionner le chat.",
  "Le quartier se remplit automatiquement depuis les limites officielles.",
  "La photo est compressée avant stockage pour économiser l'espace.",
  "Si le listing est supprimé ou refusé, sa photo est retirée du storage.",
];

type SubmitSightingFormProps = {
  approvedSightings: CatSighting[];
};

const emptyForm: Omit<CreateSightingInput, "latitude" | "longitude"> = {
  name: "",
  neighborhood: "",
  color: catColorOptions[0],
  behaviors: ["Social"],
  note: "",
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

  const [sightings, setSightings] = useState(approvedSightings);
  const [coordinates, setCoordinates] = useState<Coordinates | null>(
    initialCoordinates,
  );
  const [formValues, setFormValues] = useState(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setCoordinates(initialCoordinates);
  }, [initialCoordinates]);

  useEffect(() => {
    if (!coordinates) {
      setFormValues((current) => ({
        ...current,
        neighborhood: "",
      }));
      return;
    }

    setFormValues((current) => ({
      ...current,
      neighborhood: inferNeighborhoodFromCoordinates(coordinates),
    }));
  }, [coordinates]);

  useEffect(() => {
    if (!photo) {
      setPhotoPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(photo);
    setPhotoPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [photo]);

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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!coordinates) {
      setFeedback("Choisis d'abord un point sur la carte.");
      return;
    }

    if (formValues.behaviors.length === 0) {
      setFeedback("Choisis au moins un comportement.");
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    const body = new FormData();
    body.set("name", formValues.name);
    body.set("neighborhood", formValues.neighborhood);
    body.set("color", formValues.color);
    formValues.behaviors.forEach((behavior) => body.append("behaviors", behavior));
    body.set("note", formValues.note);
    body.set("latitude", String(coordinates.latitude));
    body.set("longitude", String(coordinates.longitude));

    if (photo) {
      body.set("photo", photo);
    }

    const response = await fetch("/api/sightings", {
      method: "POST",
      body,
    });

    if (!response.ok) {
      const errorBody = (await response.json()) as { error?: string };
      setFeedback(errorBody.error ?? "La soumission a échoué.");
      setIsSubmitting(false);
      return;
    }

    setFormValues(emptyForm);
    setPhoto(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setFeedback("Signalement envoyé en modération.");
    setIsSubmitting(false);
  }

  return (
    <main className="mx-auto flex w-full max-w-[88rem] flex-1 flex-col gap-8 px-6 py-10 sm:px-10 lg:px-12">
      <section className="rounded-[2rem] border border-border bg-surface px-6 py-8 shadow-[var(--shadow)] md:px-10">
        <p className="text-sm font-medium uppercase tracking-[0.28em] text-accent-deep">
          Ajouter un chat
        </p>
        <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-foreground">
          Clique sur la carte, remplis les informations et ajoute une photo.
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-muted">
          Le quartier est déduit automatiquement, les comportements peuvent être
          cumulés, et la photo est redimensionnée avant stockage.
        </p>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="grid gap-4">
          <CatMap
            sightings={sightings}
            selectable
            selectedCoordinates={coordinates}
            onSelectCoordinates={setCoordinates}
            onToggleLike={handleToggleLike}
            heightClassName="h-[24rem] md:h-[32rem] xl:h-[42rem]"
          />

          <div className="rounded-[1.6rem] border border-border bg-surface-strong p-5 shadow-sm">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-accent-deep">
              Point sélectionné
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-[#ffe2ed] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-accent-deep">
                {coordinates
                  ? `${coordinates.latitude.toFixed(5)}, ${coordinates.longitude.toFixed(5)}`
                  : "Clique sur la carte"}
              </span>
              <button
                type="button"
                onClick={() => setCoordinates(null)}
                className="rounded-full border border-border bg-white/80 px-4 py-2 text-sm font-semibold text-foreground"
              >
                Réinitialiser
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
                Quartier détecté
                <input
                  value={formValues.neighborhood}
                  readOnly
                  className="rounded-2xl border border-border bg-[#fff4f8] px-4 py-3 text-sm font-normal text-muted outline-none"
                  placeholder="Clique sur la carte"
                />
              </label>

              <label className="grid gap-2 text-sm font-medium text-foreground">
                Couleur principale
                <select
                  value={formValues.color}
                  onChange={(event) =>
                    setFormValues((current) => ({
                      ...current,
                      color: event.target.value,
                    }))
                  }
                  className="rounded-2xl border border-border bg-white px-4 py-3 text-sm font-normal outline-none transition focus:border-accent"
                >
                  {catColorOptions.map((color) => (
                    <option key={color}>{color}</option>
                  ))}
                </select>
              </label>

              <div className="grid gap-3">
                <p className="text-sm font-medium text-foreground">
                  Comportements observés
                </p>
                <div className="flex flex-wrap gap-2">
                  {catBehaviorOptions.map((behavior) => {
                    const active = formValues.behaviors.includes(behavior);

                    return (
                      <button
                        key={behavior}
                        type="button"
                        onClick={() =>
                          setFormValues((current) => ({
                            ...current,
                            behaviors: active
                              ? current.behaviors.filter((entry) => entry !== behavior)
                              : [...current.behaviors, behavior],
                          }))
                        }
                        className={`rounded-full px-4 py-2 text-sm ${
                          active
                            ? "bg-[#ffd9e8] font-semibold text-accent-deep"
                            : "border border-border bg-white/80 text-muted"
                        }`}
                      >
                        {behavior}
                      </button>
                    );
                  })}
                </div>
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
                  placeholder="Ce chat fait la tournée des terrasses, choisit ses humains puis disparaît."
                />
              </label>

              <label className="grid gap-3 text-sm font-medium text-foreground">
                Photo du chat
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    const nextPhoto = event.target.files?.[0] ?? null;
                    setPhoto(nextPhoto);
                  }}
                  className="rounded-2xl border border-border bg-white px-4 py-3 text-sm font-normal outline-none transition file:mr-4 file:rounded-full file:border-0 file:bg-[#ffe2ed] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-accent-deep"
                />
                <p className="text-xs leading-5 text-muted">
                  Photo encouragée. En cas de refus ou suppression du listing,
                  elle est retirée du storage.
                </p>
                {photoPreviewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photoPreviewUrl}
                    alt="Aperçu du chat"
                    className="h-52 w-full rounded-[1.5rem] border border-border object-cover"
                  />
                ) : null}
              </label>

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center rounded-full bg-[#915b76] px-5 py-3 text-sm font-semibold text-[#fff7fb] disabled:opacity-60"
              >
                {isSubmitting ? "Envoi..." : "Valider"}
              </button>

              {feedback ? (
                <p className="text-sm font-medium text-accent-deep">{feedback}</p>
              ) : null}
            </div>
          </form>

          <section className="rounded-[1.75rem] border border-border bg-[#915b76] p-6 text-[#fff7fb] shadow-sm">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#ffe1eb]">
              Checklist utile
            </p>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-[#fff1f6]">
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
