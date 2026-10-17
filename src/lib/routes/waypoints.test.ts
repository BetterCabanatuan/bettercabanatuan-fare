import { describe, expect, it } from "vitest";

import type { LngLat } from "@/lib/geo";
import { stopIndex } from "@/lib/routes/waypoints";

// An east-bound trip of about 4.3 km in Cabanatuan. Not real stops.
const A: LngLat = [120.96, 15.48];
const B: LngLat = [121.0, 15.48];
const west: LngLat = [120.97, 15.481];
const middle: LngLat = [120.98, 15.481];
const east: LngLat = [120.99, 15.481];

// The stops after placing `point` where stopIndex says it goes.
const insertStop = (stops: LngLat[], point: LngLat): LngLat[] => {
  const index = stopIndex(A, stops, B, point);
  return [...stops.slice(0, index), point, ...stops.slice(index)];
};

describe("stopIndex", () => {
  it("makes the first point stop 1", () => {
    expect(insertStop([], middle)).toEqual([middle]);
  });

  it("puts a point between two stops when it lies between them", () => {
    expect(insertStop([west, east], middle)).toEqual([west, middle, east]);
  });

  it("puts a point nearer A than every stop first", () => {
    expect(insertStop([middle, east], west)).toEqual([west, middle, east]);
  });

  it("puts a point nearer B than every stop last", () => {
    expect(insertStop([west, middle], east)).toEqual([west, middle, east]);
  });

  it("puts a point beyond B at the end, where it doubles back the least", () => {
    const pastB: LngLat = [121.01, 15.48];
    expect(insertStop([west], pastB)).toEqual([west, pastB]);
  });

  it("puts a point before A at the start", () => {
    const beforeA: LngLat = [120.95, 15.48];
    expect(insertStop([middle], beforeA)).toEqual([beforeA, middle]);
  });

  it("gives a tie to the earlier pair", () => {
    // Exactly on the first stop: adding it between A and the stop, or between the stop
    // and B, both add zero distance.
    expect(stopIndex(A, [middle], B, [...middle])).toBe(0);
  });
});
