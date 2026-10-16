import { describe, expect, it } from "vitest";

import { en } from "@/lib/i18n/dictionaries/en";
import { tl } from "@/lib/i18n/dictionaries/tl";
import { fill, localizePath, stripLocale } from "@/lib/i18n/locales";

describe("locale paths", () => {
  it("keeps English unprefixed and puts Tagalog under /tl", () => {
    expect(localizePath("en", "/fare")).toBe("/fare");
    expect(localizePath("tl", "/fare")).toBe("/tl/fare");
    expect(localizePath("tl", "/")).toBe("/tl");
  });

  it("removes any locale prefix, including the internal /en one", () => {
    expect(stripLocale("/tl/fare")).toBe("/fare");
    expect(stripLocale("/tl")).toBe("/");
    expect(stripLocale("/en/fare")).toBe("/fare");
    expect(stripLocale("/fare")).toBe("/fare");
    expect(stripLocale("/tlx")).toBe("/tlx");
  });
});

describe("fill", () => {
  it("replaces known placeholders and leaves unknown ones", () => {
    expect(fill("{count} km × {rate}", { count: 2, rate: "₱2.00" })).toBe("2 km × ₱2.00");
    expect(fill("{missing}", {})).toBe("{missing}");
  });
});

describe("dictionaries", () => {
  const placeholders = (text: string): string[] => [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();

  /** Every string in a dictionary, keyed by its dotted path (nested objects and lists included). */
  const leaves = (value: unknown, path = ""): [string, string][] =>
    typeof value === "string"
      ? [[path, value]]
      : Object.entries(value as Record<string, unknown>).flatMap(([key, child]) =>
          leaves(child, path ? `${path}.${key}` : key),
        );

  it("use the same placeholders in English and Tagalog", () => {
    const translated = new Map(leaves(tl));
    leaves(en).forEach(([path, text]) => {
      expect(translated.has(path), path).toBe(true);
      expect(placeholders(translated.get(path) ?? ""), path).toEqual(placeholders(text));
    });
  });
});
