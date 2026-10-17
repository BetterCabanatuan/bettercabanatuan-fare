import { describe, expect, it } from "vitest";

import { sameSiteUrl } from "@/lib/same-site-url";

const base = "https://pamasahe.example/api/auth/callback?code=x";

describe("sameSiteUrl", () => {
  it("keeps a path on this site, query included", () => {
    expect(sameSiteUrl("/tl/feedback?from=%2Ffare", base, "/feedback").href).toBe(
      "https://pamasahe.example/tl/feedback?from=%2Ffare",
    );
  });

  it("falls back for other sites, however they are written", () => {
    for (const next of ["https://evil.example/", "//evil.example", "/\\evil.example"]) {
      expect(sameSiteUrl(next, base, "/feedback").href).toBe("https://pamasahe.example/feedback");
    }
  });
});
