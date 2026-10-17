// A TODA's positions: the main terminal (columns on "toda") plus any connected terminals
// (the "connectedTerminals" JSONB column). Shared by the directory, which reads them, and
// the admin editor, which writes them.
import { z } from "zod";

import { isInsideRing, type LngLat } from "@/lib/geo";

/** Matches the CHECK on "toda"."connectedTerminals". */
export const MAX_CONNECTED_TERMINALS = 10;

export const terminalDescriptionSchema = z
  .string()
  .trim()
  .min(5, "Describe where the terminal or waiting area is.")
  .max(200, "Keep the terminal description to 200 characters.");

export const terminalBarangaySchema = z
  .string()
  .trim()
  .min(2, "Enter the barangay where the terminal is.")
  .max(60, "Barangay names must be 60 characters or fewer.");

const latSchema = z.number().min(-90).max(90);
const lngSchema = z.number().min(-180).max(180);

// A connected terminal is a position, so unlike the main terminal it always has a pin.
const connectedTerminalSchema = z.object({
  terminalDescription: terminalDescriptionSchema,
  barangay: terminalBarangaySchema,
  lat: latSchema,
  lng: lngSchema,
});

export const connectedTerminalsSchema = z.array(connectedTerminalSchema).max(MAX_CONNECTED_TERMINALS);

export type ConnectedTerminal = z.output<typeof connectedTerminalSchema>;

export type TerminalInput = {
  terminalDescription: string;
  barangay: string;
  lat?: number;
  lng?: number;
};

export type MainTerminal = {
  terminalDescription: string;
  barangay: string;
  lat: number | null;
  lng: number | null;
};

export type TerminalsResult =
  | { success: true; main: MainTerminal; connected: ConnectedTerminal[] }
  | { success: false; index: number; message: string };

const mainTerminalSchema = z
  .object({
    terminalDescription: terminalDescriptionSchema,
    barangay: terminalBarangaySchema,
    lat: latSchema.optional(),
    lng: lngSchema.optional(),
  })
  .refine((value) => (value.lat === undefined) === (value.lng === undefined), "Pin the terminal on the map again.");

/**
 * Validates an admin's edit of every position. The first entry is the main terminal and
 * may have no pin, like older listings; the rest are connected terminals and need one.
 * Every pin must fall inside the city boundary.
 */
export function parseTerminals(input: TerminalInput[], boundary: LngLat[]): TerminalsResult {
  if (input.length === 0) return { success: false, index: 0, message: "A TODA needs its main terminal." };
  if (input.length > MAX_CONNECTED_TERMINALS + 1) {
    return { success: false, index: input.length - 1, message: `List up to ${MAX_CONNECTED_TERMINALS} other terminals.` };
  }

  const [mainInput, ...connectedInput] = input;
  const main = mainTerminalSchema.safeParse(mainInput);
  if (!main.success) return { success: false, index: 0, message: main.error.issues[0].message };

  const parsed = connectedInput.map((terminal) => connectedTerminalSchema.safeParse(terminal));
  const failed = parsed.findIndex((result) => !result.success);
  const failure = parsed[failed]?.error;
  if (failure) {
    const pinMissing = failure.issues.some((issue) => issue.path[0] === "lat" || issue.path[0] === "lng");
    return { success: false, index: failed + 1, message: pinMissing ? "Pin this terminal on the map." : failure.issues[0].message };
  }
  const connected = parsed.flatMap((result) => (result.success ? [result.data] : []));

  const outside = [main.data, ...connected].findIndex(
    ({ lat, lng }) => lat !== undefined && lng !== undefined && !isInsideRing([lng, lat], boundary),
  );
  if (outside !== -1) {
    return { success: false, index: outside, message: "The pin is outside Cabanatuan City. Move it to the terminal." };
  }

  const { terminalDescription, barangay, lat, lng } = main.data;
  return { success: true, main: { terminalDescription, barangay, lat: lat ?? null, lng: lng ?? null }, connected };
}

/** Reads the editor's rows, posted as repeated fields in order. */
export function formDataToTerminals(formData: FormData): TerminalInput[] {
  const all = (key: string) => formData.getAll(key).map(String);
  const number = (raw: string | undefined) => (raw === undefined || raw.trim() === "" ? undefined : Number(raw));
  const lats = all("lat");
  const lngs = all("lng");
  const barangays = all("barangay");
  return all("terminalDescription").map((terminalDescription, i) => ({
    terminalDescription,
    barangay: barangays[i] ?? "",
    lat: number(lats[i]),
    lng: number(lngs[i]),
  }));
}
