import type { SVGProps } from "react";

/**
 * The Pamasahe mark: a peso sign in a map pin, "the fare for this place".
 * Same drawing as public/logo.svg; the favicon (app/icon.svg) uses a heavier one-bar cut
 * because two bars blur together at 16 px.
 */
export function LogoMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" {...props}>
      <rect width="64" height="64" rx="14" fill="#1B3F8B" />
      <g transform="translate(32 33) scale(0.9) translate(-32 -33)">
        <path d="M32 61S9 41.8 9 26a23 23 0 0 1 46 0C55 41.8 32 61 32 61z" fill="#F5C518" />
        <path d="M26.5 42V13.5h8a9.75 9.75 0 0 1 0 19.5h-8" fill="none" stroke="#15181C" strokeWidth="6.5" />
        <path d="M18.5 20.5h27M18.5 26.5h27" fill="none" stroke="#15181C" strokeWidth="3" />
      </g>
    </svg>
  );
}
