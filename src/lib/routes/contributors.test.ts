import { describe, expect, it } from "vitest";

import { parsePublicName, toBoard, type BoardRow } from "@/lib/routes/contributors";

describe("parsePublicName", () => {
  it("trims and collapses spaces", () => {
    expect(parsePublicName("  Kuya   Juan ")).toEqual({ success: true, name: "Kuya Juan" });
  });

  it("accepts 2 to 40 characters", () => {
    expect(parsePublicName("JD").success).toBe(true);
    expect(parsePublicName("a".repeat(40)).success).toBe(true);
    expect(parsePublicName("J")).toEqual({ success: false, error: "length" });
    expect(parsePublicName("a".repeat(41))).toEqual({ success: false, error: "length" });
    expect(parsePublicName("   ")).toEqual({ success: false, error: "length" });
  });

  it("refuses email addresses", () => {
    expect(parsePublicName("juan@example.com")).toEqual({ success: false, error: "contact" });
  });

  it("refuses phone numbers, however they are spaced", () => {
    expect(parsePublicName("09171234567")).toEqual({ success: false, error: "contact" });
    expect(parsePublicName("Juan 0917 123 4567")).toEqual({ success: false, error: "contact" });
    expect(parsePublicName("+63 (917) 123-4567")).toEqual({ success: false, error: "contact" });
  });

  it("allows short numbers such as a year or route number", () => {
    expect(parsePublicName("Route 66 fan 2026").success).toBe(true);
  });
});

describe("toBoard", () => {
  const id = {
    a: "3f1c2a8e-6b0d-4c55-9a7e-1d2b3c4d5e6f",
    b: "8a7b6c5d-4e3f-4a1b-8c2d-9e0f1a2b3c4d",
    c: "0d9e8f7a-6b5c-4d3e-a2f1-0b9c8d7e6f5a",
    d: "b4c3d2e1-f0a9-4b8c-97d6-e5f4a3b2c1d0",
  };
  const rows: BoardRow[] = [
    { userId: id.a, publicName: "Kuya Juan", approved: 12, latest: "2026-10-01T02:00:00Z", rank: 1 },
    { userId: id.b, publicName: null, approved: 7, latest: "2026-09-12T02:00:00Z", rank: 2 },
    { userId: id.c, publicName: "", approved: 7, latest: "2026-10-05T02:00:00Z", rank: 2 },
    { userId: id.d, publicName: "Maria S.", approved: 3, latest: "2026-10-10T02:00:00Z", rank: 4 },
  ];

  it("keeps the database's order and ranks, and drops user ids", () => {
    const { top } = toBoard(rows, null);
    expect(top.map((entry) => entry.rank)).toEqual([1, 2, 2, 4]);
    expect(top[0]).toEqual({
      key: expect.any(String),
      rank: 1,
      name: "Kuya Juan",
      approved: 12,
      latest: new Date("2026-10-01T02:00:00Z"),
      isYou: false,
    });
    expect(top.some((entry) => "userId" in entry)).toBe(false);
    expect(new Set(top.map((entry) => entry.key)).size).toBe(rows.length);
    expect(top.some((entry) => rows.some((row) => entry.key.includes(row.userId)))).toBe(false);
  });

  it("shows riders without a name as anonymous", () => {
    const { top } = toBoard(rows, null);
    expect(top[1].name).toBeNull();
    expect(top[2].name).toBeNull();
  });

  it("marks the signed-in rider's row", () => {
    const board = toBoard(rows, id.b);
    expect(board.top.filter((entry) => entry.isYou)).toHaveLength(1);
    expect(board.you).toMatchObject({ rank: 2, approved: 7, isYou: true });
  });

  it("finds the signed-in rider below the top of the board", () => {
    const board = toBoard(rows, id.d, 2);
    expect(board.top).toHaveLength(2);
    expect(board.you).toMatchObject({ rank: 4, approved: 3 });
  });

  it("has no row for a rider with nothing approved, or nobody signed in", () => {
    expect(toBoard(rows, "11111111-2222-4333-8444-555555555555").you).toBeNull();
    expect(toBoard(rows, null).you).toBeNull();
  });
});
