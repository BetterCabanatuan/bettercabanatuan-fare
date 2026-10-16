// Turns the free-text `source` notes in data/ into links. Pure, so the map popups
// (client) and the Sources page (server) share it.

export type SourcePart = { at: number; text: string; href?: string };

// Trailing punctuation belongs to the sentence, not the URL.
const URL_PATTERN = /https?:\/\/[^\s"<>]+[^\s"<>.,;:)]/g;
// "OpenStreetMap way 837741332" or "OpenStreetMap nodes 1003847611 and ...": links the first id.
const SOURCE_PATTERN = /https?:\/\/[^\s"<>]+[^\s"<>.,;:)]|OpenStreetMap (way|node|relation)s? (\d+)/g;

/** Every URL in a parsed JSON value, in order, without repeats. */
export function collectUrls(value: unknown): string[] {
  const found = (item: unknown): string[] => {
    if (typeof item === "string") return item.match(URL_PATTERN) ?? [];
    if (Array.isArray(item)) return item.flatMap(found);
    if (item && typeof item === "object") return Object.values(item).flatMap(found);
    return [];
  };
  return [...new Set(found(value))];
}

/** "https://www.pna.gov.ph/articles/1196835" → "pna.gov.ph/articles/1196835". */
export function displayUrl(url: string): string {
  const { hostname, pathname } = new URL(url);
  const path = pathname === "/" ? "" : pathname.replace(/\/$/, "");
  const readable = (() => {
    try {
      return decodeURI(path);
    } catch {
      return path;
    }
  })();
  return hostname.replace(/^www\./, "") + readable;
}

/** Splits a source note into plain text and links (URLs and OpenStreetMap object ids). */
export function sourceParts(source: string): SourcePart[] {
  const parts: SourcePart[] = [];
  const end = [...source.matchAll(SOURCE_PATTERN)].reduce((from, match) => {
    if (match.index > from) parts.push({ at: from, text: source.slice(from, match.index) });
    const [text, osmType, osmId] = match;
    parts.push(
      osmType
        ? { at: match.index, text, href: `https://www.openstreetmap.org/${osmType}/${osmId}` }
        : { at: match.index, text: displayUrl(text), href: text },
    );
    return match.index + text.length;
  }, 0);
  if (end < source.length) parts.push({ at: end, text: source.slice(end) });
  return parts;
}
