"use client";

import { useId } from "react";
import { ChevronDownIcon, InfoIcon, MapPinIcon, PlusIcon, UsersIcon } from "lucide-react";
import Link from "next/link";

import { useDictionary } from "@/components/shared/dictionary-provider";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { formatPeso } from "@/lib/fare";
import { fill, localizePath } from "@/lib/i18n/locales";
import { isApproximate, type JeepRoute } from "@/lib/jeep-routes";
import { cn } from "@/lib/utils";

export const isTodo = (value: string | undefined): boolean => !value || value.startsWith("TODO");

export function ApproximateBadge() {
  const { dict } = useDictionary();

  return (
    <Badge variant="outline" className="border-warning-border bg-warning text-warning-foreground">
      {dict.jeep.approximate}
    </Badge>
  );
}

/** Routes sent in by residents and checked before they went on the map. */
export function CommunityBadge() {
  const { dict } = useDictionary();

  return (
    <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary">
      <UsersIcon aria-hidden />
      {dict.jeep.community}
    </Badge>
  );
}

/** What a rider reported paying end to end, when a community route carries it. */
export function ReportedFare({ route }: { route: JeepRoute }) {
  const { dict } = useDictionary();

  if (route.reportedFare === undefined) return null;
  return (
    <span className="text-xs text-muted-foreground tabular-nums">
      {fill(dict.jeep.ridersPaid, { fare: formatPeso(route.reportedFare) })}
    </span>
  );
}

function Terminal({ terminal }: { terminal: string | undefined }) {
  const { dict } = useDictionary();

  return (
    <span className="flex items-start gap-1 text-xs text-muted-foreground">
      <MapPinIcon aria-hidden className="mt-px size-3.5 shrink-0" />
      <span className="sr-only">{dict.jeep.terminalLabel} </span>
      {isTodo(terminal) ? dict.jeep.terminalUnconfirmed : terminal}
    </span>
  );
}

