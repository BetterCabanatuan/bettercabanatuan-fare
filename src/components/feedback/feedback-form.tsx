"use client";

import { CircleCheck } from "lucide-react";
import Link from "next/link";
import { useActionState, useId, useRef, useState, useTransition, type FormEvent } from "react";

import { submitFeedback, type FeedbackState } from "@/app/[lang]/feedback/actions";
import { useDictionary } from "@/components/shared/dictionary-provider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import {
  FEEDBACK_LIMITS,
  FEEDBACK_TOPICS,
  formDataToInput,
  parseFeedback,
  type FieldErrors,
} from "@/lib/feedback/submission";
import { localizePath } from "@/lib/i18n/locales";

const initialState: FeedbackState = { status: "idle" };

/** `from` is the page the rider came from, already checked to be on this site. */
export function FeedbackForm({ from }: { from?: string }) {
  // A new key remounts the form, which clears every field and the action state.
  const [round, setRound] = useState(0);
  return <FeedbackRound key={round} from={from} onSendAnother={() => setRound((r) => r + 1)} />;
}

function FeedbackRound({ from, onSendAnother }: { from?: string; onSendAnother: () => void }) {
  const { locale, dict } = useDictionary();
  const t = dict.feedback;
  const [state, dispatch] = useActionState(submitFeedback, initialState);
  const [isPending, startTransition] = useTransition();
  const [clientErrors, setClientErrors] = useState<FieldErrors | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const topicId = useId();
  const messageId = useId();

  const reported: FieldErrors = clientErrors ?? (state.status === "invalid" ? state.fieldErrors : {});
  const topicError = reported.topic && t.errors[reported.topic];
  const messageError = reported.message && t.errors[reported.message];

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    // Submitting through a transition keeps what the rider typed if the server finds a
    // problem; the form action would clear every field. `action` stays on the form so a
    // submit before hydration is queued as a POST instead of a GET with answers in the URL.
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const check = parseFeedback(formDataToInput(formData));
    if (!check.success) {
      setClientErrors(check.fieldErrors);
      // The radio group itself can't take focus, so a missing topic focuses its first option.
      const selector = check.fieldErrors.topic ? '[role="radio"]' : '[name="message"]';
      formRef.current?.querySelector<HTMLElement>(selector)?.focus();
      return;
    }
    setClientErrors(null);
    startTransition(() => dispatch(formData));
  }

  if (state.status === "received") {
    return (
      <div role="status" className="flex flex-col items-start gap-4 rounded-xl border bg-card p-6">
        <CircleCheck aria-hidden="true" className="size-8 text-primary" />
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold">{t.receivedTitle}</h2>
          <p className="text-muted-foreground">
            {t.receivedBody} {t.reference}{" "}
            <span className="font-mono font-bold text-foreground">{state.reference}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button render={<Link href={from ?? localizePath(locale, "/fare")} />} nativeButton={false} variant="outline" size="lg">
            {t.backToMap}
          </Button>
          <Button variant="ghost" size="lg" onClick={onSendAnother}>
            {t.sendAnother}
          </Button>
        </div>
      </div>
    );
  }

  const problem =
    state.status === "failed"
      ? { title: t.failedTitle, body: t.failedBody }
      : state.status === "tooMany"
        ? { title: t.tooManyTitle, body: t.tooManyBody }
        : state.status === "signedOut"
          ? { title: t.signedOutTitle, body: t.signedOutBody }
          : topicError || messageError
            ? { title: t.checkFields, body: null }
            : null;

  return (
    <form ref={formRef} action={dispatch} onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      <div aria-live="polite">
        {problem && (
          <Alert variant="destructive">
            <AlertTitle>{problem.title}</AlertTitle>
            {problem.body && <AlertDescription>{problem.body}</AlertDescription>}
          </Alert>
        )}
      </div>

      <FieldSet data-invalid={topicError ? true : undefined}>
        <FieldLegend variant="label">{t.topicLegend}</FieldLegend>
        <RadioGroup
          name="topic"
          aria-invalid={topicError ? true : undefined}
          aria-describedby={topicError ? `${topicId}-error` : undefined}
          className="gap-2"
        >
          {FEEDBACK_TOPICS.map((topic) => (
            <FieldLabel key={topic} htmlFor={`${topicId}-${topic}`} className="min-h-11 items-center font-normal">
              <RadioGroupItem id={`${topicId}-${topic}`} value={topic} />
              {t.topics[topic]}
            </FieldLabel>
          ))}
        </RadioGroup>
        <FieldError id={`${topicId}-error`}>{topicError}</FieldError>
      </FieldSet>

      <Field data-invalid={messageError ? true : undefined}>
        <FieldLabel htmlFor={messageId}>{t.message}</FieldLabel>
        <Textarea
          id={messageId}
          name="message"
          rows={6}
          maxLength={FEEDBACK_LIMITS.maxMessage}
          aria-invalid={messageError ? true : undefined}
          aria-describedby={`${messageId}-description${messageError ? ` ${messageId}-error` : ""}`}
        />
        <FieldDescription id={`${messageId}-description`}>{t.messageHint}</FieldDescription>
        <FieldError id={`${messageId}-error`}>{messageError}</FieldError>
      </Field>

      <input type="hidden" name="locale" value={locale} />
      {from && <input type="hidden" name="pagePath" value={from} />}

      <div className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">
          {from && `${t.fromPage} `}
          {t.privacy}{" "}
          <Link href={localizePath(locale, "/privacy")} className="font-semibold text-primary underline-offset-4 hover:underline">
            {dict.legal.howWeHandle}
          </Link>
        </p>
        <Button type="submit" size="lg" className="h-11 self-start px-5 text-base font-bold" disabled={isPending}>
          {isPending ? t.sending : t.submit}
        </Button>
      </div>
    </form>
  );
}
