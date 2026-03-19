import type { CatSighting } from "@/lib/types";

export type SortOption = "recent" | "popular" | "name";

export type CatalogFilters = {
  neighborhoods: string[];
  colors: string[];
  behaviors: string[];
  sortBy: SortOption;
};

export function applyCatalogFilters(
  sightings: CatSighting[],
  filters: CatalogFilters,
) {
  const filtered = sightings.filter((sighting) => {
    if (
      filters.neighborhoods.length > 0 &&
      !filters.neighborhoods.includes(sighting.neighborhood)
    ) {
      return false;
    }

    if (
      filters.colors.length > 0 &&
      !filters.colors.includes(sighting.color)
    ) {
      return false;
    }

    if (
      filters.behaviors.length > 0 &&
      !filters.behaviors.every((behavior) => sighting.behaviors.includes(behavior))
    ) {
      return false;
    }

    return true;
  });

  filtered.sort((left, right) => {
    if (filters.sortBy === "popular") {
      return (
        right.likesCount - left.likesCount ||
        right.seenAt.localeCompare(left.seenAt)
      );
    }

    if (filters.sortBy === "name") {
      return left.name.localeCompare(right.name, "fr");
    }

    return right.seenAt.localeCompare(left.seenAt);
  });

  return filtered;
}

export function toggleFilterValue(current: string[], value: string) {
  return current.includes(value)
    ? current.filter((entry) => entry !== value)
    : [...current, value];
}

export const neighborhoodHighlightPalette = [
  "#f08cab",
  "#c57db2",
  "#8ab6d6",
  "#f7b267",
  "#8cc084",
  "#ff8e72",
];
