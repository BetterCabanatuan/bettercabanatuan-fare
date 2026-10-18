import { Button, Heading, Hr, Text } from "react-email";

import { en } from "@/lib/i18n/dictionaries/en";
import { tl } from "@/lib/i18n/dictionaries/tl";
import { fill, type Locale } from "@/lib/i18n/locales";

import { button, EmailCard, heading, note, paragraph } from "../_components/email-card";

// Sent by the app (src/lib/notifications.tsx) to the person who sent a TODA or route,
// once an admin approves or rejects it, in the language they were reading in.

export type ReviewedKind = "toda" | "route";
export type ReviewOutcome = "approved" | "rejected";

export type SubmissionReviewedEmailProps = {
  locale: Locale;
  kind: ReviewedKind;
  outcome: ReviewOutcome;
  name: string;
  /** The admin's reason, for a rejection. */
  reason: string | null;
  reference: string;
  /** The directory or fare map when approved; the form to send it again when rejected. */
  actionUrl: string;
};

const dictionaries = { en, tl } satisfies Record<Locale, typeof en>;

export const submissionReviewedSubject = ({
  locale,
  kind,
  outcome,
  name,
}: Pick<SubmissionReviewedEmailProps, "locale" | "kind" | "outcome" | "name">): string =>
  fill(dictionaries[locale].reviewEmail[kind][outcome].subject, { name });

export default function SubmissionReviewedEmail(props: SubmissionReviewedEmailProps) {
  const { locale, kind, outcome, name, reason, reference, actionUrl } = props;
  const t = dictionaries[locale].reviewEmail;
  const text = t[kind][outcome];
  return (
    <EmailCard lang={locale} preview={submissionReviewedSubject(props)} footer={t.footer}>
      <Heading as="h1" style={heading}>
        {text.heading}
      </Heading>
      <Text style={paragraph}>{fill(text.body, { name })}</Text>
      {reason && <Text style={paragraph}>{fill(t.reason, { reason })}</Text>}
      <Button href={actionUrl} style={button}>
        {text.action}
      </Button>
      <Hr style={{ margin: "24px 0", borderColor: "#e5e7eb" }} />
      <Text style={note}>
        {fill(t.reference, { reference })}
        <br />
        {t.whySent}
      </Text>
    </EmailCard>
  );
}

SubmissionReviewedEmail.PreviewProps = {
  locale: "tl",
  kind: "route",
  outcome: "rejected",
  name: "Cabanatuan Terminal – Sangitan",
  reason: "The pin for B is outside Cabanatuan City. Move it to the terminal and send it again.",
  reference: "D4E5F6",
  actionUrl: "http://localhost:3000/tl/fare/suggest",
} satisfies SubmissionReviewedEmailProps;
