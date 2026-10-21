// Fare math for jeeps and tricycles. Pure functions, no React or Next imports.
// All money is handled in whole centavos and only formatted to pesos for display.

export type Centavos = number;

export type FareClass = "regular" | "discounted";

/** A gasoline price band from the Ord. 050-2026 Sec. 5 provisional fare table. */
export type FuelBand = {
  /** Gasoline price per litre the band covers. */
  gasolineFrom: Centavos;
  gasolineTo: Centavos;
  baseFare: Record<FareClass, Centavos>;
  perSucceedingKm: Record<FareClass, Centavos>;
};

export type TricycleFareRules = {
  baseKm: number;
  /** Per passenger, covering the first baseKm. */
  baseFare: Record<FareClass, Centavos>;
  /** Per passenger, for each km or part of a km after baseKm. */
  perSucceedingKm: Record<FareClass, Centavos>;
  maxPassengers: number;
  /** A passenger-requested special trip costs this many passenger fares. */
  specialTripMultiplier: number;
  /** Cheapest first; the first band holds the base rates above. */
  fuelBands: FuelBand[];
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
  specialTrip: boolean;
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
 * Kilometres charged for a jeep trip.
 * The LTFRB rule for part-kilometres is not yet confirmed (see docs/specs).
 * Working assumption: round the displayed distance to the nearest whole km, at least 1 km.
 */
export const billableKm = (distanceKm: number): number => Math.max(1, Math.round(displayKm(distanceKm)));

/**
 * Kilometres charged for a tricycle trip. Ordinance No. 050-2026 (Sec. 3, Sec. 4.1) charges
 * every succeeding 0.01–1.00 km as a full km, so part-kilometres round up. Rounding up the
 * displayed distance keeps the billed km consistent with the km the rider sees.
 */
export const tricycleBillableKm = (distanceKm: number): number =>
  Math.max(1, Math.ceil(displayKm(distanceKm)));

/**
 * The rules with a fuel band's rates in place of the base rates. A band above the first
 * applies only once the city's Tricycle Franchising and Regulatory Board activates it (Sec. 5).
 */
export const withFuelBand = (rules: TricycleFareRules, band: FuelBand): TricycleFareRules => ({
  ...rules,
  baseFare: band.baseFare,
  perSucceedingKm: band.perSucceedingKm,
});

/** A special trip is one passenger hiring the whole tricycle (Ord. 050-2026 Sec. 2d). */
export const canRequestSpecialTrip = ({ regular, discounted }: Passengers): boolean => regular + discounted === 1;

export function tricycleFare(
  rules: TricycleFareRules,
  distanceKm: number,
  passengers: Passengers,
  specialTrip: boolean,
): TricycleFare {
  const km = tricycleBillableKm(distanceKm);
  const extraKm = Math.max(0, km - rules.baseKm);
  const multiplier = specialTrip ? rules.specialTripMultiplier : 1;
  const fareFor = (fareClass: FareClass): Centavos =>
    (rules.baseFare[fareClass] + extraKm * rules.perSucceedingKm[fareClass]) * multiplier;
  const regularEach = fareFor("regular");
  const discountedEach = fareFor("discounted");

  return {
    specialTrip,
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
