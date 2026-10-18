import "server-only";

import NewSubmissionEmail, { newSubmissionSubject, type SubmissionKind } from "@/emails/app/new-submission";
import SubmissionReviewedEmail, {
  submissionReviewedSubject,
  type ReviewedKind,
  type ReviewOutcome,
} from "@/emails/app/submission-reviewed";
import { parseAdminEmails } from "@/lib/admins";
import { sendEmail } from "@/lib/email";
import { defaultLocale, hasLocale, localizePath } from "@/lib/i18n/locales";
import { siteUrl } from "@/lib/site";
import { contactEmail } from "@/lib/toda/submission";

// The emails the app sends. Server Actions call these inside `after()`, so the rider or
// admin gets their answer without waiting for the mail to go out.

const reviewPaths: Record<SubmissionKind, string> = {
  toda: "/admin/todas",
  route: "/admin/routes",
  feedback: "/admin/feedback",
};

// Approved: where it now appears. Rejected: the form, to send a fixed one.
const actionPaths: Record<ReviewedKind, Record<ReviewOutcome, string>> = {
  toda: { approved: "/toda", rejected: "/toda/submit" },
  route: { approved: "/fare?mode=jeep", rejected: "/fare/suggest" },
};

/** The code riders see after sending, e.g. "A1B2C3", so both sides can name a submission. */
const reference = (id: string): string => id.slice(-6).toUpperCase();

type NewSubmission = { kind: SubmissionKind; id: string; name: string; from: string | null };

/** Tells every admin in ADMIN_EMAILS that something is waiting for review. */
export async function notifyAdmins({ kind, id, name, from }: NewSubmission): Promise<void> {
  await sendEmail({
    to: [...parseAdminEmails(process.env.ADMIN_EMAILS)],
    subject: newSubmissionSubject({ kind, name }),
    body: (
      <NewSubmissionEmail
        kind={kind}
        name={name}
        from={from}
        reference={reference(id)}
        reviewUrl={`${siteUrl}${reviewPaths[kind]}`}
      />
    ),
  });
}

type Review = {
  kind: ReviewedKind;
  outcome: ReviewOutcome;
  id: string;
  name: string;
  reason?: string;
  submitterContact: string | null;
  /** As stored with the submission; anything unexpected falls back to English. */
  locale: string;
};

/** Tells the submitter the admin's decision, when they left an email address. */
export async function notifySubmitter({ kind, outcome, id, name, reason, submitterContact, locale }: Review): Promise<void> {
  const to = contactEmail(submitterContact);
  if (!to) return;

  const language = hasLocale(locale) ? locale : defaultLocale;
  await sendEmail({
    to: [to],
    subject: submissionReviewedSubject({ locale: language, kind, outcome, name }),
    body: (
      <SubmissionReviewedEmail
        locale={language}
        kind={kind}
        outcome={outcome}
        name={name}
        reason={reason ?? null}
        reference={reference(id)}
        actionUrl={`${siteUrl}${localizePath(language, actionPaths[kind][outcome])}`}
      />
    ),
  });
}
