// Riders type without accents or dashes ("penaranda", "cabanatuan san jose"), so both
// sides drop marks and punctuation before comparing. Shared by the jeep route list and
// the TODA directory.

/** Lowercase text with accents and punctuation removed and spaces collapsed. */
export const searchable = (text: string): string =>
  text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();

/** The words of a search box entry, normalised the same way. */
export const searchWords = (query: string): string[] => searchable(query).split(" ").filter(Boolean);
