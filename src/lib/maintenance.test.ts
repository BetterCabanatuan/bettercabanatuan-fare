import { describe, expect, it } from "vitest";

import {
  formatMaintenanceUntil,
  isMaintenanceOn,
  isOpenDuringMaintenance,
  parseMaintenanceUntil,
  retryAfter,
} from "@/lib/maintenance";

describe("isMaintenanceOn", () => {
  it("turns on only for true", () => {
    expect(isMaintenanceOn("true")).toBe(true);
    expect(isMaintenanceOn(" TRUE ")).toBe(true);
  });

  it("stays off when unset, false or mistyped", () => {
    expect(isMaintenanceOn(undefined)).toBe(false);
    expect(isMaintenanceOn("")).toBe(false);
    expect(isMaintenanceOn("false")).toBe(false);
    expect(isMaintenanceOn("ture")).toBe(false);
  });
});

describe("isOpenDuringMaintenance", () => {
  it("lets the admin area through in both languages, including sign-in", () => {
    expect(isOpenDuringMaintenance("/admin")).toBe(true);
    expect(isOpenDuringMaintenance("/admin/login")).toBe(true);
    expect(isOpenDuringMaintenance("/admin/todas/abc")).toBe(true);
    expect(isOpenDuringMaintenance("/tl/admin")).toBe(true);
    expect(isOpenDuringMaintenance("/tl/admin/login")).toBe(true);
  });

  it("holds back every public page", () => {
    expect(isOpenDuringMaintenance("/")).toBe(false);
    expect(isOpenDuringMaintenance("/tl")).toBe(false);
    expect(isOpenDuringMaintenance("/fare")).toBe(false);
    expect(isOpenDuringMaintenance("/tl/fare")).toBe(false);
    expect(isOpenDuringMaintenance("/feedback")).toBe(false);
    expect(isOpenDuringMaintenance("/maintenance")).toBe(false);
  });

  it("matches whole segments only", () => {
    expect(isOpenDuringMaintenance("/administrator")).toBe(false);
    expect(isOpenDuringMaintenance("/toda/admin")).toBe(false);
    expect(isOpenDuringMaintenance("/tladmin")).toBe(false);
  });
});

describe("parseMaintenanceUntil", () => {
  const now = new Date("2026-10-18T08:00:00Z");

  it("reads an ISO time with an offset", () => {
    expect(parseMaintenanceUntil("2026-10-18T18:00+08:00", now)?.toISOString()).toBe("2026-10-18T10:00:00.000Z");
    expect(parseMaintenanceUntil("2026-10-18T10:00:00Z", now)?.toISOString()).toBe("2026-10-18T10:00:00.000Z");
  });

  it("reads a time without an offset as Manila time", () => {
    expect(parseMaintenanceUntil("2026-10-18T18:00", now)?.toISOString()).toBe("2026-10-18T10:00:00.000Z");
  });

  it("ignores a missing, invalid or past time", () => {
    expect(parseMaintenanceUntil(undefined, now)).toBeNull();
    expect(parseMaintenanceUntil("  ", now)).toBeNull();
    expect(parseMaintenanceUntil("tomorrow", now)).toBeNull();
    expect(parseMaintenanceUntil("2026-10-18T15:00+08:00", now)).toBeNull();
  });
});

describe("retryAfter", () => {
  it("gives the end time as an HTTP date when known", () => {
    expect(retryAfter(new Date("2026-10-18T10:00:00Z"))).toBe("Sun, 18 Oct 2026 10:00:00 GMT");
  });

  it("falls back to an hour", () => {
    expect(retryAfter(null)).toBe("3600");
  });
});

describe("formatMaintenanceUntil", () => {
  const until = new Date("2026-10-18T10:00:00Z");

  it("shows Manila time in each language", () => {
    expect(formatMaintenanceUntil(until, "en")).toBe("Sunday 18 October at 6:00 pm");
    expect(formatMaintenanceUntil(until, "tl")).toBe("Linggo, Oktubre 18 nang 6:00 PM");
  });
});
