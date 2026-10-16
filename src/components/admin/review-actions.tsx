"use client";

import { Check, X } from "lucide-react";
import { useId, useState, useTransition, type FormEvent } from "react";

import { approveSubmission, rejectSubmission, type ReviewResult } from "@/app/admin/todas/actions";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";

export function ReviewActions({ id, updatesExisting }: { id: string; updatesExisting: boolean }) {
  const [mode, setMode] = useState<"idle" | "rejecting">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const reasonId = useId();

  const run = (action: () => Promise<ReviewResult>) =>
    startTransition(async () => {
      const result = await action();
      setMessage(result.ok ? null : result.message);
    });

  function handleReject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const reason = String(new FormData(event.currentTarget).get("reason") ?? "");
    run(() => rejectSubmission(id, reason));
  }

  if (mode === "rejecting") {
    return (
      <form onSubmit={handleReject} noValidate className="flex flex-col gap-3">
        <Field data-invalid={message ? true : undefined}>
          <FieldLabel htmlFor={reasonId}>Reason for rejecting</FieldLabel>
          <Textarea
            id={reasonId}
            name="reason"
            required
            maxLength={300}
            placeholder="e.g. Duplicate of Bitas TODA, or no such terminal at this location"
            aria-invalid={message ? true : undefined}
            autoFocus
          />
          <FieldError>{message}</FieldError>
        </Field>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" variant="destructive" disabled={isPending}>
            {isPending ? "Rejecting…" : "Reject submission"}
          </Button>
          <Button type="button" variant="ghost" disabled={isPending} onClick={() => { setMode("idle"); setMessage(null); }}>
            Cancel
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <Button disabled={isPending} onClick={() => run(() => approveSubmission(id))}>
          <Check aria-hidden="true" />
          {isPending ? "Saving…" : updatesExisting ? "Verify and update listing" : "Verify and publish"}
        </Button>
        <Button variant="outline" disabled={isPending} onClick={() => setMode("rejecting")}>
          <X aria-hidden="true" />
          Reject
        </Button>
      </div>
      {message && (
        <p role="alert" className="text-sm text-destructive">
          {message}
        </p>
      )}
    </div>
  );
}
