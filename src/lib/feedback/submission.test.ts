import { describe, expect, it } from "vitest";

import { feedbackPath, formDataToInput, parseFeedback, sitePath } from "@/lib/feedback/submission";

const valid = { topic: "WRONG_FARE", message: "The driver charged ₱40 for this trip.", pagePath: "/fare?a=1,2&b=3,4" };

describe("parseFeedback", () => {
  it("accepts a topic, a message and the page the rider came from", () => {
    const result = parseFeedback(valid);
    expect(result).toEqual({ success: true, data: valid });
  });

  it("trims the message and needs at least 10 characters", () => {
    expect(parseFeedback({ ...valid, message: "   too short   " })).toEqual({
      success: false,
      fieldErrors: { message: "messageShort" },
    });
  });

  it("caps the message at 2000 characters", () => {
    expect(parseFeedback({ ...valid, message: "x".repeat(2001) })).toEqual({
      success: false,
      fieldErrors: { message: "messageLong" },
    });
  });

  it("needs a known topic", () => {
    expect(parseFeedback({ ...valid, topic: "PRAISE" })).toEqual({ success: false, fieldErrors: { topic: "topic" } });
    expect(parseFeedback({ ...valid, topic: "" })).toEqual({ success: false, fieldErrors: { topic: "topic" } });
  });

  it("drops a page that is not on this site instead of failing", () => {
    const result = parseFeedback({ ...valid, pagePath: "https://example.com/" });
    expect(result.success && result.data.pagePath).toBeUndefined();
  });
});

describe("sitePath", () => {
  it("keeps paths on this site", () => {
    expect(sitePath("/tl/fare?mode=jeep")).toBe("/tl/fare?mode=jeep");
  });

  it("rejects other sites, protocol-relative and backslash tricks", () => {
    expect(sitePath("https://evil.example")).toBeUndefined();
    expect(sitePath("//evil.example")).toBeUndefined();
    expect(sitePath("/\\evil.example")).toBeUndefined();
    expect(sitePath("fare")).toBeUndefined();
    expect(sitePath(null)).toBeUndefined();
  });

  it("rejects paths over 500 characters", () => {
    expect(sitePath(`/${"a".repeat(500)}`)).toBeUndefined();
  });
});

describe("formDataToInput", () => {
  it("reads the posted fields and leaves a blank page out", () => {
    const formData = new FormData();
    formData.set("topic", "OTHER");
    formData.set("message", "Hello there, nice app");
    formData.set("pagePath", "");
    expect(formDataToInput(formData)).toEqual({ topic: "OTHER", message: "Hello there, nice app", pagePath: undefined });
  });
});

describe("feedbackPath", () => {
  it("keeps the rider's language and the page they came from", () => {
    expect(feedbackPath("en")).toBe("/feedback");
    expect(feedbackPath("tl", "/tl/fare?mode=jeep")).toBe("/tl/feedback?from=%2Ftl%2Ffare%3Fmode%3Djeep");
  });

  it("drops a page that is not on this site", () => {
    expect(feedbackPath("en", "https://evil.example")).toBe("/feedback");
  });
});
