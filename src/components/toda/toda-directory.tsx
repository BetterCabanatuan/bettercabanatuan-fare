"use client";

import { MapPin, Phone, Search } from "lucide-react";
import Link from "next/link";
import { useDeferredValue, useState } from "react";

import { useDictionary } from "@/components/shared/dictionary-provider";
import { Input } from "@/components/ui/input";
import { fill, localizePath } from "@/lib/i18n/locales";
import type { TodaListItem } from "@/lib/toda/queries";

/** The verified TODA list with a filter for "which TODA serves my barangay?". */
export function TodaDirectory({ todas }: { todas: TodaListItem[] }) {
  const { locale, dict } = useDictionary();
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());

  const matches = deferredQuery
    ? todas.filter((toda) =>
        [
          toda.name,
          toda.barangay,
          toda.terminalDescription,
          ...toda.connectedTerminals.flatMap((terminal) => [terminal.terminalDescription, terminal.barangay]),
          ...toda.barangaysServed,
        ].some((text) => text.toLowerCase().includes(deferredQuery)),
      )
    : todas;

  return (
    <div className="flex flex-col gap-4">
      <label className="relative block">
        <span className="sr-only">Search by TODA name or barangay</span>
        <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by TODA name or barangay"
          className="h-11 pl-9"
        />
      </label>
      <p aria-live="polite" className="text-sm text-muted-foreground">
        {deferredQuery
          ? `${matches.length} of ${todas.length} TODAs match “${query.trim()}”`
          : `${todas.length} verified ${todas.length === 1 ? "TODA" : "TODAs"}`}
      </p>
      <ul className="grid gap-3 sm:grid-cols-2">
        {matches.map((toda) => (
          <li key={toda.id} className="flex flex-col gap-3 rounded-xl border bg-card p-4 text-card-foreground">
            <div className="flex flex-col gap-0.5">
              <h3 className="text-lg font-bold">{toda.name}</h3>
              <Terminal terminal={toda} />
            </div>
            {toda.connectedTerminals.length > 0 && (
              <div className="flex flex-col gap-0.5">
                <p className="text-sm font-semibold">{dict.toda.connectedTerminals}</p>
                <ul className="flex flex-col gap-0.5">
                  {/* Connected terminals have no id; place and description tell them apart. */}
                  {toda.connectedTerminals.map((terminal) => (
                    <li key={`${terminal.lat},${terminal.lng},${terminal.terminalDescription}`}>
                      <Terminal terminal={terminal} />
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {toda.barangaysServed.length > 0 && (
              <p className="text-sm">
                <span className="font-semibold">Serves: </span>
                {toda.barangaysServed.join(", ")}
              </p>
            )}
            <dl className="mt-auto flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {toda.officialContact && (
                <div className="flex items-center gap-1.5">
                  <dt>
                    <Phone aria-label="Contact" className="size-4" />
                  </dt>
                  <dd>
                    <a href={`tel:${toda.officialContact.replace(/[^\d+]/g, "")}`} className="inline-flex min-h-11 items-center font-semibold text-primary underline-offset-4 hover:underline">
                      {toda.officialContact}
                    </a>
                  </dd>
                </div>
              )}
              {toda.units && (
                <div className="flex gap-1">
                  <dt>Tricycles:</dt>
                  <dd>about {toda.units}</dd>
                </div>
              )}
              <div className="flex gap-1">
                <dt>Checked:</dt>
                <dd>
                  <time dateTime={toda.lastVerified}>{toda.lastVerified}</time>
                  {toda.source === "community" && " (community report)"}
                </dd>
              </div>
            </dl>
            <Link
              href={`${localizePath(locale, "/toda/submit")}?toda=${encodeURIComponent(toda.id)}`}
              aria-label={fill(dict.toda.suggestPositionLabel, { name: toda.name })}
              className="inline-flex min-h-11 items-center self-start text-sm font-semibold text-primary underline-offset-4 hover:underline"
            >
              {dict.toda.suggestPosition}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

type TerminalProps = {
  terminal: { terminalDescription: string; barangay: string; lat: number | null; lng: number | null };
};

/** One place the TODA waits, with a link that opens the fare map to it when it is pinned. */
function Terminal({ terminal: { terminalDescription, barangay, lat, lng } }: TerminalProps) {
  const { locale, dict } = useDictionary();
  const place = `${terminalDescription}, ${barangay}`;
  return (
    <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
      <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <span>
        {place}
        {lat !== null && lng !== null && (
          <>
            {" · "}
            <Link
              href={`${localizePath(locale, "/fare")}?b=${lat.toFixed(5)},${lng.toFixed(5)}`}
              aria-label={fill(dict.toda.fareToHereLabel, { place })}
              className="font-semibold text-primary underline-offset-4 hover:underline"
            >
              {dict.toda.fareToHere}
            </Link>
          </>
        )}
      </span>
    </p>
  );
}
