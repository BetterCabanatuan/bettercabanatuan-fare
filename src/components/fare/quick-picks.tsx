"use client";

import { PinBadge } from "@/components/fare/pin-badge";
import { landmarkToPlace } from "@/components/fare/point-search";
import type { Place, PointKey } from "@/components/fare/types";
import { useDictionary } from "@/components/shared/dictionary-provider";
import type { Landmark } from "@/lib/data";
import { fill } from "@/lib/i18n/locales";

// Every landmark is in Cabanatuan, so the city name only makes chips longer. Trimming the
// ends keeps the visible text inside the full name, which the input shows once picked.
const shortName = (name: string): string =>
  name.replace(/^Cabanatuan City\s+/i, "").replace(/\s+Cabanatuan$/i, "");

type QuickPicksProps = {
  landmarks: Landmark[];
  pin: PointKey;
  onPick: (place: Place) => void;
};

/** One-tap landmarks for the point being set, so a first-time rider has somewhere to start. */
export function QuickPicks({ landmarks, pin, onPick }: QuickPicksProps) {
  const { dict } = useDictionary();
  const point = pin === "a" ? dict.planner.pointA : dict.planner.pointB;

  return (
    <div role="group" aria-label={fill(dict.planner.popularPlacesFor, { point })} className="grid gap-2.5">
      <p aria-hidden className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
        <PinBadge pin={pin} className="size-5 text-[0.625rem]" />
        {dict.planner.popularPlaces}
      </p>
      <ul className="-mx-4 -my-1 flex snap-x scroll-px-4 gap-2 overflow-x-auto overscroll-x-contain px-4 py-1 [scrollbar-width:none] sm:mx-0 sm:my-0 sm:py-0 sm:flex-wrap sm:overflow-visible sm:px-0">
        {landmarks.map((landmark) => (
          <li key={landmark.id} className="shrink-0 snap-start">
            <button
              type="button"
              onClick={() => onPick(landmarkToPlace(landmark))}
              className="min-h-11 rounded-full border bg-background px-4 whitespace-nowrap text-sm font-medium transition-colors outline-none hover:border-primary/40 hover:bg-primary/5 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {shortName(landmark.name)}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
