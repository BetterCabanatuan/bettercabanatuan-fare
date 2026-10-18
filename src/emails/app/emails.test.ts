import { createElement } from "react";
import { render } from "react-email";
import { describe, expect, it } from "vitest";

import NewSubmissionEmail, { newSubmissionSubject } from "@/emails/app/new-submission";
import SubmissionReviewedEmail, { submissionReviewedSubject } from "@/emails/app/submission-reviewed";

describe("new submission email", () => {
  it("names the submission and links to its review page", async () => {
    const props = NewSubmissionEmail.PreviewProps;
    const text = await render(createElement(NewSubmissionEmail, props), { plainText: true });
    expect(newSubmissionSubject(props)).toBe("New TODA to review: Sumacab Este TODA");
    expect(text).toContain("Juan dela Cruz");
    expect(text).toContain("A1B2C3");
    expect(text).toContain("http://localhost:3000/admin/todas");
  });

  it("says when the sender gave no name", async () => {
    const props = { ...NewSubmissionEmail.PreviewProps, from: null };
    const text = await render(createElement(NewSubmissionEmail, props), { plainText: true });
    expect(text).toContain("From: not given");
  });
});

describe("submission reviewed email", () => {
  it("writes a rejection in Tagalog with the admin's reason", async () => {
    const props = SubmissionReviewedEmail.PreviewProps;
    const html = await render(createElement(SubmissionReviewedEmail, props));
    const text = await render(createElement(SubmissionReviewedEmail, props), { plainText: true });
    expect(submissionReviewedSubject(props)).toBe("Hindi nailathala ang ruta ng jeep mo na Cabanatuan Terminal – Sangitan");
    expect(html).toContain('lang="tl"');
    expect(text).toContain("Dahilan: The pin for B is outside Cabanatuan City.");
    expect(text).toContain("http://localhost:3000/tl/fare/suggest");
  });

  it("leaves out the reason line for an approval", async () => {
    const props = { ...SubmissionReviewedEmail.PreviewProps, locale: "en", outcome: "approved", reason: null } as const;
    const text = await render(createElement(SubmissionReviewedEmail, props), { plainText: true });
    expect(submissionReviewedSubject(props)).toBe("Your jeep route Cabanatuan Terminal – Sangitan is now on the fare map");
    expect(text).not.toContain("Why:");
  });
});
