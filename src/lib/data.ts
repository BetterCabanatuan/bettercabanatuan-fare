// Loads and validates the JSON in data/. Import from Server Components only, then
// pass the plain values to Client Components as props.
import { z } from "zod";

import boundaryJson from "../../data/geo/cabanatuan-boundary.json";
import landmarksJson from "../../data/geo/landmarks.json";
import jeepRulesJson from "../../data/jeepney/fare-rules.json";
import routesJson from "../../data/jeepney/routes.json";
import tricycleJson from "../../data/tricycle/fare-matrix.json";
import { toCentavos, type Centavos, type JeepFareRules, type JeepType, type TricycleFareRules } from "@/lib/fare";
import { projectOntoLine, type LngLat } from "@/lib/geo";
import type { JeepRoute, JeepStop } from "@/lib/jeep-routes";

export type FareSourceInfo = {
  confirmed: boolean;
  label: string;
  /** Null while the ordinance number or memo is unknown. */
  reference: string | null;
  effectiveDate: string | null;
  lastChecked: string;
};

export type Landmark = { id: string; name: string; area: string; position: LngLat };

const lngLat = z.tuple([z.number(), z.number()]);
const peso = z.number().nonnegative();
const todoOr = <T extends z.ZodType>(schema: T) =>
  z.union([schema, z.string().startsWith("TODO")]).transform((value) =>
    typeof value === "string" && value.startsWith("TODO") ? null : value,
  );

const tricycleSchema = z.object({
  confirmed: z.boolean(),
  lastChecked: z.iso.date(),
  current: z.object({
    label: z.string(),
    ordinanceNo: todoOr(z.string()),
    effectiveDate: todoOr(z.string()),
    baseKm: z.number().positive(),
    fares: z.object({
      regular: z.object({ single: peso, perPassengerIfTwoOrMore: peso }),
      discounted: z.object({ single: peso, perPassengerIfTwoOrMore: peso }),
    }),
    perSucceedingKmPerPassenger: peso,
    perSucceedingKmSolo: peso,
  }),
});

const jeepRuleSchema = z.object({
  label: z.string(),
  baseFare: peso,
  baseKm: z.number().positive(),
  perSucceedingKm: peso,
});

const jeepRulesSchema = z.object({
  lastChecked: z.iso.date(),
  effectiveDate: z.iso.date(),
  authority: z.string(),
  types: z.object({ traditional: jeepRuleSchema, modern: jeepRuleSchema }),
  discounts: z
    .object({ senior: z.number(), pwd: z.number(), student: z.number() })
    .refine((d) => d.senior === d.pwd && d.pwd === d.student, "Discount rates are expected to match"),
  previous: z.object({
    traditional: z.object({ baseFare: peso, perSucceedingKm: peso }),
    modern: z.object({ baseFare: peso, perSucceedingKm: peso }),
  }),
});

const routesSchema = z.object({
  routes: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      via: z.string(),
      type: z.enum(["traditional", "modern"]),
      terminal: z.string().optional(),
      terminalPosition: lngLat.optional(),
      source: z.string(),
      status: z.enum(["active", "approximate", "suspended", "unverified"]).default("unverified"),
      verifiedOn: z.iso.date().optional(),
      directions: z
        .array(z.object({ id: z.string(), label: z.string(), line: z.array(lngLat).min(2) }))
        .default([]),
      waypoints: z.array(z.object({ name: z.string(), position: lngLat })).default([]),
      stops: z.array(
        z.object({
          name: z.string(),
          barangay: z.string().optional(),
          km: z.number().optional(),
          lat: z.number(),
          lng: z.number(),
        }),
      ),
    }),
  ),
});

const landmarksSchema = z.object({
  landmarks: z.array(
    z.object({ id: z.string(), name: z.string(), area: z.string(), lat: z.number(), lng: z.number() }),
  ),
});

const boundarySchema = z.object({
  geometry: z.object({ type: z.literal("Polygon"), coordinates: z.array(z.array(lngLat)).min(1) }),
});

