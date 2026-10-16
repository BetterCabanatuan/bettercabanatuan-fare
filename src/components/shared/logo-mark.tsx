import Image from "next/image";

/**
 * The fare app's mark, a sibling of the BetterCabanatuan logo: the city silhouette with the
 * Philippine sun rising behind it, where the sun is a peso coin. Decorative next to the
 * wordmark, so it has empty alt text. The favicon (app/icon.svg) is the peso sun alone,
 * because the city outline turns to mush at 16 px.
 */
export function LogoMark({ className }: { className?: string }) {
  return <Image src="/logo.svg" alt="" width={128} height={100} priority unoptimized className={className} />;
}
