// Shared facts for the Privacy Policy and Terms of Use. The page text lives in the
// dictionaries; change LEGAL_UPDATED whenever that text changes in a way riders should know.

export const LEGAL_UPDATED = "2026-10-17";

/** Where riders send privacy requests and questions about the terms. */
export const CONTACT_EMAIL = "bettercabanatuan@gmail.com";

/** One section of a legal page. `id` is the anchor other pages link to, e.g. /privacy#delete. */
export type LegalSection = {
  id: string;
  heading: string;
  paragraphs: string[];
  items?: string[];
};
