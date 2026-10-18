import { Button, Heading, Text } from "react-email";

import { button, EmailCard, heading, note, paragraph } from "../_components/email-card";

// Sent by the app (src/lib/notifications.tsx) to everyone in ADMIN_EMAILS. English only,
// like the admin pages. It names the submission but leaves the details on the review
// page, so riders' contact details and messages don't pile up in inboxes.

export type SubmissionKind = "toda" | "route" | "feedback";

export type NewSubmissionEmailProps = {
  kind: SubmissionKind;
  /** The TODA's name, the route's name, or the feedback's topic. */
  name: string;
  from: string | null;
  reference: string;
  reviewUrl: string;
};

const copy = {
  toda: { heading: "New TODA to review", label: "TODA", action: "Review TODAs" },
  route: { heading: "New jeep route to review", label: "Route", action: "Review routes" },
  feedback: { heading: "New feedback", label: "Topic", action: "Read feedback" },
} as const satisfies Record<SubmissionKind, { heading: string; label: string; action: string }>;

export const newSubmissionSubject = ({ kind, name }: Pick<NewSubmissionEmailProps, "kind" | "name">): string =>
  `${copy[kind].heading}: ${name}`;

export default function NewSubmissionEmail({ kind, name, from, reference, reviewUrl }: NewSubmissionEmailProps) {
  const text = copy[kind];
  return (
    <EmailCard lang="en" preview={newSubmissionSubject({ kind, name })} footer="Sent to the admins in ADMIN_EMAILS.">
      <Heading as="h1" style={heading}>
        {text.heading}
      </Heading>
      <Text style={paragraph}>
        {text.label}: <strong>{name}</strong>
        <br />
        From: {from ?? "not given"}
        <br />
        Reference: {reference}
      </Text>
      <Button href={reviewUrl} style={button}>
        {text.action}
      </Button>
      <Text style={{ ...note, margin: "24px 0 0" }}>Nothing is published until an admin approves it.</Text>
    </EmailCard>
  );
}

NewSubmissionEmail.PreviewProps = {
  kind: "toda",
  name: "Sumacab Este TODA",
  from: "Juan dela Cruz",
  reference: "A1B2C3",
  reviewUrl: "http://localhost:3000/admin/todas",
} satisfies NewSubmissionEmailProps;
