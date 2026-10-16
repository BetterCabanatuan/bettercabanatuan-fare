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

  it("use the same placeholders in English and Tagalog", () => {
    const sections = Object.keys(en) as (keyof typeof en)[];
    sections.forEach((section) => {
      Object.entries(en[section]).forEach(([key, text]) => {
        const translated = (tl[section] as Record<string, string>)[key];
        expect(placeholders(translated), `${section}.${key}`).toEqual(placeholders(text));
      });
    });
  });
});
