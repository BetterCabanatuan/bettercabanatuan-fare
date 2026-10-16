"use client";

import { useId } from "react";
import { ChevronDownIcon, InfoIcon, MapPinIcon } from "lucide-react";

import { useDictionary } from "@/components/shared/dictionary-provider";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { fill } from "@/lib/i18n/locales";
import { isApproximate, type JeepRoute } from "@/lib/jeep-routes";

export const isTodo = (value: string | undefined): boolean => !value || value.startsWith("TODO");

export function ApproximateBadge() {
  const { dict } = useDictionary();

  return (
    <Badge variant="outline" className="border-warning-border bg-warning text-warning-foreground">
      {dict.jeep.approximate}
    </Badge>
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
                </span>
                <span className="flex shrink-0 flex-col items-end gap-1">
                  <Badge variant="secondary">{dict.jeep[route.type]}</Badge>
                  {isApproximate(route) && <ApproximateBadge />}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
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
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <Badge variant="secondary">{dict.jeep[route.type]}</Badge>
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
