"use client";

import type { MapMouseEvent } from "maplibre-gl";
import { useEffect } from "react";

import { Map, MapControls, MapMarker, MapRoute, MarkerContent, useMap } from "@/components/ui/map";
import type { LngLat } from "@/lib/geo";

const CABANATUAN_CENTER: LngLat = [120.9667, 15.4865];

type LocationPickerProps = {
  value: LngLat | null;
  onChange: (position: LngLat) => void;
  boundary: LngLat[];
};

/** Tap the map or drag the pin to mark where the TODA's terminal is. */
export function LocationPicker({ value, onChange, boundary }: LocationPickerProps) {
  return (
    <Map
      theme="light"
      center={value ?? CABANATUAN_CENTER}
      zoom={value ? 16 : 12.5}
      className="h-72 w-full overflow-hidden rounded-lg border sm:h-80"
    >
      <MapRoute
        id="toda-boundary"
        coordinates={boundary}
        color="#6B7280"
        width={1.5}
        opacity={0.7}
        dashArray={[3, 2]}
        interactive={false}
      />
      {value && (
        <MapMarker
          longitude={value[0]}
          latitude={value[1]}
          draggable
          onDragEnd={({ lng, lat }) => onChange([lng, lat])}
        >
          <MarkerContent>
            <div className="flex size-11 items-center justify-center">
              <span
                role="img"
                aria-label="Terminal location"
                className="size-6 rounded-full bg-[#F5C518] shadow-md ring-2 ring-[#15181C]"
              />
            </div>
          </MarkerContent>
        </MapMarker>
      )}
      <MapControls
        position="bottom-right"
        showZoom
        showLocate
        onLocate={({ longitude, latitude }) => onChange([longitude, latitude])}
      />
      <ClickToPlace onPlace={onChange} />
    </Map>
  );
}

function ClickToPlace({ onPlace }: { onPlace: (position: LngLat) => void }) {
  const { map } = useMap();

  useEffect(() => {
    if (!map) return;
    const handleClick = (event: MapMouseEvent) => {
      // Clicks on the pin itself are drags, not new placements.
      const target = event.originalEvent.target;
      if (target instanceof Element && target.closest(".maplibregl-marker")) return;
      onPlace([event.lngLat.lng, event.lngLat.lat]);
    };
    map.on("click", handleClick);
    return () => {
      map.off("click", handleClick);
    };
  }, [map, onPlace]);

  return null;
}
