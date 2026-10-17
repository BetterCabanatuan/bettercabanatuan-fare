"use client";

import { useActionState, useId, useState } from "react";

import { setPublicName, type PublicNameState } from "@/app/[lang]/contributors/actions";
import { useDictionary } from "@/components/shared/dictionary-provider";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { fill } from "@/lib/i18n/locales";
import { PUBLIC_NAME_LIMITS } from "@/lib/routes/contributors";

const initialState: PublicNameState = { status: "idle" };

/** `current` is the saved name, read on the server; null means "Anonymous rider". */
export function PublicNameForm({ current }: { current: string | null }) {
  const { dict } = useDictionary();
  const t = dict.contributors;
  const id = useId();
  const [state, dispatch, isPending] = useActionState(setPublicName, initialState);
  const [name, setName] = useState(current ?? "");
  const error = state.status === "invalid" ? t.nameErrors[state.error] : undefined;

  return (
    <form action={dispatch} className="flex flex-col gap-3">
      <Field data-invalid={error ? true : undefined}>
        <FieldLabel htmlFor={id}>{t.nameLabel}</FieldLabel>
        <div className="flex gap-2">
          <Input
            id={id}
            name="publicName"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={PUBLIC_NAME_LIMITS.max}
            autoComplete="nickname"
            aria-invalid={error ? true : undefined}
            aria-describedby={`${id}-description${error ? ` ${id}-error` : ""}`}
            className="h-11"
          />
          <Button type="submit" className="h-11 px-5" disabled={isPending}>
            {isPending ? t.saving : t.save}
          </Button>
        </div>
        <FieldDescription id={`${id}-description`}>{t.nameHint}</FieldDescription>
        <FieldError id={`${id}-error`}>{error}</FieldError>
      </Field>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <p aria-live="polite" className="text-muted-foreground">
          {state.status === "failed" && <span className="text-destructive">{t.failed}</span>}
          {state.status === "signedOut" && <span className="text-destructive">{t.signedOut}</span>}
          {(state.status === "idle" || state.status === "saved" || state.status === "invalid") && (
            <>
              {state.status === "saved" && `${t.saved} `}
              {fill(t.shownAs, { name: current ?? t.anonymous })}
            </>
          )}
        </p>
        {current && (
          <Button
            type="submit"
            name="intent"
            value="clear"
            variant="ghost"
            className="h-11"
            disabled={isPending}
            onClick={() => setName("")}
          >
            {t.useAnonymous}
          </Button>
        )}
      </div>
    </form>
  );
}
