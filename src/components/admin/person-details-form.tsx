"use client";

import { Pencil } from "lucide-react";
import { useId, useState, useTransition, type FormEvent } from "react";

import type { AdminResult } from "@/app/[lang]/admin/data/actions";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

type PersonDetailsFormProps = {
  name: string | null;
  contact: string | null;
  contactLabel: string;
  action: (details: { name: string; contact: string }) => Promise<AdminResult>;
};

/** Corrects or erases the name and contact on one record, for a correction request. */
export function PersonDetailsForm({ name, contact, contactLabel, action }: PersonDetailsFormProps) {
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const id = useId();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const details = { name: String(formData.get("name") ?? ""), contact: String(formData.get("contact") ?? "") };
    startTransition(async () => {
      const result = await action(details);
      setMessage(result.ok ? null : result.message);
      if (result.ok) setEditing(false);
    });
  }

  if (!editing) {
    return (
      <Button variant="outline" className="self-start" onClick={() => setEditing(true)}>
        <Pencil aria-hidden />
        Correct details
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-lg border p-3">
      <Field>
        <FieldLabel htmlFor={`${id}-name`}>Name</FieldLabel>
        <Input id={`${id}-name`} name="name" defaultValue={name ?? ""} maxLength={80} className="h-11" />
      </Field>
      <Field>
        <FieldLabel htmlFor={`${id}-contact`}>{contactLabel}</FieldLabel>
        <Input id={`${id}-contact`} name="contact" defaultValue={contact ?? ""} maxLength={100} className="h-11" />
        <FieldDescription>Leave a field blank to erase it.</FieldDescription>
      </Field>
      <p role="status" className="text-sm text-destructive">
        {message}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : "Save"}
        </Button>
        <Button type="button" variant="ghost" disabled={isPending} onClick={() => setEditing(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
