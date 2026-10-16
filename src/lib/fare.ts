// Fare math for jeeps and tricycles. Pure functions, no React or Next imports.
// All money is handled in whole centavos and only formatted to pesos for display.

export type Centavos = number;

export type TricycleFareRules = {
  baseKm: number;
  regular: { solo: Centavos; shared: Centavos };
  discounted: { solo: Centavos; shared: Centavos };
  /** Added for each km after baseKm, per passenger; a solo rider pays the solo rate. */
  perSucceedingKm: { solo: Centavos; shared: Centavos };
};

export type JeepType = "traditional" | "modern";

export type JeepFareRule = {
  label: string;
  baseFare: Centavos;
  baseKm: number;
  perSucceedingKm: Centavos;
};

export type JeepFareRules = {
  effectiveDate: string;
  types: Record<JeepType, JeepFareRule>;
  discountRate: number;
};

export type Passengers = { regular: number; discounted: number };

export type TricycleFare = {
  rate: "solo" | "shared";
  billableKm: number;
  extraKm: number;
  regularEach: Centavos;
  discountedEach: Centavos;
  total: Centavos;
};

export type JeepFare = {
  billableKm: number;
  extraKm: number;
  regular: Centavos;
  discounted: Centavos;
};

export const toCentavos = (pesos: number): Centavos => Math.round(pesos * 100);

const pesoFormat = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
});

export const formatPeso = (amount: Centavos): string => pesoFormat.format(amount / 100);

/** Distance shown to riders, rounded to 0.1 km. */
export const displayKm = (distanceKm: number): number => Math.round(distanceKm * 10) / 10;

/**
 * Kilometres charged for a trip.
 * The official rule for part-kilometres is not yet confirmed (see docs/specs).
 * Working assumption: round the displayed distance to the nearest whole km, at least 1 km.
 * This matches a rider-reported fare (11.4 km solo billed as 11 km for ₱100).
 */
export const billableKm = (distanceKm: number): number => Math.max(1, Math.round(displayKm(distanceKm)));

export function tricycleFare(
  rules: TricycleFareRules,
  distanceKm: number,
  passengers: Passengers,
): TricycleFare {
  const rate = passengers.regular + passengers.discounted === 1 ? "solo" : "shared";
  const km = billableKm(distanceKm);
  const extraKm = Math.max(0, km - rules.baseKm);
  const extraEach = extraKm * rules.perSucceedingKm[rate];
  const regularEach = rules.regular[rate] + extraEach;
  const discountedEach = rules.discounted[rate] + extraEach;

  return {
    rate,
    billableKm: km,
    extraKm,
    regularEach,
    discountedEach,
    total: passengers.regular * regularEach + passengers.discounted * discountedEach,
  };
}

export function jeepFare(rules: JeepFareRules, type: JeepType, distanceKm: number): JeepFare {
  const rule = rules.types[type];
  const km = billableKm(distanceKm);
  const extraKm = Math.max(0, km - rule.baseKm);
  const regular = rule.baseFare + extraKm * rule.perSucceedingKm;

  return {
    billableKm: km,
    extraKm,
    regular,
    // LTFRB rounding for discounted fares is not yet confirmed; round to the centavo.
    discounted: Math.round(regular * (1 - rules.discountRate)),
  };
}
