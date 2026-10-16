"use client";

import { PinBadge } from "@/components/fare/pin-badge";
import type { PointKey } from "@/components/fare/types";
import { useDictionary } from "@/components/shared/dictionary-provider";

/** Floating chip at the top of the map saying what the next tap will set. */
export function MapHint({ pin }: { pin: PointKey }) {
  const { dict } = useDictionary();

  return (
    // Only the chip takes pointer events, so the map stays usable around it.
    <div className="pointer-events-none absolute inset-x-0 top-3 z-20 flex justify-center px-3">
      <p
        // Keyed by pin so the switch from A to B replays the entrance and catches the eye.
        key={pin}
        className="pointer-events-auto flex max-w-full items-center gap-2.5 rounded-full border bg-background/95 py-1.5 pr-4 pl-1.5 text-sm font-semibold text-balance shadow-md motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-1 motion-safe:duration-200"
      >
        <PinBadge pin={pin} />
        {pin === "a" ? dict.planner.mapHintA : dict.planner.mapHintB}
      </p>
    </div>
  );
}
