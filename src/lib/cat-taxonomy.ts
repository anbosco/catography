export const catColorOptions = [
  "Roux",
  "Roux et blanc",
  "Crème",
  "Noir",
  "Noir et blanc",
  "Blanc",
  "Blanc et gris",
  "Gris",
  "Gris bleuté",
  "Tabby brun",
  "Tabby gris",
  "Tigré roux",
  "Écaille de tortue",
  "Calico",
  "Isabelle",
  "Point seal",
  "Point blue",
  "Chocolat",
  "Cannelle",
  "Doré",
  "Argenté",
  "Bicolore",
  "Tricolore",
  "Autre motif",
] as const;

export const catBehaviorOptions = [
  "Social",
  "Câlin",
  "Curieux",
  "Joueur",
  "Calme",
  "Vocal",
  "Gourmand",
  "Patrouilleur",
  "Observe de loin",
  "Timide",
  "Fuyant",
  "Protecteur du quartier",
  "Suit les humains",
  "Chasseur",
  "Somnolent",
  "Accepte les gratouilles",
] as const;

export function normalizeBehaviors(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .map((entry) => String(entry).trim())
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/[;,]/)
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  return [];
}

export function formatBehaviorLabel(behaviors: string[]) {
  return behaviors.length > 0 ? behaviors.join(", ") : "Mystère félin";
}
