"use client";

import { TriangleAlert } from "lucide-react";
import { useId, useRef, useState } from "react";

import { RouteRoadMap, useRoadLine, type RoadLine } from "@/components/routes/route-road-map";
import { useDictionary } from "@/components/shared/dictionary-provider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FieldDescription, FieldError, FieldLegend, FieldSet } from "@/components/ui/field";
import type { LngLat } from "@/lib/geo";
import { fill } from "@/lib/i18n/locales";
import { SUBMISSION_LIMITS } from "@/lib/routes/submission";
import { loopingStop, stopIndex, type RouteStop } from "@/lib/routes/waypoints";

type RouteRoadFieldProps = {
  a: LngLat | null;
  b: LngLat | null;
  error?: string;
  /** Called when the stops change, so an old error on them can be hidden. */
  onEdit: () => void;
};

/**
 * Shows the road through A, the stops and B, and lets the rider tap the road the jeep
 * really takes. The stops post as JSON in one hidden input.
 */
export function RouteRoadField({ a, b, error, onEdit }: RouteRoadFieldProps) {
  const { dict } = useDictionary();
  const t = dict.suggest;
  const id = useId();
  const [stops, setStops] = useState<RouteStop[]>([]);
  const nextId = useRef(0);
  const positions = stops.map((stop) => stop.position);
  const points = a && b ? [a, ...positions, b] : null;
  const line = useRoadLine(points);
  const loop = points && line?.status === "ready" ? loopingStop(points, line.road.legsKm) : null;
  const full = stops.length >= SUBMISSION_LIMITS.waypoints;

  const update = (next: RouteStop[]) => {
    setStops(next);
    onEdit();
  };
  const addStop = (position: LngLat) => {
    if (!a || !b || full) return;
    const index = stopIndex(a, positions, b, position);
    const stop = { id: String(nextId.current++), position };
    update([...stops.slice(0, index), stop, ...stops.slice(index)]);
  };
  const moveStop = (stopId: string, position: LngLat) =>
    update(stops.map((stop) => (stop.id === stopId ? { ...stop, position } : stop)));
  const removeStop = (stopId: string) => update(stops.filter((stop) => stop.id !== stopId));

  return (
    <FieldSet data-invalid={error ? true : undefined}>
      <FieldLegend id={`${id}-legend`}>{t.roadLegend}</FieldLegend>
      <FieldDescription id={`${id}-description`}>
        {a && b ? t.roadHint : t.roadNeedsPins}
      </FieldDescription>

      <div
        role="group"
        aria-labelledby={`${id}-legend`}
        aria-describedby={[`${id}-description`, error && `${id}-error`].filter(Boolean).join(" ")}
        data-field="waypoints"
        tabIndex={-1}
        className="flex flex-col gap-3"
      >
        {a && b && (
          <>
            <RouteRoadMap
              a={a}
              b={b}
              stops={stops}
              line={line}
              onAddStop={addStop}
              onMoveStop={moveStop}
              className="h-72 sm:h-80"
            />
            <p aria-live="polite" className="text-sm text-muted-foreground">
              <RoadStatus line={line} />
            </p>
            {loop !== null && (
              // A hint, not an error: some roads really do loop, so "status" rather than "alert".
              <Alert role="status" className="border-warning-border bg-warning text-warning-foreground">
                <TriangleAlert aria-hidden />
                <AlertDescription className="text-warning-foreground">{fill(t.roadLoops, { number: loop })}</AlertDescription>
              </Alert>
            )}
          </>
        )}

        {stops.length === 0 ? (
          a && b && <p className="text-sm text-muted-foreground">{t.noStops}</p>
        ) : (
          <ol className="flex flex-col divide-y rounded-lg border">
            {stops.map((stop, index) => (
              <li key={stop.id} className="flex items-center justify-between gap-2 py-1 pr-1 pl-3 text-sm">
                {fill(t.stopLabel, { number: index + 1 })}
                <Button
                  type="button"
                  variant="ghost"
                  className="h-11"
                  aria-label={fill(t.removeStopLabel, { number: index + 1 })}
                  onClick={() => removeStop(stop.id)}
                >
                  {t.removeStop}
                </Button>
              </li>
            ))}
          </ol>
        )}
        {full && <p className="text-sm text-muted-foreground">{fill(t.stopsFull, { max: SUBMISSION_LIMITS.waypoints })}</p>}
        {stops.length >= 2 && (
          <Button type="button" variant="outline" className="h-11 self-start" onClick={() => update([])}>
            {t.removeAllStops}
          </Button>
        )}
      </div>

      <input type="hidden" name="waypoints" value={JSON.stringify(positions)} />
      <FieldError id={`${id}-error`}>{error}</FieldError>
    </FieldSet>
  );
}

function RoadStatus({ line }: { line: RoadLine | null }) {
  const { dict } = useDictionary();
  const t = dict.suggest;
  if (!line || line.status === "loading") return t.roadLoading;
  if (line.status === "none") return <span className="text-destructive">{t.roadNone}</span>;
  if (line.status === "unreachable") return t.roadUnreachable;
  return fill(t.roadLength, { km: line.road.distanceKm.toFixed(1) });
}
