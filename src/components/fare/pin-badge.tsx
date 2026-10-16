import type { PointKey } from "@/components/fare/types";
import { cn } from "@/lib/utils";

/**
 * Small A/B badge matching the map pins (spec §6.3), so panel text and map guidance point
 * at the same pin. Decorative: the surrounding text always names the point.
 */
export function PinBadge({ pin, className }: { pin: PointKey; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
        pin === "a"
          ? "bg-[#15181C] text-white"
          : "bg-[#F5C518] text-[#15181C] ring-2 ring-[#15181C] ring-inset",
        className,
      )}
    >
      {pin.toUpperCase()}
    </span>
  );
}
