"use client";

import { PinBadge } from "@/components/fare/pin-badge";
import type { PointKey } from "@/components/fare/types";
import { useDictionary } from "@/components/shared/dictionary-provider";

type MapHintProps = {
  pin: PointKey;
  /** In jeep mode the terminal markers can set points too, so the hint mentions them. */
  mode: "tricycle" | "jeep";
};

/** Floating chip at the top of the map saying what the next tap will set. */
export function MapHint({ pin, mode }: MapHintProps) {
  const { dict } = useDictionary();
  const text =
    mode === "jeep"
      ? pin === "a"
        ? dict.planner.mapHintJeepA
        : dict.planner.mapHintJeepB
      : pin === "a"
        ? dict.planner.mapHintA
        : dict.planner.mapHintB;

  return (
    // Only the chip takes pointer events, so the map stays usable around it.
    <div className="pointer-events-none absolute inset-x-0 top-2 z-20 flex justify-center px-2 sm:top-3 sm:px-3">
      <p
        // Keyed by pin so the switch from A to B replays the entrance and catches the eye.
        key={pin}
        className="pointer-events-auto flex max-w-full items-center gap-2.5 rounded-full border bg-background/95 py-1.5 pr-4 pl-1.5 text-xs font-semibold text-balance sm:text-sm shadow-md motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-1 motion-safe:duration-200"
      >
        <PinBadge pin={pin} />
        {text}
      </p>
    </div>
  );
}
