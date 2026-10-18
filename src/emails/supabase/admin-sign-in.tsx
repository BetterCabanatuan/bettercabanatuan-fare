import { Button, Heading, Hr, Link, Text } from "react-email";

import { BLUE, button, EmailCard, heading, note, paragraph } from "../_components/email-card";

// Supabase sends this email, not the app: `npm run email:export` renders it to
// supabase/templates/admin-sign-in.html, which is pasted into both the "Magic link" and
// "Confirm signup" templates (docs/deploy/supabase.md). The {{ .RedirectTo }} and
// {{ .TokenHash }} placeholders are left for Supabase to fill in. RedirectTo is the
// app's /api/auth/confirm?next=... address, so the token joins with "&".
const SIGN_IN_URL = "{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=email";

// Default export: the React Email CLI renders each file's default export.
export default function AdminSignInEmail() {
  return (
    <EmailCard
      lang="en"
      preview="Your Pamasahe Cabanatuan admin sign-in link"
      footer="Pamasahe Cabanatuan, community-made with BetterCabanatuan."
    >
      <Heading as="h1" style={heading}>
        Sign in to review submissions
      </Heading>
      <Text style={paragraph}>
        Use this button to sign in to the admin pages, where you check TODA and jeep route submissions from residents.
        It works once and expires in 10 minutes.
      </Text>
      <Button href={SIGN_IN_URL} style={button}>
        Sign in
      </Button>
      <Text style={{ ...note, margin: "24px 0 0" }}>
        If the button doesn&apos;t work, copy this link into your browser:
        <br />
        <Link href={SIGN_IN_URL} style={{ color: BLUE, wordBreak: "break-all" }}>
          {SIGN_IN_URL}
        </Link>
      </Text>
      <Hr style={{ margin: "24px 0", borderColor: "#e5e7eb" }} />
      <Text style={note}>Didn&apos;t ask for this? Ignore this email. No one can sign in without opening the link.</Text>
    </EmailCard>
  );
}
