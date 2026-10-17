"use client";

import {
  Bug,
  CircleCheck,
  Coins,
  Lightbulb,
  MessageCircle,
  Paperclip,
  Route,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useActionState, useId, useRef, useState, useTransition, type FormEvent } from "react";

import { submitFeedback, type FeedbackState } from "@/app/[lang]/feedback/actions";
import { useDictionary } from "@/components/shared/dictionary-provider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import {
  FEEDBACK_LIMITS,
  FEEDBACK_TOPICS,
  formDataToInput,
  parseFeedback,
  type FeedbackField,
  type FeedbackTopic,
  type FieldErrors,
} from "@/lib/feedback/submission";
import { fill, localizePath } from "@/lib/i18n/locales";

const initialState: FeedbackState = { status: "idle" };

const TOPIC_ICONS = {
  WRONG_FARE: Coins,
  WRONG_ROUTE: Route,
  APP_PROBLEM: Bug,
  SUGGESTION: Lightbulb,
  OTHER: MessageCircle,
} as const satisfies Record<FeedbackTopic, LucideIcon>;

const asTopic = (value: unknown): FeedbackTopic | null => FEEDBACK_TOPICS.find((topic) => topic === value) ?? null;

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
  const [topic, setTopic] = useState<FeedbackTopic | null>(null);
  const [messageLength, setMessageLength] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);
  const topicId = useId();
  const messageId = useId();

  const reported: FieldErrors = clientErrors ?? (state.status === "invalid" ? state.fieldErrors : {});
  const topicError = reported.topic && t.errors[reported.topic];
  const messageError = reported.message && t.errors[reported.message];

  // An error goes away once the rider edits that answer; submitting checks everything again.
  const clearError = (field: FeedbackField) => {
    if (reported[field]) setClientErrors({ ...reported, [field]: undefined });
  };

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
      <div role="status" className="flex flex-col items-start gap-4 p-4 sm:p-6">
        <CircleCheck aria-hidden="true" className="size-10 text-primary" />
        <div className="flex flex-col gap-1">
          {/* Focus moves here so keyboard and screen reader users land on the result. */}
          <h2 ref={(node) => node?.focus()} tabIndex={-1} className="text-xl font-bold outline-none">
            {t.receivedTitle}
          </h2>
          <p className="text-pretty text-muted-foreground">{t.receivedBody}</p>
        </div>
        <p className="flex flex-wrap items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm">
          {t.reference}
          <span className="font-mono text-base font-bold tracking-wider">{state.reference}</span>
        </p>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Button render={<Link href={from ?? localizePath(locale, "/fare")} />} nativeButton={false} size="lg" className="h-11">
            {t.backToMap}
          </Button>
          <Button variant="outline" size="lg" className="h-11" onClick={onSendAnother}>
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
    <form ref={formRef} action={dispatch} onSubmit={handleSubmit} noValidate className="flex flex-col gap-6 p-4 sm:p-6">
      <div aria-live="polite" className="empty:hidden">
        {problem && (
          <Alert variant="destructive">
            <TriangleAlert aria-hidden />
            <AlertTitle>{problem.title}</AlertTitle>
            {problem.body && <AlertDescription>{problem.body}</AlertDescription>}
          </Alert>
        )}
      </div>

      <FieldSet data-invalid={topicError ? true : undefined}>
        <FieldLegend variant="label" className="text-base font-semibold">
          {t.topicLegend}
        </FieldLegend>
        <RadioGroup
          name="topic"
          onValueChange={(value) => {
            setTopic(asTopic(value));
            clearError("topic");
          }}
          aria-invalid={topicError ? true : undefined}
          aria-describedby={topicError ? `${topicId}-error` : undefined}
          className="grid-cols-1 gap-2 sm:grid-cols-2"
        >
          {FEEDBACK_TOPICS.map((option) => {
            const Icon = TOPIC_ICONS[option];
            return (
              <FieldLabel key={option} htmlFor={`${topicId}-${option}`} className="cursor-pointer">
                <Field orientation="horizontal" className="min-h-12 items-center gap-3 !py-2.5">
                  <Icon aria-hidden className="size-5 shrink-0 text-muted-foreground group-has-data-checked/field-label:text-primary" />
                  <FieldTitle className="flex-1 text-base font-normal md:text-sm">{t.topics[option]}</FieldTitle>
                  <RadioGroupItem id={`${topicId}-${option}`} value={option} />
                </Field>
              </FieldLabel>
            );
          })}
        </RadioGroup>
        <FieldError id={`${topicId}-error`}>{topicError}</FieldError>
      </FieldSet>

      <Field data-invalid={messageError ? true : undefined}>
        <FieldLabel htmlFor={messageId} className="text-base font-semibold">
          {t.message}
        </FieldLabel>
        <Textarea
          id={messageId}
          name="message"
          rows={6}
          maxLength={FEEDBACK_LIMITS.maxMessage}
          onChange={(event) => {
            setMessageLength(event.target.value.length);
            clearError("message");
          }}
          aria-invalid={messageError ? true : undefined}
          aria-describedby={`${messageId}-description${messageError ? ` ${messageId}-error` : ""}`}
          className="min-h-36"
        />
        <div className="flex items-start justify-between gap-3">
          <FieldDescription id={`${messageId}-description`}>{topic ? t.messageHints[topic] : t.messageHint}</FieldDescription>
          {/* Hidden from screen readers so it isn't read out on every keystroke; maxLength enforces the cap. */}
          <span aria-hidden className="shrink-0 text-sm text-muted-foreground tabular-nums">
            {fill(t.charCount, { count: messageLength, max: FEEDBACK_LIMITS.maxMessage })}
          </span>
        </div>
        <FieldError id={`${messageId}-error`}>{messageError}</FieldError>
      </Field>

      <input type="hidden" name="locale" value={locale} />
      {from && <input type="hidden" name="pagePath" value={from} />}

      {from && (
        <p className="flex items-start gap-2 rounded-lg bg-muted px-3 py-2.5 text-sm">
          <Paperclip aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          {t.fromPage}
        </p>
      )}

      <div className="flex flex-col gap-3">
        <Button
          type="submit"
          size="lg"
          className="h-12 w-full gap-2 px-6 text-base font-bold sm:w-auto sm:self-start"
          disabled={isPending}
        >
          {isPending && <Spinner aria-hidden role="presentation" />}
          {isPending ? t.sending : t.submit}
        </Button>
        <p className="text-sm text-muted-foreground">
          {t.privacy}{" "}
          <Link href={localizePath(locale, "/privacy")} className="font-semibold text-primary underline-offset-4 hover:underline">
            {dict.legal.howWeHandle}
          </Link>
        </p>
      </div>
    </form>
  );
}
