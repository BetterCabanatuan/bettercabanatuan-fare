// Validation for resident jeep route suggestions. Shared by the form (instant feedback)
// and the server action (the check that counts), so both apply the same rules.
//
// Messages are keys into `dict.suggest.errors` rather than sentences, so the form can
// show them in the reader's language while the action stays dictionary-free.
import { z } from "zod";

import { toCentavos } from "@/lib/fare";
import { isInsideRing, type LngLat } from "@/lib/geo";

export const SUBMISSION_LIMITS = {
  name: 80,
  via: 120,
  notes: 1000,
  farePesos: 500,
} as const;

export const JEEP_TYPES = ["TRADITIONAL", "MODERN", "UNKNOWN"] as const;
export type JeepTypeInput = (typeof JEEP_TYPES)[number];

const ERROR_KEYS = [
  "fromName",
  "toName",
  "fromPin",
  "toPin",
  "outsideCity",
  "via",
  "jeepType",
  "farePaid",
  "submitterName",
  "submitterContact",
  "notes",
  "invalid",
] as const;
export type SubmissionErrorKey = (typeof ERROR_KEYS)[number];

const isErrorKey = (value: string): value is SubmissionErrorKey =>
  ERROR_KEYS.some((key) => key === value);

const optionalText = (max: number, key: SubmissionErrorKey) =>
  z
    .string()
    .trim()
    .max(max, key)
    .transform((value) => value || undefined)
    .optional();

const placeName = (key: SubmissionErrorKey) => z.string().trim().min(2, key).max(SUBMISSION_LIMITS.name, key);

// A missing or non-numeric coordinate means the pin was never set.
const latitude = (key: SubmissionErrorKey) => z.number(key).min(-90, key).max(90, key);
const longitude = (key: SubmissionErrorKey) => z.number(key).min(-180, key).max(180, key);

export const submissionSchema = z.object({
  fromName: placeName("fromName"),
  toName: placeName("toName"),
  fromLat: latitude("fromPin"),
  fromLng: longitude("fromPin"),
  toLat: latitude("toPin"),
  toLng: longitude("toPin"),
  via: optionalText(SUBMISSION_LIMITS.via, "via"),
  jeepType: z.enum(JEEP_TYPES, "jeepType").default("UNKNOWN"),
  farePaid: z
    .number("farePaid")
    .min(1, "farePaid")
    .max(SUBMISSION_LIMITS.farePesos, "farePaid")
    .transform(toCentavos)
    .optional(),
  submitterName: optionalText(80, "submitterName"),
  submitterContact: optionalText(100, "submitterContact"),
  notes: optionalText(SUBMISSION_LIMITS.notes, "notes"),
});

type Coordinate = "fromLat" | "fromLng" | "toLat" | "toLng";
// A pin that was never set posts as an empty string; the schema turns that into an error.
export type SubmissionInput = Omit<z.input<typeof submissionSchema>, Coordinate> &
  Record<Coordinate, number | undefined>;
export type Submission = z.output<typeof submissionSchema>;
export type SubmissionField = keyof SubmissionInput;
export type FieldErrors = Partial<Record<SubmissionField, SubmissionErrorKey>>;

/** Turns the posted form into the shape the schema expects. */
export function formDataToInput(formData: FormData): SubmissionInput {
  const text = (key: string) => String(formData.get(key) ?? "");
  const number = (key: string) => {
    const raw = text(key).trim();
    return raw === "" ? undefined : Number(raw);
  };
  const jeepType = text("jeepType");

  return {
    fromName: text("fromName"),
    toName: text("toName"),
    fromLat: number("fromLat"),
    fromLng: number("fromLng"),
    toLat: number("toLat"),
    toLng: number("toLng"),
    via: text("via"),
    jeepType: jeepType === "" ? undefined : (jeepType as JeepTypeInput),
    farePaid: number("farePaid"),
    submitterName: text("submitterName"),
    submitterContact: text("submitterContact"),
    notes: text("notes"),
  };
}

export type ParseResult =
  | { success: true; data: Submission }
  | { success: false; fieldErrors: FieldErrors };

/**
 * Validates a suggestion. When a city boundary is given, at least one end of the route
 * must fall inside it: every Cabanatuan jeep touches the city, so a route with both pins
 * outside was dropped in the wrong town.
 */
export function parseSubmission(input: SubmissionInput, boundary?: LngLat[]): ParseResult {
  const result = submissionSchema.safeParse(input);
  if (!result.success) {
    const fieldErrors: FieldErrors = {};
    for (const issue of result.error.issues) {
      const field = issue.path[0] as SubmissionField | undefined;
      if (field && !fieldErrors[field]) fieldErrors[field] = isErrorKey(issue.message) ? issue.message : "invalid";
    }
    return { success: false, fieldErrors };
  }

  const { fromLat, fromLng, toLat, toLng } = result.data;
  if (boundary && !isInsideRing([fromLng, fromLat], boundary) && !isInsideRing([toLng, toLat], boundary)) {
    return { success: false, fieldErrors: { fromLat: "outsideCity" } };
  }
  return { success: true, data: result.data };
}

/** The route's display name when the rider gives none: "Cabanatuan – Talavera". */
export const routeName = (fromName: string, toName: string): string => `${fromName} – ${toName}`;
