// Loads and validates the JSON in data/. Import from Server Components only, then
// pass the plain values to Client Components as props.
import { z } from "zod";

import boundaryJson from "../../data/geo/cabanatuan-boundary.json";
import landmarksJson from "../../data/geo/landmarks.json";
import jeepRulesJson from "../../data/jeepney/fare-rules.json";
import routesJson from "../../data/jeepney/routes.json";
import terminalsJson from "../../data/jeepney/terminals.json";
import tricycleJson from "../../data/tricycle/fare-matrix.json";
import {
  toCentavos,
  type Centavos,
  type FareClass,
  type JeepFareRules,
  type JeepType,
  type TricycleFareRules,
} from "@/lib/fare";
import { projectOntoLine, type LngLat } from "@/lib/geo";
import type { JeepRoute, JeepStop, JeepTerminal } from "@/lib/jeep-routes";
import { collectUrls } from "@/lib/source-text";

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

const fareByClass = z.object({ regular: peso, discounted: peso });

const fuelBandSchema = z.object({
  gasolineFrom: peso,
  gasolineTo: peso,
  baseFare: fareByClass,
  perSucceedingKm: fareByClass,
});

const penaltySchema = z.union([
  z.object({ offense: z.number().int().positive(), fine: peso, impoundDays: z.number().int().positive() }),
  z.object({ offense: z.number().int().positive(), mtopRevoked: z.literal(true) }),
]);

const sameRates = (a: z.infer<typeof fareByClass>, b: z.infer<typeof fareByClass>) =>
  a.regular === b.regular && a.discounted === b.discounted;

const tricycleSchema = z.object({
  confirmed: z.boolean(),
  lastChecked: z.iso.date(),
  current: z
    .object({
      label: z.string(),
      ordinanceNo: todoOr(z.string()),
      effectiveDate: todoOr(z.string()),
      baseKm: z.number().positive(),
      baseFare: fareByClass,
      perSucceedingKm: fareByClass,
      maxPassengers: z.number().int().positive(),
      specialTripMultiplier: z.number().int().positive(),
      fuelBands: z
        .array(fuelBandSchema)
        .min(1)
        .refine(
          // Each band starts one centavo after the last one ends, so every price has one band.
          (bands) => bands.every((band, i) => i === 0 || toCentavos(band.gasolineFrom) === toCentavos(bands[i - 1].gasolineTo) + 1),
          "Fuel bands must be in order with no gaps or overlaps",
        ),
      complaintsHotline: z.string(),
      penalties: z.array(penaltySchema).min(1),
    })
    .refine(
      ({ baseFare, perSucceedingKm, fuelBands }) =>
        sameRates(baseFare, fuelBands[0].baseFare) && sameRates(perSucceedingKm, fuelBands[0].perSucceedingKm),
      "The first fuel band must hold the base rates",
    ),
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

const terminalsSchema = z.object({
  terminals: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      kind: z.enum(["jeep", "bus", "mixed", "stop"]),
      lat: z.number(),
      lng: z.number(),
      verified: z.boolean(),
      note: z.string().optional(),
      source: z.string(),
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

const toFareByClass = ({ regular, discounted }: z.infer<typeof fareByClass>): Record<FareClass, Centavos> => ({
  regular: toCentavos(regular),
  discounted: toCentavos(discounted),
});

export const tricycleRules: TricycleFareRules = {
  baseKm: tricycle.current.baseKm,
  baseFare: toFareByClass(tricycle.current.baseFare),
  perSucceedingKm: toFareByClass(tricycle.current.perSucceedingKm),
  maxPassengers: tricycle.current.maxPassengers,
  specialTripMultiplier: tricycle.current.specialTripMultiplier,
  fuelBands: tricycle.current.fuelBands.map((band) => ({
    gasolineFrom: toCentavos(band.gasolineFrom),
    gasolineTo: toCentavos(band.gasolineTo),
    baseFare: toFareByClass(band.baseFare),
    perSucceedingKm: toFareByClass(band.perSucceedingKm),
  })),
};

export type TricyclePenalty =
  | { offense: number; fine: Centavos; impoundDays: number }
  | { offense: number; mtopRevoked: true };

/** Ord. 050-2026 Sec. 8: a fine or impoundment for the first offenses, then MTOP revocation. */
export const tricyclePenalties: TricyclePenalty[] = tricycle.current.penalties.map((penalty) =>
  "fine" in penalty ? { ...penalty, fine: toCentavos(penalty.fine) } : penalty,
);

/** The city's call-or-text line for tricycle complaints. */
export const tricycleHotline: string = tricycle.current.complaintsHotline;

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

/** Every reference URL in the fare files (current, pending and past rates), for the Sources page. */
export const tricycleFareReferences: string[] = collectUrls(tricycleJson);
export const jeepFareReferences: string[] = collectUrls(jeepRulesJson);
/** Every URL in each preset route's entry: its source plus any additional sources and notes. */
export const routeReferences: Record<string, string[]> = Object.fromEntries(
  routesJson.routes.map((route) => [route.id, collectUrls(route)]),
);

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

export const terminals: JeepTerminal[] = terminalsSchema
  .parse(terminalsJson)
  .terminals.map(({ lat, lng, ...terminal }) => ({ ...terminal, position: [lng, lat] }));

export const landmarks: Landmark[] = landmarksSchema
  .parse(landmarksJson)
  .landmarks.map(({ lat, lng, ...landmark }) => ({ ...landmark, position: [lng, lat] }));

export const cityBoundary: LngLat[] = boundarySchema.parse(boundaryJson).geometry.coordinates[0];