/** The towns along the highlighted route with their km from the terminal, terminal first. */
function RouteStops({ route }: { route: JeepRoute }) {
  const { dict } = useDictionary();
  const headingId = useId();

  if (route.stops.length === 0) return null;
  const lastIndex = route.stops.length - 1;

  return (
    <section
      aria-labelledby={headingId}
      className="mt-2 flex flex-col gap-2 rounded-lg border border-[#C2410C]/30 bg-[#C2410C]/5 p-3"
    >
      <div className="flex flex-col gap-0.5">
        <h3 id={headingId} className="text-sm font-semibold">
          {route.name}
        </h3>
        <p className="text-xs text-pretty text-muted-foreground">{dict.jeep.stopsNote}</p>
      </div>
      <ol className="flex flex-col">
        {route.stops.map((stop, index) => {
          const isEnd = index === 0 || index === lastIndex;
          return (
            <li
              key={`${stop.name}-${index}`}
              className="relative flex items-baseline justify-between gap-3 py-1.5 pl-5 text-sm"
            >
              {index < lastIndex && (
                <span aria-hidden className="absolute top-1/2 left-[4px] h-full w-0.5 bg-[#C2410C]/40" />
              )}
              <span
                aria-hidden
                className={cn(
                  "absolute top-1/2 left-0 size-2.5 -translate-y-1/2 rounded-full ring-2 ring-[#C2410C]",
                  isEnd ? "bg-[#C2410C]" : "bg-white",
                )}
              />
              <span className="min-w-0">
                {stop.name}
                {isEnd && (
                  <span className="text-xs text-muted-foreground">
                    {" "}
                    · {index === 0 ? dict.jeep.stopTerminal : dict.jeep.stopEnd}
                  </span>
                )}
              </span>
              {stop.km !== undefined && (
                <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                  {fill(dict.jeep.stopKm, { km: stop.km })}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function SuggestRoute() {
  const { dict, locale } = useDictionary();

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-dashed p-3">
      <p className="text-sm font-semibold text-balance">{dict.jeep.suggestTitle}</p>
      <p className="text-xs text-pretty text-muted-foreground">{dict.jeep.suggestBody}</p>
      <Link
        href={localizePath(locale, "/fare/suggest")}
        className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-11 self-start")}
      >
        <PlusIcon aria-hidden />
        {dict.jeep.suggestCta}
      </Link>
    </div>
  );
}

type JeepRouteListProps = {
  /** Routes with a line on the map. */
  routes: JeepRoute[];
  highlightedRouteId: string | null;
  onHighlightRoute: (routeId: string | null) => void;
};

export function JeepRouteList({ routes, highlightedRouteId, onHighlightRoute }: JeepRouteListProps) {
  const { dict } = useDictionary();
  const headingId = useId();

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3">
      {routes.some(isApproximate) && (
        <p className="flex items-start gap-2 rounded-lg bg-muted px-3 py-2 text-xs font-medium text-pretty">
          <InfoIcon aria-hidden className="mt-px size-4 shrink-0 text-primary" />
          {dict.jeep.approximateNotice}
        </p>
      )}
      <div className="flex flex-col gap-1">
        <h2 id={headingId} className="text-base font-bold tracking-tight">
          {fill(dict.jeep.routeList, { count: routes.length })}
        </h2>
        <p className="text-xs text-muted-foreground">
          {dict.jeep.routeListHint}
        </p>
      </div>
      <ul className="flex flex-col gap-2">
        {routes.map((route) => {
          const pressed = route.id === highlightedRouteId;
          return (
            <li key={route.id}>
              <button
                type="button"
                aria-pressed={pressed}
                onClick={() => onHighlightRoute(pressed ? null : route.id)}
                className="flex min-h-11 w-full items-start gap-3 rounded-lg border p-3 text-left text-sm transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 aria-pressed:border-primary aria-pressed:bg-primary/5"
              >
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="font-semibold">{route.name}</span>
                  {!isTodo(route.via) && (
                    <span className="text-xs text-muted-foreground">{fill(dict.jeep.via, { via: route.via })}</span>
                  )}
                  <Terminal terminal={route.terminal} />
                  <ReportedFare route={route} />
                </span>
                <span className="flex shrink-0 flex-col items-end gap-1">
                  <Badge variant="secondary">{dict.jeep[route.type]}</Badge>
                  {route.origin === "community" && <CommunityBadge />}
                  {isApproximate(route) && <ApproximateBadge />}
                </span>
              </button>
              {pressed && <RouteStops route={route} />}
            </li>
          );
        })}
      </ul>
      <SuggestRoute />
    </section>
  );
}

/** Routes with no line yet: listed so riders know they exist, but nothing to draw or match. */
export function UnmappedRoutes({ routes }: { routes: JeepRoute[] }) {
  const { dict } = useDictionary();

  return (
    <Collapsible className="flex flex-col rounded-2xl border bg-card">
      <CollapsibleTrigger className="group flex min-h-12 w-full items-center justify-between gap-2 rounded-2xl px-4 text-left text-base font-bold tracking-tight outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50">
        {fill(dict.jeep.stillBeingMapped, { count: routes.length })}
        <ChevronDownIcon aria-hidden className="size-4 shrink-0 transition-transform group-data-panel-open:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <ul className="flex flex-col divide-y border-t px-4">
          {routes.map((route) => (
            <li key={route.id} className="flex items-start gap-3 py-3 text-sm">
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="font-semibold">{route.name}</span>
                {!isTodo(route.via) && (
                  <span className="text-xs text-muted-foreground">{fill(dict.jeep.via, { via: route.via })}</span>
                )}
                <Terminal terminal={route.terminal} />
                <ReportedFare route={route} />
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <Badge variant="secondary">{dict.jeep[route.type]}</Badge>
                {route.origin === "community" && <CommunityBadge />}
                <Badge variant="outline" className="border-warning-border bg-warning text-warning-foreground">
                  {dict.jeep.notMapped}
                </Badge>
              </div>
            </li>
          ))}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  );
}
