import { describe, expect, it } from "vitest";

import type { LngLat } from "@/lib/geo";
import { loopingStop, stopIndex } from "@/lib/routes/waypoints";

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

describe("loopingStop", () => {
  // Each straight leg of A, west, middle, east, B is about 1.1 km.
  const points = [A, west, middle, east, B];

  it("finds nothing when every leg follows the straight line closely", () => {
    expect(loopingStop(points, [1.3, 1.2, 1.4, 1.2])).toBeNull();
  });

  it("names the stop a looping leg ends at", () => {
    expect(loopingStop(points, [1.3, 1.2, 4.0, 1.2])).toBe(3);
  });

  it("names the last stop when the leg into B loops", () => {
    expect(loopingStop(points, [1.3, 1.2, 1.4, 4.0])).toBe(3);
  });

  it("names the first looping stop when there are several", () => {
    expect(loopingStop(points, [4.0, 1.2, 4.0, 1.2])).toBe(1);
  });

  it("catches a stop 30 m away by air that takes 700 m by road", () => {
    // From OSRM: a stop on Champaca Street, then one tapped onto Sanciangco Street, which
    // runs alongside it with no turn between.
    const champaca: LngLat = [120.963989, 15.48403];
    const sanciangco: LngLat = [120.963776, 15.48386];
    expect(loopingStop([A, champaca, sanciangco, B], [0.4, 0.7, 0.9])).toBe(2);
  });

  it("ignores short legs, where a junction's turns are most of the distance", () => {
    const near: LngLat = [120.9601, 15.4801];
    expect(loopingStop([A, near, B], [0.2, 4.4])).toBeNull();
  });

  it("has no stop to name when there are none", () => {
    expect(loopingStop([A, B], [20])).toBeNull();
  });
});
