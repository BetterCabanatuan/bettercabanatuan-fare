"use client";

import { useId } from "react";

import type { RoadRoute } from "@/components/fare/types";
import { useDictionary } from "@/components/shared/dictionary-provider";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { displayKm, formatPeso, type Centavos } from "@/lib/fare";
import { fill } from "@/lib/i18n/locales";
import { fastestIndex } from "@/lib/road-routes";

type RoadText = Dictionary["roads"];

export const roadSummary = (road: RoadRoute, t: RoadText): string =>
  fill(t.summary, { km: displayKm(road.distanceKm).toFixed(1), minutes: Math.max(1, Math.round(road.durationMin)) });

/** What sets a road apart: the first road is always the shortest (pickRoadOptions sorts them). */
export function roadTag(index: number, fastest: number, t: RoadText): string {
  if (index === 0) return fastest === 0 ? t.shortestFastest : t.shortest;
  return index === fastest ? t.fastest : t.other;
}

type RoadOptionsProps = {
  roads: RoadRoute[];
  selected: number;
  onSelect: (index: number) => void;
  /** The fare for a road of this length, with the rider's current passengers or jeep type. */
  fareFor: (distanceKm: number) => Centavos;
};

/** The roads between A and B, like a map app's route choices, each with its own fare. */
export function RoadOptions({ roads, selected, onSelect, fareFor }: RoadOptionsProps) {
  const { dict } = useDictionary();
  const t = dict.roads;
  const headingId = useId();
  const fastest = fastestIndex(roads);
  const shortestFare = fareFor(roads[0].distanceKm);

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-2">
      <h2 id={headingId} className="text-base font-bold tracking-tight">
        {t.heading}
      </h2>
      <ul className="flex flex-col gap-2">
        {roads.map((road, index) => {
          const fare = fareFor(road.distanceKm);
          const extra = fare - shortestFare;
          return (
            // Roads have no id from OSRM; after duplicates are dropped, exact length and time never repeat.
            <li key={`${road.distanceKm}:${road.durationMin}`}>
              <button
                type="button"
                aria-pressed={index === selected}
                onClick={() => onSelect(index)}
                className="flex min-h-11 w-full items-center justify-between gap-3 rounded-lg border bg-card p-3 text-left text-sm transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 aria-pressed:border-primary aria-pressed:bg-primary/5"
              >
                <span className="flex flex-col gap-0.5">
                  <span className="font-semibold">{roadTag(index, fastest, t)}</span>
                  <span className="text-muted-foreground tabular-nums">{roadSummary(road, t)}</span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-0.5 tabular-nums">
                  <span className="font-semibold">{formatPeso(fare)}</span>
                  <span className="text-muted-foreground">
                    {index === 0 ? "" : extra > 0 ? fill(t.moreFare, { amount: formatPeso(extra) }) : t.sameFare}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <p className="text-sm text-muted-foreground">{t.fareNote}</p>
    </section>
  );
}
