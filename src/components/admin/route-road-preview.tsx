"use client";

import { useState } from "react";

import { RouteRoadMap, useRoadLine } from "@/components/routes/route-road-map";
import { Button } from "@/components/ui/button";
import type { LngLat } from "@/lib/geo";
import type { RouteStop } from "@/lib/routes/waypoints";

type RouteRoadPreviewProps = { a: LngLat; b: LngLat; stops: RouteStop[] };

/**
 * The road a submission would publish, drawn on request. Opening one card at a time
 * keeps a long review queue from sending every route to the free OSRM server at once.
 */
export function RouteRoadPreview({ a, b, stops }: RouteRoadPreviewProps) {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <Button type="button" variant="outline" className="h-11 self-start" onClick={() => setOpen(true)}>
        Show the road on a map
      </Button>
    );
  }
  return <OpenPreview a={a} b={b} stops={stops} />;
}

function OpenPreview({ a, b, stops }: RouteRoadPreviewProps) {
  const line = useRoadLine([a, ...stops.map((stop) => stop.position), b]);
  return (
    <div className="flex flex-col gap-2">
      <RouteRoadMap a={a} b={b} stops={stops} line={line} className="h-64" />
      <p aria-live="polite" className="text-sm text-muted-foreground">
        {line?.status === "ready" && `About ${line.road.distanceKm.toFixed(1)} km by road. Verifying publishes this line.`}
        {line?.status === "loading" && "Finding the road…"}
        {line?.status === "none" && "OpenStreetMap has no road through these points. Verifying will fail."}
        {line?.status === "unreachable" && "The routing server can't be reached right now."}
      </p>
    </div>
  );
}
