import { describe, expect, it } from "vitest";

import type { LngLat } from "@/lib/geo";
import { SUBMISSION_LIMITS, formDataToInput, parseSubmission, type SubmissionInput } from "@/lib/routes/submission";

// A Cabanatuan – Talavera trip, roughly. Not exact terminal positions.
const valid: SubmissionInput = {
  fromName: "Cabanatuan Central Terminal",
  toName: "Talavera public market",
  fromLat: 15.4865,
  fromLng: 120.9667,
  toLat: 15.5886,
  toLng: 120.9192,
};

// A square around central Cabanatuan, enough to tell inside from outside.
const box: LngLat[] = [
  [120.9, 15.42],
  [121.05, 15.42],
  [121.05, 15.56],
  [120.9, 15.56],
];

const stop: LngLat = [120.95, 15.52];

const waypointError = (waypoints: unknown) => {
  const result = parseSubmission({ ...valid, waypoints }, box);
  return result.success ? undefined : result.fieldErrors.waypoints;
};

describe("parseSubmission waypoints", () => {
  it("treats a missing list as no stops", () => {
    const result = parseSubmission(valid, box);
    expect(result.success && result.data.waypoints).toEqual([]);
  });

  it("keeps valid stops in the order given", () => {
    const second: LngLat = [120.93, 15.56];
    const result = parseSubmission({ ...valid, waypoints: [stop, second] }, box);
    expect(result.success && result.data.waypoints).toEqual([stop, second]);
  });

  it(`accepts up to ${SUBMISSION_LIMITS.waypoints} stops and no more`, () => {
    expect(waypointError(Array(SUBMISSION_LIMITS.waypoints).fill(stop))).toBeUndefined();
    expect(waypointError(Array(SUBMISSION_LIMITS.waypoints + 1).fill(stop))).toBe("waypoints");
  });

  it("rejects text that isn't a list of number pairs", () => {
    expect(waypointError("not json")).toBe("waypoints");
    expect(waypointError({ lng: 120.95, lat: 15.52 })).toBe("waypoints");
    expect(waypointError([[120.95]])).toBe("waypoints");
    expect(waypointError([[120.95, 15.52, 3]])).toBe("waypoints");
    expect(waypointError([["120.95", "15.52"]])).toBe("waypoints");
  });

  it("rejects coordinates outside the globe", () => {
    expect(waypointError([[200, 15.52]])).toBe("waypoints");
    expect(waypointError([[120.95, 95]])).toBe("waypoints");
  });

  it(`rejects a stop more than ${SUBMISSION_LIMITS.waypointKm} km from the city`, () => {
    // About 55 km north, near San Jose City: allowed.
    expect(waypointError([[120.99, 15.98]])).toBeUndefined();
    // About 85 km south, in Bulacan: too far.
    expect(waypointError([[120.9, 14.72]])).toBe("waypoints");
  });

  it("still requires one end inside the city", () => {
    const result = parseSubmission(
      { ...valid, fromLat: 15.7, fromLng: 120.9, toLat: 15.3, toLng: 121.2, waypoints: [stop] },
      box,
    );
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.fieldErrors.fromLat).toBe("outsideCity");
  });
});

describe("formDataToInput", () => {
  const form = (waypoints?: string) => {
    const data = new FormData();
    if (waypoints !== undefined) data.set("waypoints", waypoints);
    return formDataToInput(data).waypoints;
  };

  it("reads the stops posted as JSON", () => {
    expect(form("[[120.95,15.52]]")).toEqual([[120.95, 15.52]]);
  });

  it("treats a missing or blank field as no stops", () => {
    expect(form()).toBeUndefined();
    expect(form(" ")).toBeUndefined();
  });

  it("passes text that isn't JSON on for the schema to reject", () => {
    expect(form("[[120.95,")).toBe("[[120.95,");
  });
});
