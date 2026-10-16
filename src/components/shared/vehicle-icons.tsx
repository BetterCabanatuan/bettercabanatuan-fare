import type { SVGProps } from "react";

// Line icons from the agreed design. lucide has no tricycle or jeepney, so these are drawn here.
const iconProps: SVGProps<SVGSVGElement> = {
  viewBox: "0 0 32 32",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};

export function JeepIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps} {...props}>
      <path d="M5 22V11a3 3 0 0 1 3-3h13l6 6v8" />
      <path d="M3 22h26" />
      <path d="M8 13h12M21 8v6h6" />
      <circle cx="10" cy="24" r="2.5" />
      <circle cx="23" cy="24" r="2.5" />
      <path d="M9 5h10" />
    </svg>
  );
}

export function TricycleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps} {...props}>
      <circle cx="7" cy="23" r="3" />
      <circle cx="25" cy="23" r="3" />
      <path d="M7 23l5-9h6l4 9" />
      <path d="M16 9h12v10h-6" />
      <path d="M12 14l-2-4H7" />
    </svg>
  );
}
