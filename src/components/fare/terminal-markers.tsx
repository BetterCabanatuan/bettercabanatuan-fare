"use client";

import { BusIcon } from "lucide-react";
import { useId, useState } from "react";

import { RoutePopup } from "@/components/fare/route-popup";
import type { Place, PointKey } from "@/components/fare/types";
import { useDictionary } from "@/components/shared/dictionary-provider";
import { JeepIcon } from "@/components/shared/vehicle-icons";
import { MapMarker, MarkerContent } from "@/components/ui/map";
import { haversineKm, type LngLat } from "@/lib/geo";
import { fill } from "@/lib/i18n/locales";
import type { JeepRoute, JeepTerminal, TerminalKind } from "@/lib/jeep-routes";
import { cn } from "@/lib/utils";

type Terminal = {
  key: string;
  position: LngLat;
  kind: TerminalKind;
  /** Unset while the terminal's name is still a TODO in the data. */
  name?: string;
  verified: boolean;
  routes: JeepRoute[];
};

type TerminalMarkersProps = {
  terminals: JeepTerminal[];
  routes: JeepRoute[];
  highlightedRouteId: string | null;
  onHighlightRoute: (routeId: string | null) => void;
  onPickPlace: (key: PointKey, place: Place) => void;
};

// A route's terminal position within this distance of a listed terminal counts as that terminal.
const SAME_TERMINAL_KM = 0.25;

const isTodo = (value: string | undefined): boolean => !value || value.startsWith("TODO");

/** Listed terminals first; routes attach to the nearest one, or get a marker of their own. */
function groupTerminals(terminals: JeepTerminal[], routes: JeepRoute[]): Terminal[] {
  const groups: Terminal[] = terminals.map((terminal) => ({
    key: terminal.id,
    position: terminal.position,
    kind: terminal.kind,
    name: terminal.name,
    verified: terminal.verified,
    routes: [],
  }));
  for (const route of routes) {
    if (!route.terminalPosition || route.status === "suspended") continue;
    const position = route.terminalPosition;
    const nearest = groups
      .map((group) => ({ group, km: haversineKm(group.position, position) }))
      .filter(({ km }) => km <= SAME_TERMINAL_KM)
      .sort((x, y) => x.km - y.km)[0]?.group;
    if (nearest) {
      nearest.routes.push(route);
    } else {
      groups.push({
        key: position.join(","),
        position,
        kind: "jeep",
        name: isTodo(route.terminal) ? undefined : route.terminal,
        verified: false,
        routes: [route],
      });
    }
  }
  return groups;
}

export function TerminalMarkers({
  terminals: listed,
  routes,
  highlightedRouteId,
  onHighlightRoute,
  onPickPlace,
}: TerminalMarkersProps) {
  const { dict } = useDictionary();
  const idPrefix = useId();
  const [openKey, setOpenKey] = useState<string | null>(null);

  const terminals = groupTerminals(listed, routes);
  const open = terminals.find((terminal) => terminal.key === openKey);
  const markerId = (index: number): string => `${idPrefix}-terminal-${index}`;
  const kindLabel = (kind: TerminalKind): string =>
    kind === "bus" ? dict.planner.busTerminal : kind === "stop" ? dict.planner.jeepStop : dict.planner.terminal;

  const close = (): void => {
    setOpenKey(null);
    if (open) document.getElementById(markerId(terminals.indexOf(open)))?.focus();
  };

  const pick = (key: PointKey, terminal: Terminal): void => {
    onPickPlace(key, {
      position: terminal.position,
      label: terminal.name ?? kindLabel(terminal.kind),
      detail: terminal.name ? kindLabel(terminal.kind) : undefined,
    });
    close();
  };

  return (
    <>
      {terminals.map((terminal, index) => {
        const isOpen = terminal.key === openKey;
        const holdsHighlight = terminal.routes.some((route) => route.id === highlightedRouteId);
        const label = terminal.name
          ? fill(dict.planner.terminalMarker, { kind: kindLabel(terminal.kind), name: terminal.name })
          : kindLabel(terminal.kind);
        return (
          <MapMarker key={terminal.key} longitude={terminal.position[0]} latitude={terminal.position[1]}>
            <MarkerContent>
              <button
                type="button"
                id={markerId(index)}
                aria-label={label}
                aria-haspopup="dialog"
                aria-expanded={isOpen}
                onClick={() => setOpenKey(isOpen ? null : terminal.key)}
                className="group flex size-11 items-center justify-center rounded-full outline-none"
              >
                <span
                  className={cn(
                    "flex items-center justify-center text-white shadow-md ring-2 ring-white group-focus-visible:ring-4 group-focus-visible:ring-ring",
                    // Bus terminals are context for jeep riders, so they sit back in slate;
                    // a roadside stop is smaller and dashed because its spot is inferred.
                    terminal.kind === "bus" && "size-8 rounded-lg bg-[#475569]",
                    terminal.kind === "stop" && "size-7 rounded-full border border-dashed border-white bg-[#15181C]/80",
                    (terminal.kind === "jeep" || terminal.kind === "mixed") && "size-8 rounded-lg bg-[#15181C]",
                    (isOpen || holdsHighlight) && "ring-[#C2410C]",
                  )}
                >
                  {terminal.kind === "bus" ? (
                    <BusIcon aria-hidden className="size-4" />
                  ) : (
                    <JeepIcon className={terminal.kind === "stop" ? "size-4" : "size-5"} />
                  )}
                </span>
              </button>
            </MarkerContent>
          </MapMarker>
        );
      })}

      {open && (
        <RoutePopup
          key={open.key}
          position={open.position}
          title={open.name ?? kindLabel(open.kind)}
          subtitle={open.verified ? kindLabel(open.kind) : `${kindLabel(open.kind)} · ${dict.planner.unverifiedPlace}`}
          routes={open.routes}
          emptyNote={open.kind === "bus" ? dict.planner.busOnly : dict.planner.noRoutesHere}
          highlightedRouteId={highlightedRouteId}
          onHighlightRoute={onHighlightRoute}
          leadingPick="a"
          onPick={(key) => pick(key, open)}
          onClose={close}
          onDismiss={() => setOpenKey(null)}
        />
      )}
    </>
  );
}
