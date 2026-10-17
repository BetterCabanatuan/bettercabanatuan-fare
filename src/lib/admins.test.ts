import { describe, expect, it } from "vitest";

import { isAdminEmail, parseAdminEmails, startedWithOAuth } from "@/lib/admins";

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

describe("startedWithOAuth", () => {
  it("spots a Google or Facebook sign-in in either amr format", () => {
    expect(startedWithOAuth([{ method: "oauth" }])).toBe(true);
    expect(startedWithOAuth(["oauth"])).toBe(true);
  });

  it("lets the emailed admin link through", () => {
    expect(startedWithOAuth([{ method: "otp" }])).toBe(false);
    expect(startedWithOAuth([{ method: "magiclink" }])).toBe(false);
    expect(startedWithOAuth(undefined)).toBe(false);
  });
});
