import { describe, expect, it } from "vitest";

import type { LngLat } from "@/lib/geo";
import {
  formDataToInput,
  parseSubmission,
  rejectionSchema,
  todaSlug,
  type SubmissionInput,
} from "@/lib/toda/submission";

const valid: SubmissionInput = {
  name: "Sumacab Este TODA",
  terminalDescription: "Beside the barangay hall, facing Maharlika Highway",
  barangay: "Sumacab Este",
  barangaysServed: ["Sumacab Este", "Sumacab Norte"],
};

// A square around central Cabanatuan, enough to tell inside from outside.
const box: LngLat[] = [
  [120.9, 15.42],
  [121.05, 15.42],
  [121.05, 15.56],
  [120.9, 15.56],
];

describe("parseSubmission", () => {
  it("accepts the required fields alone", () => {
    const result = parseSubmission(valid);
    expect(result.success).toBe(true);
  });

  it("requires a name, terminal and barangay", () => {
    const result = parseSubmission({ ...valid, name: " ", terminalDescription: "", barangay: "" });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(Object.keys(result.fieldErrors).sort()).toEqual(["barangay", "name", "terminalDescription"]);
  });

  it("trims text and turns blank optional fields into undefined", () => {
    const result = parseSubmission({ ...valid, name: "  Bitas TODA ", notes: "   ", officialContact: "" });
    expect(result.success && result.data).toMatchObject({ name: "Bitas TODA", notes: undefined, officialContact: undefined });
  });

  it("drops repeated barangays regardless of case", () => {
    const result = parseSubmission({ ...valid, barangaysServed: ["Bitas", "bitas", "Kapitan Pepe"] });
    expect(result.success && result.data.barangaysServed).toEqual(["Bitas", "Kapitan Pepe"]);
  });

  it("caps the barangays-served list", () => {
    const result = parseSubmission({ ...valid, barangaysServed: Array.from({ length: 21 }, (_, i) => `Barangay ${i}`) });
    expect(result.success).toBe(false);
  });

  it("accepts common phone formats and rejects other text", () => {
    expect(parseSubmission({ ...valid, officialContact: "(044) 463-0000" }).success).toBe(true);
    expect(parseSubmission({ ...valid, officialContact: "+63 917 123 4567" }).success).toBe(true);
    const bad = parseSubmission({ ...valid, officialContact: "call the president" });
    expect(!bad.success && bad.fieldErrors.officialContact).toBeTruthy();
  });

  it("needs both coordinates or neither", () => {
    const result = parseSubmission({ ...valid, lat: 15.48 });
    expect(!result.success && result.fieldErrors.lat).toBeTruthy();
  });

  it("rejects pins outside the city boundary", () => {
    expect(parseSubmission({ ...valid, lat: 15.48, lng: 120.97 }, box).success).toBe(true);
    const outside = parseSubmission({ ...valid, lat: 14.6, lng: 121.0 }, box);
    expect(!outside.success && outside.fieldErrors.lat).toMatch(/outside Cabanatuan/);
  });

  it("rejects non-whole unit counts", () => {
    expect(parseSubmission({ ...valid, units: 12.5 }).success).toBe(false);
  });

  it("treats a submission as the main terminal unless it says otherwise", () => {
    const result = parseSubmission(valid);
    expect(result.success && result.data.connectedTerminal).toBe(false);
  });

  it("needs a pin for another terminal of a listed TODA", () => {
    const unpinned = parseSubmission({ ...valid, connectedTerminal: true });
    expect(!unpinned.success && unpinned.fieldErrors.lat).toMatch(/needs its own pin/);
    expect(parseSubmission({ ...valid, connectedTerminal: true, lat: 15.48, lng: 120.97 }).success).toBe(true);
  });
});

describe("formDataToInput", () => {
  it("reads repeated barangay fields and empty numbers", () => {
    const form = new FormData();
    form.set("name", "Bitas TODA");
    form.append("barangaysServed", "Bitas");
    form.append("barangaysServed", "");
    form.append("barangaysServed", "Kapitan Pepe");
    form.set("units", "");
    form.set("lat", "15.5");
    expect(formDataToInput(form)).toMatchObject({
      name: "Bitas TODA",
      barangaysServed: ["Bitas", "Kapitan Pepe"],
      units: undefined,
      lat: 15.5,
      lng: undefined,
      connectedTerminal: false,
    });
  });

  it("reads the position choice", () => {
    const form = new FormData();
    form.set("connectedTerminal", "true");
    expect(formDataToInput(form).connectedTerminal).toBe(true);
  });
});

describe("rejectionSchema", () => {
  it("requires a short reason", () => {
    expect(rejectionSchema.safeParse("no").success).toBe(false);
    expect(rejectionSchema.safeParse("Duplicate of Bitas TODA").success).toBe(true);
  });
});

describe("todaSlug", () => {
  it("makes a stable url-safe id", () => {
    expect(todaSlug("Sumacab Este TODA")).toBe("sumacab-este-toda");
    expect(todaSlug("  Sta. Arcadia – Bañadero TODA ")).toBe("sta-arcadia-banadero-toda");
  });
});
