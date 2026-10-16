import { describe, expect, it } from "vitest";

import { billableKm, formatPeso, jeepFare, tricycleFare, type JeepFareRules, type TricycleFareRules } from "@/lib/fare";

// Mirrors data/tricycle/fare-matrix.json (2018 matrix, unconfirmed).
const tricycleRules: TricycleFareRules = {
  baseKm: 3,
  regular: { solo: 2000, shared: 1500 },
  discounted: { solo: 1500, shared: 1000 },
  perSucceedingKm: { solo: 1000, shared: 500 },
};

// Mirrors data/jeepney/fare-rules.json (effective 2026-09-28).
const jeepRules: JeepFareRules = {
  effectiveDate: "2026-09-28",
  discountRate: 0.2,
  types: {
    traditional: { label: "Traditional jeepney", baseFare: 1400, baseKm: 4, perSucceedingKm: 200 },
    modern: { label: "Modern jeepney", baseFare: 1700, baseKm: 4, perSucceedingKm: 240 },
  },
};

describe("billableKm", () => {
  it("rounds the displayed distance to the nearest whole km, at least 1 km", () => {
    expect(billableKm(4.2)).toBe(4);
    expect(billableKm(4.5)).toBe(5);
    expect(billableKm(6)).toBe(6);
    expect(billableKm(0.2)).toBe(1);
  });

  it("ignores floating noise below the displayed 0.1 km", () => {
    expect(billableKm(6.0000004)).toBe(6);
  });
});

describe("tricycleFare (worked examples from docs/specs/tricycle-fare-estimator.md)", () => {
  it.each([
    { km: 2.4, regular: 1, discounted: 0, total: 2000, rate: "solo" },
    { km: 2.4, regular: 0, discounted: 1, total: 1500, rate: "solo" },
    { km: 4.6, regular: 1, discounted: 0, total: 4000, rate: "solo" },
    { km: 4.6, regular: 2, discounted: 0, total: 5000, rate: "shared" },
    { km: 6.0, regular: 1, discounted: 1, total: 5500, rate: "shared" },
  ])("$km km, $regular regular + $discounted discounted → $total", ({ km, regular, discounted, total, rate }) => {
    const fare = tricycleFare(tricycleRules, km, { regular, discounted });
    expect(fare.total).toBe(total);
    expect(fare.rate).toBe(rate);
  });

  it("matches the rider-reported ₱100 solo trip to Jollibee Crossing (11.4 km)", () => {
    const fare = tricycleFare(tricycleRules, 11.4, { regular: 1, discounted: 0 });
    expect(fare).toMatchObject({ billableKm: 11, extraKm: 8, total: 10000 });
  });

  it("charges the minimum fare for very short trips", () => {
    expect(tricycleFare(tricycleRules, 0.05, { regular: 1, discounted: 0 }).total).toBe(2000);
  });

  it("adds ₱5 per passenger for each km after 3 km when shared", () => {
    const fare = tricycleFare(tricycleRules, 5, { regular: 3, discounted: 0 });
    expect(fare.extraKm).toBe(2);
    expect(fare.regularEach).toBe(2500);
    expect(fare.total).toBe(7500);
  });

  it("adds ₱10 for each km after 3 km when riding alone", () => {
    expect(tricycleFare(tricycleRules, 5, { regular: 1, discounted: 0 }).total).toBe(4000);
    expect(tricycleFare(tricycleRules, 5, { regular: 0, discounted: 1 }).total).toBe(3500);
  });
});

describe("jeepFare", () => {
  it("charges the base fare up to 4 km", () => {
    expect(jeepFare(jeepRules, "traditional", 3)).toMatchObject({ regular: 1400, discounted: 1120 });
    expect(jeepFare(jeepRules, "traditional", 4)).toMatchObject({ regular: 1400, extraKm: 0 });
  });

  it("adds the per-km rate after 4 km", () => {
    expect(jeepFare(jeepRules, "traditional", 10)).toMatchObject({ regular: 2600, discounted: 2080 });
    expect(jeepFare(jeepRules, "modern", 10)).toMatchObject({ regular: 3140, discounted: 2512 });
  });

  it("bills part-kilometres to the nearest whole km", () => {
    expect(jeepFare(jeepRules, "traditional", 8.4)).toMatchObject({ billableKm: 8, regular: 2200, discounted: 1760 });
    expect(jeepFare(jeepRules, "traditional", 8.6)).toMatchObject({ billableKm: 9, regular: 2400, discounted: 1920 });
  });
});

describe("formatPeso", () => {
  it("formats centavos as pesos with two decimals", () => {
    expect(formatPeso(2080)).toBe("₱20.80");
  });
});
