import type { CSSProperties, ReactNode } from "react";
import { Body, Container, Head, Html, Preview, Section, Text } from "react-email";

// Shared by every template. The React Email CLI skips folders that start with "_", so
// this file is never previewed or exported as an email of its own.

// Brand palette from docs/brand/README.md.
export const BLUE = "#0032A0";
export const SUN = "#F2C91D";
export const MUTED = "#5b6475";
const INK = "#111827";

export const heading: CSSProperties = { margin: "16px 0 8px", fontSize: 24, lineHeight: "32px", color: INK };
export const paragraph: CSSProperties = { margin: "0 0 24px", fontSize: 16, lineHeight: "24px", color: INK };
export const note: CSSProperties = { margin: 0, fontSize: 14, lineHeight: "20px", color: MUTED };
export const button: CSSProperties = {
  display: "inline-block",
  backgroundColor: BLUE,
  color: "#ffffff",
  fontSize: 16,
  fontWeight: 700,
  padding: "12px 24px",
  borderRadius: 8,
  textDecoration: "none",
};

type EmailCardProps = { lang: string; preview: string; footer: string; children: ReactNode };

/** The white card with the brand line on top and the footer under it. */
export function EmailCard({ lang, preview, footer, children }: EmailCardProps): ReactNode {
  return (
    <Html lang={lang}>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ margin: 0, backgroundColor: "#f4f6fa", fontFamily: "Inter, Helvetica, Arial, sans-serif" }}>
        <Container style={{ maxWidth: 480, margin: "0 auto", padding: "32px 16px" }}>
          <Section style={{ borderTop: `4px solid ${SUN}`, backgroundColor: "#ffffff", borderRadius: 12, padding: 32 }}>
            <Text style={{ margin: 0, fontSize: 14, fontWeight: 800, letterSpacing: "0.04em", color: BLUE }}>
              PAMASAHE CABANATUAN
            </Text>
            {children}
          </Section>
          <Text style={{ margin: "16px 0 0", fontSize: 12, lineHeight: "18px", color: MUTED, textAlign: "center" }}>
            {footer}
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
