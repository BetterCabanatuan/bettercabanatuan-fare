import Image from "next/image";

/**
 * The Pamasahe mark: the city silhouette with the Philippine sun rising behind it and the
 * peso inside the sun. It is the lockup (public/logo-lockup.svg) without the wordmark, so
 * the navbar can set "Pamasahe" and the city name as text that follows the language.
 * Decorative next to that text, so it has empty alt text. The peso is black on a see-through
 * disc, so the mark needs a light background.
 */
export function LogoMark({ className }: { className?: string }) {
  return <Image src="/logo.svg" alt="" width={611} height={476} priority unoptimized className={className} />;
}
