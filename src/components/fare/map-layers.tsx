"use client";

import { Layers } from "lucide-react";

import { useDictionary } from "@/components/shared/dictionary-provider";
import { Popover, PopoverContent, PopoverDescription, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";

/** What the rider can hide on the jeep map. The A and B pins and the picked route always show. */
export type MapLayer = "routes" | "terminals" | "routeEnds";
export type MapLayers = Record<MapLayer, boolean>;

export const ALL_LAYERS = { routes: true, terminals: true, routeEnds: true } as const satisfies MapLayers;

const LAYER_ORDER = ["routes", "terminals", "routeEnds"] as const satisfies readonly MapLayer[];

type MapLayersControlProps = {
  layers: MapLayers;
  onChange: (layers: MapLayers) => void;
};

/** A map control button that opens a list of switches, one per layer. */
export function MapLayersControl({ layers, onChange }: MapLayersControlProps) {
  const { dict } = useDictionary();
  const t = dict.planner;
  const labels: Record<MapLayer, string> = {
    routes: t.layerRoutes,
    terminals: t.layerTerminals,
    routeEnds: t.layerRouteEnds,
  };

  return (
    <Popover>
      <PopoverTrigger
        aria-label={t.mapLayers}
        // Matches the zoom and locate buttons below it.
        className="flex size-8 items-center justify-center rounded-md border border-border bg-background shadow-sm transition-colors outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:size-11 data-popup-open:bg-accent"
      >
        <Layers aria-hidden className="size-4" />
      </PopoverTrigger>
      <PopoverContent side="left" align="end" sideOffset={8} className="w-64 gap-1 p-3">
        <PopoverTitle className="px-1 font-semibold">{t.mapLayers}</PopoverTitle>
        <ul>
          {LAYER_ORDER.map((layer) => (
            <li key={layer}>
              <label className="flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-md px-1">
                {labels[layer]}
                <Switch
                  checked={layers[layer]}
                  onCheckedChange={(checked) => onChange({ ...layers, [layer]: checked })}
                />
              </label>
            </li>
          ))}
        </ul>
        <PopoverDescription className="px-1 text-xs">{t.layersNote}</PopoverDescription>
      </PopoverContent>
    </Popover>
  );
}
