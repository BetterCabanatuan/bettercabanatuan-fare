import { describe, expect, it } from "vitest";

import type { LngLat } from "@/lib/geo";
import {
  MAX_CONNECTED_TERMINALS,
  connectedTerminalsSchema,
  formDataToTerminals,
  parseTerminals,
  type TerminalInput,
} from "@/lib/toda/terminals";

// A square around central Cabanatuan, enough to tell inside from outside.
const box: LngLat[] = [
  [120.9, 15.42],
  [121.05, 15.42],
  [121.05, 15.56],
  [120.9, 15.56],
];

const main: TerminalInput = { terminalDescription: "Main entrance of the mall", barangay: "San Juan Poblacion", lat: 15.4668, lng: 120.9551 };
const other: TerminalInput = { terminalDescription: "Back gate, near the parking", barangay: "San Juan Poblacion", lat: 15.4657, lng: 120.9539 };

describe("parseTerminals", () => {
  it("splits the main terminal from the connected ones", () => {
    const result = parseTerminals([main, other], box);
    expect(result).toEqual({
      success: true,
      main: { terminalDescription: main.terminalDescription, barangay: main.barangay, lat: main.lat, lng: main.lng },
      connected: [other],
    });
  });

  it("lets the main terminal go without a pin, as older listings do", () => {
    const result = parseTerminals([{ terminalDescription: "Beside the chapel", barangay: "Bitas" }], box);
    expect(result).toMatchObject({ success: true, main: { lat: null, lng: null }, connected: [] });
  });

  it("needs a pin on every connected terminal", () => {
    const result = parseTerminals([main, { terminalDescription: "Beside the chapel", barangay: "Bitas" }], box);
    expect(result).toEqual({ success: false, index: 1, message: "Pin this terminal on the map." });
  });

  it("names the row with a bad description", () => {
    const result = parseTerminals([main, other, { ...other, terminalDescription: "x" }], box);
    expect(result).toMatchObject({ success: false, index: 2 });
  });

  it("rejects pins outside the city boundary", () => {
    const result = parseTerminals([main, { ...other, lat: 14.6, lng: 121.0 }], box);
    expect(result).toMatchObject({ success: false, index: 1, message: expect.stringMatching(/outside Cabanatuan/) });
  });

  it("requires a main terminal and caps the connected ones", () => {
    expect(parseTerminals([], box).success).toBe(false);
    const tooMany = [main, ...Array.from({ length: MAX_CONNECTED_TERMINALS + 1 }, () => other)];
    expect(parseTerminals(tooMany, box).success).toBe(false);
    expect(parseTerminals(tooMany.slice(0, -1), box).success).toBe(true);
  });
});

describe("connectedTerminalsSchema", () => {
  it("reads the JSONB column and refuses entries without a position", () => {
    expect(connectedTerminalsSchema.safeParse([other]).success).toBe(true);
    expect(connectedTerminalsSchema.safeParse([{ ...other, lat: null }]).success).toBe(false);
    expect(connectedTerminalsSchema.safeParse({}).success).toBe(false);
  });
});

describe("formDataToTerminals", () => {
  it("zips the repeated fields in order and reads blank pins as missing", () => {
    const form = new FormData();
    for (const [description, barangay, lat, lng] of [
      ["Main entrance", "Dicarma", "15.493", "120.975"],
      ["Side street", "Dicarma", "", ""],
    ]) {
      form.append("terminalDescription", description);
      form.append("barangay", barangay);
      form.append("lat", lat);
      form.append("lng", lng);
    }
    expect(formDataToTerminals(form)).toEqual([
      { terminalDescription: "Main entrance", barangay: "Dicarma", lat: 15.493, lng: 120.975 },
      { terminalDescription: "Side street", barangay: "Dicarma", lat: undefined, lng: undefined },
    ]);
  });
});
