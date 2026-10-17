// The contributors board at /contributors: who has had route suggestions approved, and
// the public name each rider chose. Pure functions, shared by the page, its action and tests.
//
// Name errors are keys into `dict.contributors.nameErrors`, so the form shows them in the
// reader's language while the action stays dictionary-free.

export const PUBLIC_NAME_LIMITS = { min: 2, max: 40 } as const;

/** How many riders the board lists. A signed-in rider below it still sees their rank. */
export const BOARD_SIZE = 100;

export type PublicNameErrorKey = "length" | "contact";

export type PublicNameResult = { success: true; name: string } | { success: false; error: PublicNameErrorKey };

// Seven digits in a row, ignoring the spaces, dashes and brackets people type in phone
// numbers, is a phone number. A year or a jeep's route number is shorter.
const PHONE_LIKE = /\d{7,}/;
const PHONE_SEPARATORS = /[\s\-().+]/g;

/**
 * Checks a name a rider wants shown publicly. Names are published next to their count,
 * so anything that looks like an email address or phone number is refused: riders
 * sometimes type contact details where a name should go.
 */
export function parsePublicName(value: string): PublicNameResult {
  const name = value.trim().replace(/\s+/g, " ");
  if (name.length < PUBLIC_NAME_LIMITS.min || name.length > PUBLIC_NAME_LIMITS.max) {
    return { success: false, error: "length" };
  }
  if (name.includes("@") || PHONE_LIKE.test(name.replace(PHONE_SEPARATORS, ""))) {
    return { success: false, error: "contact" };
  }
  return { success: true, name };
}

/** One row of `route_contributor_board()`, as the database returns it. */
export type BoardRow = {
  userId: string;
  publicName: string | null;
  approved: number;
  latest: string;
  rank: number;
};

/** A board row as the page shows it. User ids stay on the server. */
export type BoardEntry = {
  /** Stands in for the user id as a list key; React sends keys to the browser. */
  key: string;
  rank: number;
  /** Null shows as "Anonymous rider". */
  name: string | null;
  approved: number;
  latest: Date;
  isYou: boolean;
};

export type Board = {
  top: BoardEntry[];
  /** The signed-in rider's own row, when they have one, wherever it falls. */
  you: BoardEntry | null;
};

/** FNV-1a: a short, one-way stand-in for a user id. Collisions only cost a React warning. */
function opaqueKey(userId: string): string {
  const hash = [...userId].reduce((sum, char) => Math.imul(sum ^ char.charCodeAt(0), 0x01000193), 0x811c9dc5);
  return (hash >>> 0).toString(36);
}

/** The top of the board, plus the signed-in rider's row. Rows arrive already ranked. */
export function toBoard(rows: BoardRow[], riderId: string | null, size: number = BOARD_SIZE): Board {
  const entries = rows.map(
    (row): BoardEntry => ({
      key: opaqueKey(row.userId),
      rank: row.rank,
      name: row.publicName || null,
      approved: row.approved,
      latest: new Date(row.latest),
      isYou: riderId !== null && row.userId === riderId,
    }),
  );
  return { top: entries.slice(0, size), you: entries.find((entry) => entry.isYou) ?? null };
}
