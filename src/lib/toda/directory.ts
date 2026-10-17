// Filtering and sorting for the public TODA directory. Pure, so the directory runs it in
// the browser as riders type and the tests run it directly.
import { searchable, searchWords } from "@/lib/search-text";
import type { TodaListItem } from "@/lib/toda/queries";

export type TodaFilter = {
  query: string;
  /** A name from todaBarangays(), or "" for every barangay. */
  barangay: string;
  hasContact: boolean;
  hasPin: boolean;
};

export const NO_TODA_FILTER: TodaFilter = { query: "", barangay: "", hasContact: false, hasPin: false };

/** The barangays a TODA's main and connected terminals stand in. */
const terminalBarangays = (toda: TodaListItem): string[] => [
  toda.barangay,
  ...toda.connectedTerminals.map((terminal) => terminal.barangay),
];

/** Every barangay a TODA waits in or says it serves. */
const barangaysOf = (toda: TodaListItem): string[] => [...terminalBarangays(toda), ...toda.barangaysServed];

const todaText = (toda: TodaListItem): string =>
  searchable(
    [toda.name, toda.terminalDescription, ...toda.connectedTerminals.map((terminal) => terminal.terminalDescription), ...barangaysOf(toda)].join(" "),
  );

// Connected terminals always carry a pin, so one of those counts even when the main
// terminal has none: the rider still has a place to open on the map.
export const hasPin = (toda: TodaListItem): boolean =>
  (toda.lat !== null && toda.lng !== null) || toda.connectedTerminals.length > 0;

export const hasContact = (toda: TodaListItem): boolean => Boolean(toda.officialContact?.trim());

// Numeric so "Zone 2" sorts before "Zone 10"; base sensitivity so case and accents tie.
const collator = new Intl.Collator("en", { numeric: true, sensitivity: "base" });

/**
 * The barangays the listed TODAs wait in or serve, sorted, for the barangay filter.
 * Residents type these by hand, so spellings that differ only in case, accents or
 * punctuation are listed once. A terminal's spelling wins over a "serves" entry, since
 * the terminal field is validated and checked by an admin.
 */
export function todaBarangays(todas: TodaListItem[]): string[] {
  const byKey = [...todas.flatMap(terminalBarangays), ...todas.flatMap((toda) => toda.barangaysServed)]
    .map((name) => name.trim())
    .reduce((names, name) => {
      const key = searchable(name);
      return key === "" || names.has(key) ? names : names.set(key, name);
    }, new Map<string, string>());
  return [...byKey.values()].sort(collator.compare);
}

/** TODAs that match every set filter, and whose text contains every word of the query. */
export function filterTodas(todas: TodaListItem[], filter: TodaFilter): TodaListItem[] {
  const words = searchWords(filter.query);
  const barangay = searchable(filter.barangay);
  return todas.filter((toda) => {
    if (filter.hasContact && !hasContact(toda)) return false;
    if (filter.hasPin && !hasPin(toda)) return false;
    if (barangay !== "" && !barangaysOf(toda).some((name) => searchable(name) === barangay)) return false;
    const text = todaText(toda);
    return words.every((word) => text.includes(word));
  });
}

export const isFiltered = (filter: TodaFilter): boolean =>
  searchWords(filter.query).length > 0 || filter.barangay !== "" || filter.hasContact || filter.hasPin;

export type TodaSortKey = "name" | "barangay";

/** Named like aria-sort's values so the table header can use it as is. */
export type TodaSort = { key: TodaSortKey; direction: "ascending" | "descending" };

/** Sorted by the main terminal's barangay or by name; ties fall back to name, A to Z. */
export function sortTodas(todas: TodaListItem[], { key, direction }: TodaSort): TodaListItem[] {
  const sign = direction === "ascending" ? 1 : -1;
  return todas.toSorted(
    (a, b) => sign * collator.compare(a[key], b[key]) || collator.compare(a.name, b.name),
  );
}
