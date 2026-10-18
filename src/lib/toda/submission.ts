// Validation for resident TODA submissions. Shared by the form (instant feedback) and
// the server action (the check that counts), so both apply the same rules.
import { z } from "zod";

import { isInsideRing, type LngLat } from "@/lib/geo";
import { terminalBarangaySchema, terminalDescriptionSchema } from "@/lib/toda/terminals";

export const SUBMISSION_LIMITS = {
  barangaysServed: 20,
  notes: 1000,
} as const;

const optionalText = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, `${label} must be ${max} characters or fewer.`)
    .transform((value) => value || undefined)
    .optional();

const barangayName = z
  .string()
  .trim()
  .min(2, "Barangay names need at least 2 characters.")
  .max(60, "Barangay names must be 60 characters or fewer.");

// Landline or mobile, with the usual separators. Not tied to one format because
// TODA offices publish numbers in many styles.
const PHONE = /^\+?[\d\s()-]{7,20}$/;

export const submissionSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(3, "Enter the TODA's name, e.g. Sumacab Este TODA.")
      .max(80, "The name must be 80 characters or fewer."),
    terminalDescription: terminalDescriptionSchema,
    barangay: terminalBarangaySchema,
    lat: z.number().min(-90).max(90).optional(),
    lng: z.number().min(-180).max(180).optional(),
    barangaysServed: z
      .array(barangayName)
      .max(SUBMISSION_LIMITS.barangaysServed, `List up to ${SUBMISSION_LIMITS.barangaysServed} barangays.`)
      .transform(dedupeCaseInsensitive),
    units: z.number().int("Units must be a whole number.").min(1).max(5000).optional(),
    officialContact: optionalText(40, "The contact").refine(
      (value) => value === undefined || PHONE.test(value),
      "Use a phone number, e.g. 0917 123 4567 or (044) 463 0000.",
    ),
    submitterName: optionalText(80, "Your name"),
    submitterContact: optionalText(100, "Your contact"),
    notes: optionalText(SUBMISSION_LIMITS.notes, "Notes"),
    // True when this is another terminal of a listed TODA rather than its main one.
    connectedTerminal: z.boolean().default(false),
  })
  .refine((value) => (value.lat === undefined) === (value.lng === undefined), {
    message: "Pin the terminal on the map again.",
    path: ["lat"],
  })
  // Connected terminals are positions, so each needs its own pin.
  .refine((value) => !value.connectedTerminal || value.lat !== undefined, {
    message: "Pin this terminal on the map. Another terminal needs its own pin.",
    path: ["lat"],
  });

export type SubmissionInput = z.input<typeof submissionSchema>;
export type Submission = z.output<typeof submissionSchema>;
export type SubmissionField = keyof SubmissionInput;
export type FieldErrors = Partial<Record<SubmissionField, string>>;

/** Turns the posted form into the shape the schema expects. */
export function formDataToInput(formData: FormData): SubmissionInput {
  const text = (key: string) => String(formData.get(key) ?? "");
  const number = (key: string) => {
    const raw = text(key).trim();
    return raw === "" ? undefined : Number(raw);
  };

  return {
    name: text("name"),
    terminalDescription: text("terminalDescription"),
    barangay: text("barangay"),
    lat: number("lat"),
    lng: number("lng"),
    barangaysServed: formData
      .getAll("barangaysServed")
      .map(String)
      .filter((value) => value.trim() !== ""),
    units: number("units"),
    officialContact: text("officialContact"),
    submitterName: text("submitterName"),
    submitterContact: text("submitterContact"),
    notes: text("notes"),
    connectedTerminal: text("connectedTerminal") === "true",
  };
}

export type ParseResult =
  | { success: true; data: Submission }
  | { success: false; fieldErrors: FieldErrors };

/**
 * Validates a submission. When a city boundary is given, a pinned terminal must fall
 * inside it, which catches pins dropped in the wrong town.
 */
export function parseSubmission(input: SubmissionInput, boundary?: LngLat[]): ParseResult {
  const result = submissionSchema.safeParse(input);
  if (!result.success) {
    const fieldErrors: FieldErrors = {};
    for (const issue of result.error.issues) {
      const field = issue.path[0] as SubmissionField | undefined;
      if (field && !fieldErrors[field]) fieldErrors[field] = issue.message;
    }
    return { success: false, fieldErrors };
  }

  const { lat, lng } = result.data;
  if (boundary && lat !== undefined && lng !== undefined && !isInsideRing([lng, lat], boundary)) {
    return { success: false, fieldErrors: { lat: "The pin is outside Cabanatuan City. Move it to the terminal." } };
  }
  return { success: true, data: result.data };
}

export const rejectionSchema = z
  .string()
  .trim()
  .min(5, "Give the resident a reason, at least 5 characters.")
  .max(300, "Keep the reason to 300 characters.");

/**
 * The submitter's contact when it is an email address, so they can be told the admin's
 * decision. The TODA form asks for "mobile number or email", so it is often a number.
 */
export function contactEmail(contact: string | null): string | null {
  const parsed = z.email().safeParse(contact?.trim());
  return parsed.success ? parsed.data : null;
}

/** Directory id for a TODA: "Sumacab Este TODA" → "sumacab-este-toda". */
export function todaSlug(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function dedupeCaseInsensitive(values: string[]): string[] {
  const seen = new Set<string>();
  return values.filter((value) => {
    const key = value.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
