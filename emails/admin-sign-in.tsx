import { Body, Button, Container, Head, Heading, Hr, Html, Link, Preview, Section, Text } from "react-email";

// Supabase sends this email, not the app: `npm run email:export` renders it to
// supabase/templates/admin-sign-in.html, which is pasted into both the "Magic link" and
// "Confirm signup" templates (docs/deploy/supabase.md). The {{ .RedirectTo }} and
// {{ .TokenHash }} placeholders are left for Supabase to fill in. RedirectTo is the
// app's /api/auth/confirm?next=... address, so the token joins with "&".
const SIGN_IN_URL = "{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=email";

// Brand palette from docs/brand/README.md.
const BLUE = "#0032A0";
const SUN = "#F2C91D";
const MUTED = "#5b6475";

// Default export: the React Email CLI renders each file's default export.
export default function AdminSignInEmail() {
  return (
    <Html lang="en">
      <Head />
      <Preview>Your Pamasahe Cabanatuan admin sign-in link</Preview>
      <Body style={{ margin: 0, backgroundColor: "#f4f6fa", fontFamily: "Inter, Helvetica, Arial, sans-serif" }}>
        <Container style={{ maxWidth: 480, margin: "0 auto", padding: "32px 16px" }}>
          <Section style={{ borderTop: `4px solid ${SUN}`, backgroundColor: "#ffffff", borderRadius: 12, padding: 32 }}>
            <Text style={{ margin: 0, fontSize: 14, fontWeight: 800, letterSpacing: "0.04em", color: BLUE }}>
              PAMASAHE CABANATUAN
            </Text>
            <Heading as="h1" style={{ margin: "16px 0 8px", fontSize: 24, lineHeight: "32px", color: "#111827" }}>
              Sign in to review submissions
            </Heading>
            <Text style={{ margin: "0 0 24px", fontSize: 16, lineHeight: "24px", color: "#111827" }}>
              Use this button to sign in to the admin pages, where you check TODA and jeep route submissions from
              residents. It works once and expires in 10 minutes.
            </Text>
            <Button
              href={SIGN_IN_URL}
              style={{
                display: "inline-block",
                backgroundColor: BLUE,
                color: "#ffffff",
                fontSize: 16,
                fontWeight: 700,
                padding: "12px 24px",
                borderRadius: 8,
                textDecoration: "none",
              }}
            >
              Sign in
            </Button>
            <Text style={{ margin: "24px 0 0", fontSize: 14, lineHeight: "20px", color: MUTED }}>
              If the button doesn&apos;t work, copy this link into your browser:
              <br />
              <Link href={SIGN_IN_URL} style={{ color: BLUE, wordBreak: "break-all" }}>
                {SIGN_IN_URL}
              </Link>
            </Text>
            <Hr style={{ margin: "24px 0", borderColor: "#e5e7eb" }} />
            <Text style={{ margin: 0, fontSize: 14, lineHeight: "20px", color: MUTED }}>
              Didn&apos;t ask for this? Ignore this email. No one can sign in without opening the link.
            </Text>
          </Section>
          <Text style={{ margin: "16px 0 0", fontSize: 12, lineHeight: "18px", color: MUTED, textAlign: "center" }}>
            Pamasahe Cabanatuan, community-made with BetterCabanatuan.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