const tricycle = tricycleSchema.parse(tricycleJson);
const jeep = jeepRulesSchema.parse(jeepRulesJson);

export const tricycleRules: TricycleFareRules = {
  baseKm: tricycle.current.baseKm,
  regular: {
    solo: toCentavos(tricycle.current.fares.regular.single),
    shared: toCentavos(tricycle.current.fares.regular.perPassengerIfTwoOrMore),
  },
  discounted: {
    solo: toCentavos(tricycle.current.fares.discounted.single),
    shared: toCentavos(tricycle.current.fares.discounted.perPassengerIfTwoOrMore),
  },
  perSucceedingKm: {
    solo: toCentavos(tricycle.current.perSucceedingKmSolo),
    shared: toCentavos(tricycle.current.perSucceedingKmPerPassenger),
  },
};

export const tricycleSource: FareSourceInfo = {
  confirmed: tricycle.confirmed,
  label: tricycle.current.label,
  reference: tricycle.current.ordinanceNo,
  effectiveDate: tricycle.current.effectiveDate,
  lastChecked: tricycle.lastChecked,
};

const toJeepRule = (rule: z.infer<typeof jeepRuleSchema>) => ({
  label: rule.label,
  baseFare: toCentavos(rule.baseFare),
  baseKm: rule.baseKm,
  perSucceedingKm: toCentavos(rule.perSucceedingKm),
});

export const jeepRules: JeepFareRules = {
  effectiveDate: jeep.effectiveDate,
  discountRate: jeep.discounts.student,
  types: { traditional: toJeepRule(jeep.types.traditional), modern: toJeepRule(jeep.types.modern) },
};

export type JeepPreviousRates = Record<JeepType, { baseFare: Centavos; perSucceedingKm: Centavos }>;

/** Rates in force before the current adjustment, for "what changed" context. */
export const jeepPreviousRates: JeepPreviousRates = {
  traditional: {
    baseFare: toCentavos(jeep.previous.traditional.baseFare),
    perSucceedingKm: toCentavos(jeep.previous.traditional.perSucceedingKm),
  },
  modern: {
    baseFare: toCentavos(jeep.previous.modern.baseFare),
    perSucceedingKm: toCentavos(jeep.previous.modern.perSucceedingKm),
  },
};

export const jeepSource: FareSourceInfo = {
  confirmed: false,
  label: "LTFRB fare adjustment",
  reference: jeep.authority,
  effectiveDate: jeep.effectiveDate,
  lastChecked: jeep.lastChecked,
};

/** Named points along a preset line (terminal, via towns, destination) with their km from the start. */
function stopsFromWaypoints(waypoints: { name: string; position: LngLat }[], line: LngLat[] | undefined): JeepStop[] {
  if (!line) return [];
  return waypoints
    .filter((waypoint) => !waypoint.name.includes("routing aid"))
    .map((waypoint) => {
      const projection = projectOntoLine(waypoint.position, line);
      return {
        name: waypoint.name.replace(/\s*\((town|city) proper\)/, ""),
        km: Math.round(projection.alongKm * 10) / 10,
        position: projection.point,
      };
    });
}

export const jeepRoutes: JeepRoute[] = routesSchema.parse(routesJson).routes.map(({ waypoints, ...route }) => ({
  ...route,
  origin: "preset",
  stops:
    route.stops.length > 0
      ? route.stops.map(({ lat, lng, ...stop }) => ({ ...stop, position: [lng, lat] }))
      : stopsFromWaypoints(waypoints, route.directions[0]?.line),
}));

export const landmarks: Landmark[] = landmarksSchema
  .parse(landmarksJson)
  .landmarks.map(({ lat, lng, ...landmark }) => ({ ...landmark, position: [lng, lat] }));

export const cityBoundary: LngLat[] = boundarySchema.parse(boundaryJson).geometry.coordinates[0];
