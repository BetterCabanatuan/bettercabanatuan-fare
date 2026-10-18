import "server-only";

import type { ReactElement } from "react";
import { render } from "react-email";

// Emails the app sends itself go through Resend's HTTP API. (Admin sign-in links are
// sent by Supabase over SMTP instead; see docs/deploy/supabase.md.)
const RESEND_URL = "https://api.resend.com/emails";
const TIMEOUT_MS = 10_000;

type Email = { to: string[]; subject: string; body: ReactElement };

/**
 * Sends one email. It never throws: by the time it runs, the submission or review it
 * reports is already saved, and a mail outage must not look like that failed. Problems
 * go to the Worker logs instead. Without RESEND_API_KEY or EMAIL_FROM (e.g. local
 * development) it logs the subject and sends nothing.
 */
export async function sendEmail({ to, subject, body }: Email): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    console.warn(`[email] RESEND_API_KEY or EMAIL_FROM is not set; not sending "${subject}"`);
    return;
  }
  if (to.length === 0) return;

  try {
    const [html, text] = await Promise.all([render(body), render(body, { plainText: true })]);
    const response = await fetch(RESEND_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, subject, html, text }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) {
      console.error(`[email] Resend refused "${subject}" with status ${response.status}`, await response.text());
    }
  } catch (error) {
    console.error(`[email] Could not send "${subject}"`, error);
  }
}
