import { describe, expect, it } from "vitest";

import {
  billableKm,
  formatPeso,
  jeepFare,
  tricycleBillableKm,
  tricycleFare,
  type JeepFareRules,
  type TricycleFareRules,
} from "@/lib/fare";

// Mirrors data/tricycle/fare-matrix.json (Ordinance No. 050-2026, base fuel band).
const tricycleRules: TricycleFareRules = {
  baseKm: 3,
  baseFare: { regular: 3500, discounted: 2800 },
  perSucceedingKm: { regular: 500, discounted: 400 },
  maxPassengers: 3,
  specialTripMultiplier: 2,
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

describe("tricycleBillableKm", () => {
  it("charges any part of a km as a full km (Ord. 050-2026 Sec. 3)", () => {
    expect(tricycleBillableKm(3)).toBe(3);
    expect(tricycleBillableKm(3.1)).toBe(4);
    expect(tricycleBillableKm(11.4)).toBe(12);
    expect(tricycleBillableKm(0.2)).toBe(1);
  });

  it("rounds up the displayed distance, not floating noise", () => {
    expect(tricycleBillableKm(6.0000004)).toBe(6);
    expect(tricycleBillableKm(3.04)).toBe(3);
  });
});

describe("tricycleFare (worked examples from docs/research/tricycle-fares-and-tariffs.md)", () => {
  it.each([
    { km: 2.4, regular: 1, discounted: 0, total: 3500 },
    { km: 2.4, regular: 0, discounted: 1, total: 2800 },
    { km: 3.0, regular: 1, discounted: 0, total: 3500 },
    { km: 3.1, regular: 1, discounted: 0, total: 4000 },
    { km: 4.6, regular: 1, discounted: 0, total: 4500 },
    { km: 4.6, regular: 2, discounted: 0, total: 9000 },
    { km: 6.0, regular: 1, discounted: 1, total: 9000 },
    { km: 11.4, regular: 1, discounted: 0, total: 8000 },
    { km: 14.4, regular: 1, discounted: 0, total: 9500 },
    { km: 14.4, regular: 0, discounted: 1, total: 7600 },
  ])("$km km, $regular regular + $discounted discounted → $total", ({ km, regular, discounted, total }) => {
    expect(tricycleFare(tricycleRules, km, { regular, discounted }, false).total).toBe(total);
  });

  it("charges the same fare per passenger whether riding alone or shared", () => {
    const solo = tricycleFare(tricycleRules, 5, { regular: 1, discounted: 0 }, false);
    const shared = tricycleFare(tricycleRules, 5, { regular: 3, discounted: 0 }, false);
    expect(solo.regularEach).toBe(4500);
    expect(shared.regularEach).toBe(4500);
    expect(shared.total).toBe(13500);
  });

  it("charges ₱4 per succeeding km for discounted riders", () => {
    const fare = tricycleFare(tricycleRules, 5, { regular: 0, discounted: 1 }, false);
    expect(fare).toMatchObject({ extraKm: 2, discountedEach: 3600 });
  });

  it("charges the minimum fare for very short trips", () => {
    expect(tricycleFare(tricycleRules, 0.05, { regular: 1, discounted: 0 }, false).total).toBe(3500);
  });

  it("charges two passenger fares for a requested special trip", () => {
    expect(tricycleFare(tricycleRules, 2.4, { regular: 1, discounted: 0 }, true).total).toBe(7000);
    expect(tricycleFare(tricycleRules, 2.4, { regular: 0, discounted: 1 }, true).total).toBe(5600);
    expect(tricycleFare(tricycleRules, 11.4, { regular: 1, discounted: 0 }, true).total).toBe(16000);
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
