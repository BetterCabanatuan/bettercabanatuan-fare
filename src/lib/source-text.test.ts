import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { jeepFareReferences, routeReferences, terminals, tricycleFareReferences } from "@/lib/data";
import { collectUrls, displayUrl, sourceParts } from "@/lib/source-text";

describe("sourceParts", () => {
  it("links URLs and drops sentence punctuation after them", () => {
    expect(sourceParts("See https://www.pna.gov.ph/articles/1196835.")).toEqual([
      { at: 0, text: "See " },
      { at: 4, text: "pna.gov.ph/articles/1196835", href: "https://www.pna.gov.ph/articles/1196835" },
      { at: 43, text: "." },
    ]);
  });

  it("links OpenStreetMap ways and nodes", () => {
    expect(sourceParts("OpenStreetMap nodes 1003847611 and 921123555")).toEqual([
      { at: 0, text: "OpenStreetMap nodes 1003847611", href: "https://www.openstreetmap.org/node/1003847611" },
      { at: 30, text: " and 921123555" },
    ]);
  });

  it("leaves plain notes alone", () => {
    expect(sourceParts("Resident submission")).toEqual([{ at: 0, text: "Resident submission" }]);
  });
});

describe("displayUrl", () => {
  it("drops the protocol, www and trailing slash and decodes spaces", () => {
    expect(displayUrl("https://ph.commutetour.com/ph/terminal/cabanatuan/")).toBe("ph.commutetour.com/ph/terminal/cabanatuan");
    expect(displayUrl("https://www.researchpublish.com/upload/book/Cabanatuan%20City-3270.pdf")).toBe(
      "researchpublish.com/upload/book/Cabanatuan City-3270.pdf",
    );
  });
});

describe("Sources page", () => {
  it("lists every URL in data/", () => {
    const dataDir = path.join(process.cwd(), "data");
    const inData = readdirSync(dataDir, { recursive: true, encoding: "utf8" })
      .filter((file) => file.endsWith(".json"))
      .flatMap((file) => collectUrls(JSON.parse(readFileSync(path.join(dataDir, file), "utf8"))));
    const listed = [
      ...tricycleFareReferences,
      ...jeepFareReferences,
      ...Object.values(routeReferences).flat(),
      ...terminals.flatMap((terminal) => collectUrls(terminal.source)),
    ];
    expect(inData.filter((url) => !listed.includes(url))).toEqual([]);
  });
});
