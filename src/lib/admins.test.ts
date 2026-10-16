import { describe, expect, it } from "vitest";

import { isAdminEmail, parseAdminEmails } from "@/lib/admins";

describe("parseAdminEmails", () => {
  it("splits, trims, lowercases and drops blanks", () => {
    expect([...parseAdminEmails(" A@x.ph, b@y.ph ,,")]).toEqual(["a@x.ph", "b@y.ph"]);
  });

  it("is empty when the variable is unset", () => {
    expect(parseAdminEmails(undefined).size).toBe(0);
  });
});

describe("isAdminEmail", () => {
  const list = "admin@cabanatuan.gov.ph,helper@example.com";

  it("matches regardless of case and surrounding spaces", () => {
    expect(isAdminEmail("  Admin@Cabanatuan.gov.ph ", list)).toBe(true);
  });

  it("rejects addresses not on the list", () => {
    expect(isAdminEmail("someone@example.com", list)).toBe(false);
  });

  it("rejects everyone when no admins are configured", () => {
    expect(isAdminEmail("admin@cabanatuan.gov.ph", "")).toBe(false);
    expect(isAdminEmail(null, list)).toBe(false);
  });
});
