// Validation for rider feedback. Shared by the form (instant feedback) and the server
// action (the check that counts), so both apply the same rules.
//
// Messages are keys into `dict.feedback.errors`, so the form shows them in the reader's
// language while the action stays dictionary-free.
import { z } from "zod";

import { localizePath, type Locale } from "@/lib/i18n/locales";

export const FEEDBACK_LIMITS = { minMessage: 10, maxMessage: 2000, pagePath: 500 } as const;

export const FEEDBACK_TOPICS = ["WRONG_FARE", "WRONG_ROUTE", "APP_PROBLEM", "SUGGESTION", "OTHER"] as const;
export type FeedbackTopic = (typeof FEEDBACK_TOPICS)[number];

const ERROR_KEYS = ["topic", "messageShort", "messageLong", "invalid"] as const;
export type FeedbackErrorKey = (typeof ERROR_KEYS)[number];

const isErrorKey = (value: string): value is FeedbackErrorKey => ERROR_KEYS.some((key) => key === value);

/**
 * A path on this site, such as the fare map with the rider's trip, so an admin can open
 * what the rider was looking at. Anything else (another site, "//host") is dropped.
 */
export function sitePath(value: string | null | undefined): string | undefined {
  const path = value?.trim() ?? "";
  const local = path.startsWith("/") && !path.startsWith("//") && !path.startsWith("/\\");
  return local && path.length <= FEEDBACK_LIMITS.pagePath ? path : undefined;
}

/** The feedback page in the rider's language, remembering the page they came from. */
export function feedbackPath(locale: Locale, from?: string): string {
  const path = localizePath(locale, "/feedback");
  const page = sitePath(from);
  return page ? `${path}?${new URLSearchParams({ from: page })}` : path;
}

export const feedbackSchema = z.object({
  topic: z.enum(FEEDBACK_TOPICS, "topic"),
  message: z
    .string("messageShort")
    .trim()
    .min(FEEDBACK_LIMITS.minMessage, "messageShort")
    .max(FEEDBACK_LIMITS.maxMessage, "messageLong"),
  pagePath: z
    .string()
    .optional()
    .transform((value) => sitePath(value)),
});

/** What the form posts: plain strings, checked by the schema. */
export type FeedbackInput = { topic: string; message: string; pagePath?: string };
export type Feedback = z.output<typeof feedbackSchema>;
export type FeedbackField = keyof FeedbackInput;
export type FieldErrors = Partial<Record<FeedbackField, FeedbackErrorKey>>;

export type ParseResult = { success: true; data: Feedback } | { success: false; fieldErrors: FieldErrors };

/** Turns the posted form into the shape the schema expects. */
export function formDataToInput(formData: FormData): FeedbackInput {
  const text = (key: string): string => String(formData.get(key) ?? "");
  return { topic: text("topic"), message: text("message"), pagePath: text("pagePath") || undefined };
}

export function parseFeedback(input: FeedbackInput): ParseResult {
  const result = feedbackSchema.safeParse(input);
  if (result.success) return { success: true, data: result.data };

  const fieldErrors = result.error.issues.reduce<FieldErrors>((errors, issue) => {
    // The schema is a flat object, so the first path segment is always one of its keys.
    const field = issue.path[0] as FeedbackField | undefined;
    if (!field || errors[field]) return errors;
    return { ...errors, [field]: isErrorKey(issue.message) ? issue.message : "invalid" };
  }, {});
  return { success: false, fieldErrors };
}
