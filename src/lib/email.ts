import "server-only";

// Sends the admin sign-in link. Uses Resend's HTTP API when RESEND_API_KEY is set.
// Without it, development prints the link to the server console; production refuses,
// so a misconfigured deploy fails loudly instead of silently never sending.
export async function sendMagicLinkEmail({ email, url }: { email: string; url: string }) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("RESEND_API_KEY is not set, so the sign-in link cannot be emailed.");
    }
    console.info(`\n[auth] Sign-in link for ${email}:\n${url}\n`);
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM ?? "Pamasahe Cabanatuan <onboarding@resend.dev>",
      to: email,
      subject: "Your Pamasahe Cabanatuan admin sign-in link",
      text: `Open this link to sign in to the TODA review page. It expires in 10 minutes.\n\n${url}\n\nIf you didn't ask for this, ignore this email.`,
    }),
  });

  if (!response.ok) {
    throw new Error(`Resend rejected the sign-in email (${response.status}).`);
  }
}
