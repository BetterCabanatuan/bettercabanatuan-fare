import { describe, expect, it } from "vitest";

import {
  filterTodas,
  hasPin,
  isFiltered,
  NO_TODA_FILTER,
  sortTodas,
  todaBarangays,
  type TodaFilter,
} from "@/lib/toda/directory";
import type { TodaListItem } from "@/lib/toda/queries";

const toda = (overrides: Partial<TodaListItem> & Pick<TodaListItem, "id" | "name" | "barangay">): TodaListItem => ({
  terminalDescription: "Beside the public market",
  lat: null,
  lng: null,
  connectedTerminals: [],
  barangaysServed: [],
  units: null,
  officialContact: null,
  source: "community",
  lastVerified: "2026-10-01",
  ...overrides,
});

const bitas = toda({
  id: "bitas",
  name: "Bitas TODA",
  barangay: "Bitas",
  barangaysServed: ["Sumacab Este", "Daan Sarile"],
  officialContact: "0917 123 4567",
  lat: 15.49,
  lng: 120.96,
});
const mall = toda({
  id: "mall",
  name: "Mall Crossing TODA",
  barangay: "Zone 10 (Pob.)",
  terminalDescription: "Front of the mall",
  connectedTerminals: [{ terminalDescription: "Back entrance on Burgos Ave", barangay: "Peñaranda", lat: 15.48, lng: 120.97 }],
  officialContact: "  ",
});
const aduas = toda({ id: "aduas", name: "Aduas TODA", barangay: "Zone 2 (Pob.)", barangaysServed: ["bitas"] });
const all = [aduas, bitas, mall];

const ids = (filter: Partial<TodaFilter>): string[] =>
  filterTodas(all, { ...NO_TODA_FILTER, ...filter }).map((item) => item.id);

describe("todaBarangays", () => {
  it("lists terminal, connected terminal and served barangays once each, sorted", () => {
    expect(todaBarangays(all)).toEqual([
      "Bitas",
      "Daan Sarile",
      "Peñaranda",
      "Sumacab Este",
      "Zone 2 (Pob.)",
      "Zone 10 (Pob.)",
    ]);
  });

  it("lists spellings that differ only in case once, preferring the terminal's", () => {
    // Aduas comes first and lists "bitas" as served; Bitas TODA's terminal says "Bitas".
    expect(todaBarangays([aduas, bitas])).toEqual(["Bitas", "Daan Sarile", "Sumacab Este", "Zone 2 (Pob.)"]);
  });
});

describe("filterTodas", () => {
  it("keeps every TODA when nothing is filtered", () => {
    expect(ids({})).toEqual(["aduas", "bitas", "mall"]);
  });

  it("finds TODAs by terminal barangay, connected terminal barangay or barangay served", () => {
    expect(ids({ barangay: "Bitas" })).toEqual(["aduas", "bitas"]);
    expect(ids({ barangay: "Sumacab Este" })).toEqual(["bitas"]);
    expect(ids({ barangay: "Penaranda" })).toEqual(["mall"]);
  });

  it("keeps only TODAs with an official contact, ignoring blank ones", () => {
    expect(ids({ hasContact: true })).toEqual(["bitas"]);
  });

  it("keeps only TODAs with a pin on the main or a connected terminal", () => {
    expect(ids({ hasPin: true })).toEqual(["bitas", "mall"]);
    expect(hasPin(aduas)).toBe(false);
  });

  it("searches names, terminal descriptions and barangays, ignoring case and accents", () => {
    expect(ids({ query: "MALL" })).toEqual(["mall"]);
    expect(ids({ query: "burgos" })).toEqual(["mall"]);
    expect(ids({ query: "penaranda" })).toEqual(["mall"]);
    expect(ids({ query: "daan sarile" })).toEqual(["bitas"]);
  });

  it("needs every filter and every word to match", () => {
    expect(ids({ barangay: "Bitas", hasContact: true })).toEqual(["bitas"]);
    expect(ids({ query: "aduas market", hasPin: true })).toEqual([]);
  });
});

describe("isFiltered", () => {
  it("ignores a query of only spaces", () => {
    expect(isFiltered({ ...NO_TODA_FILTER, query: "   " })).toBe(false);
    expect(isFiltered({ ...NO_TODA_FILTER, hasPin: true })).toBe(true);
  });
});

describe("sortTodas", () => {
  const sorted = (key: "name" | "barangay", direction: "ascending" | "descending"): string[] =>
    sortTodas(all, { key, direction }).map((item) => item.id);

  it("sorts by name either way", () => {
    expect(sorted("name", "ascending")).toEqual(["aduas", "bitas", "mall"]);
    expect(sorted("name", "descending")).toEqual(["mall", "bitas", "aduas"]);
  });

  it("sorts by the main terminal's barangay, with zone numbers in order", () => {
    expect(sorted("barangay", "ascending")).toEqual(["bitas", "aduas", "mall"]);
    expect(sorted("barangay", "descending")).toEqual(["mall", "aduas", "bitas"]);
  });

  it("does not change the list it was given", () => {
    sortTodas(all, { key: "name", direction: "descending" });
    expect(all.map((item) => item.id)).toEqual(["aduas", "bitas", "mall"]);
  });
});
