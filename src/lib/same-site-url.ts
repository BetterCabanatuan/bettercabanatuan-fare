// Resolved and checked rather than string-matched: "//evil.example" and "/\evil.example"
// both leave the site. Falling back keeps a sign-in link from becoming an open redirect.
export function sameSiteUrl(next: string, base: string, fallback: string): URL {
  const url = new URL(next, base);
  return url.origin === new URL(base).origin ? url : new URL(fallback, base);
}
