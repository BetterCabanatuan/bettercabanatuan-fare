"use client";

import { CircleCheck, MapPin } from "lucide-react";
import Link from "next/link";
import { useActionState, useId, useRef, useState, useTransition, type FormEvent } from "react";

import { submitRoute, type SubmitState } from "@/app/[lang]/fare/suggest/actions";
import { useDictionary } from "@/components/shared/dictionary-provider";
import { LocationPicker } from "@/components/toda/location-picker";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { fill, localizePath, type Locale } from "@/lib/i18n/locales";
import type { LngLat } from "@/lib/geo";
import {
  JEEP_TYPES,
  SUBMISSION_LIMITS,
  formDataToInput,
  parseSubmission,
  type FieldErrors,
  type JeepTypeInput,
  type SubmissionField,
} from "@/lib/routes/submission";

type SuggestDictionary = Dictionary["suggest"];
/** Field errors already turned into sentences in the reader's language. */
type FieldMessages = Partial<Record<SubmissionField, string>>;

const JEEP_TYPE_LABELS: Record<JeepTypeInput, "traditional" | "modern" | "notSure"> = {
  TRADITIONAL: "traditional",
  MODERN: "modern",
  UNKNOWN: "notSure",
};

const initialState: SubmitState = { status: "idle" };

export function RouteSubmissionForm({ boundary }: { boundary: LngLat[] }) {
  // A new key remounts the form, which clears every field and the action state.
  const [round, setRound] = useState(0);
  return <SubmissionRound key={round} boundary={boundary} onSuggestAnother={() => setRound((r) => r + 1)} />;
}

function SubmissionRound({ boundary, onSuggestAnother }: { boundary: LngLat[]; onSuggestAnother: () => void }) {
  const { locale, dict } = useDictionary();
  const t = dict.suggest;
  const [state, dispatch] = useActionState(submitRoute, initialState);
  const [isPending, startTransition] = useTransition();
  const [clientErrors, setClientErrors] = useState<FieldErrors | null>(null);
  // Fields edited since the last submit; their old errors no longer apply.
  const [edited, setEdited] = useState<ReadonlySet<string>>(new Set());
  const [fromPin, setFromPinState] = useState<LngLat | null>(null);
  const [toPin, setToPinState] = useState<LngLat | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const reported: FieldErrors = clientErrors ?? (state.status === "invalid" ? state.fieldErrors : {});
  const errors: FieldMessages = Object.fromEntries(
    Object.entries(reported)
      .filter(([field]) => !edited.has(field))
      .map(([field, key]) => [field, t.errors[key]]),
  );

  const markEdited = (field: string) => {
    if (field in reported && !edited.has(field)) setEdited(new Set(edited).add(field));
  };
  const setFromPin = (position: LngLat | null) => {
    setFromPinState(position);
    markEdited("fromLat");
  };
  const setToPin = (position: LngLat | null) => {
    setToPinState(position);
    markEdited("toLat");
  };

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    // Submitting through a transition keeps what the rider typed if the server finds a
    // problem; the form action would clear every field. `action` stays on the form so a
    // submit before hydration is queued as a POST instead of a GET with answers in the URL.
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const check = parseSubmission(formDataToInput(formData), boundary);
    setEdited(new Set());
    if (!check.success) {
      setClientErrors(check.fieldErrors);
      focusFirstError(formRef.current, check.fieldErrors);
      return;
    }
    setClientErrors(null);
    startTransition(() => dispatch(formData));
  }

  if (state.status === "received") {
    return (
      <Received reference={state.reference} onSuggestAnother={onSuggestAnother} locale={locale} dictionary={t} />
    );
  }

  return (
    <form
      ref={formRef}
      action={dispatch}
      onSubmit={handleSubmit}
      onChange={(event) => {
        const target = event.target as EventTarget;
        if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) markEdited(target.name);
      }}
      noValidate
      className="flex flex-col gap-8"
    >
      {state.status === "failed" && (
        <Alert variant="destructive">
          <AlertTitle>{t.failedTitle}</AlertTitle>
          <AlertDescription>{t.failedBody}</AlertDescription>
        </Alert>
      )}
      {Object.keys(errors).length > 0 && (
        <Alert variant="destructive" aria-live="polite">
          <AlertTitle>{t.checkFields}</AlertTitle>
          <AlertDescription>{t.checkFieldsBody}</AlertDescription>
        </Alert>
      )}

      <FieldSet>
        <FieldLegend>{t.fromLegend}</FieldLegend>
        <FieldGroup>
          <TextField
            name="fromName"
            label={t.fromName}
            description={t.fromNameHint}
            required
            autoComplete="off"
            maxLength={SUBMISSION_LIMITS.name}
            error={errors.fromName}
          />
          <PinField
            latName="fromLat"
            lngName="fromLng"
            label={t.fromPin}
            pin={fromPin}
            onChange={setFromPin}
            boundary={boundary}
            error={errors.fromLat ?? errors.fromLng}
            dictionary={t}
          />
        </FieldGroup>
      </FieldSet>

      <FieldSet>
        <FieldLegend>{t.toLegend}</FieldLegend>
        <FieldGroup>
          <TextField
            name="toName"
            label={t.toName}
            description={t.toNameHint}
            required
            autoComplete="off"
            maxLength={SUBMISSION_LIMITS.name}
            error={errors.toName}
          />
          <PinField
            latName="toLat"
            lngName="toLng"
            label={t.toPin}
            pin={toPin}
            onChange={setToPin}
            boundary={boundary}
            error={errors.toLat ?? errors.toLng}
            dictionary={t}
          />
        </FieldGroup>
      </FieldSet>

      <FieldSet>
        <FieldLegend>{t.tripLegend}</FieldLegend>
        <FieldGroup>
          <TextField
            name="via"
            label={t.via}
            description={t.viaHint}
            autoComplete="off"
            maxLength={SUBMISSION_LIMITS.via}
            error={errors.via}
          />
          <JeepTypeField error={errors.jeepType} dictionary={t} />
          <TextField
            name="farePaid"
            label={t.farePaid}
            description={t.farePaidHint}
            type="number"
            inputMode="decimal"
            min={1}
            max={SUBMISSION_LIMITS.farePesos}
            step={0.25}
            error={errors.farePaid}
          />
        </FieldGroup>
      </FieldSet>

      <FieldSet>
        <FieldLegend>{t.aboutYou}</FieldLegend>
        <FieldDescription>{t.aboutYouHint}</FieldDescription>
        <FieldGroup>
          <TextField name="submitterName" label={t.submitterName} autoComplete="name" error={errors.submitterName} />
          <TextField
            name="submitterContact"
            label={t.submitterContact}
            autoComplete="email"
            error={errors.submitterContact}
          />
          <TextAreaField
            name="notes"
            label={t.notes}
            description={t.notesHint}
            maxLength={SUBMISSION_LIMITS.notes}
            error={errors.notes}
          />
        </FieldGroup>
      </FieldSet>

      {/* Honeypot for bots; hidden from people and assistive tech. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 overflow-hidden">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>

      <div className="flex flex-col gap-3 border-t pt-6 sm:flex-row sm:items-center">
        <Button type="submit" size="lg" className="h-11 px-5 text-base font-bold" disabled={isPending}>
          {isPending ? t.sending : t.submit}
        </Button>
        <p className="text-sm text-muted-foreground">{t.privacy}</p>
      </div>
    </form>
  );
}

type ReceivedProps = {
  reference: string;
  onSuggestAnother: () => void;
  locale: Locale;
  dictionary: SuggestDictionary;
};

function Received({ reference, onSuggestAnother, locale, dictionary: t }: ReceivedProps) {
  return (
    <div role="status" className="flex flex-col items-start gap-4 rounded-xl border bg-card p-6">
      <CircleCheck aria-hidden="true" className="size-8 text-primary" />
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-bold">{t.receivedTitle}</h2>
        <p className="text-muted-foreground">
          {t.receivedBody} {t.reference}{" "}
          <span className="font-mono font-bold text-foreground">{reference}</span>
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button
          render={<Link href={`${localizePath(locale, "/fare")}?mode=jeep`} />}
          nativeButton={false}
          variant="outline"
          size="lg"
        >
          {t.backToMap}
        </Button>
        <Button variant="ghost" size="lg" onClick={onSuggestAnother}>
          {t.suggestAnother}
        </Button>
      </div>
    </div>
  );
}

type PinFieldProps = {
  latName: "fromLat" | "toLat";
  lngName: "fromLng" | "toLng";
  label: string;
  pin: LngLat | null;
  onChange: (position: LngLat | null) => void;
  boundary: LngLat[];
  error?: string;
  dictionary: SuggestDictionary;
};

function PinField({ latName, lngName, label, pin, onChange, boundary, error, dictionary: t }: PinFieldProps) {
  const id = useId();
  return (
    <Field data-invalid={error ? true : undefined}>
      <FieldLabel id={`${id}-label`}>
        <MapPin aria-hidden="true" className="size-4" />
        {label}
        <RequiredMark />
      </FieldLabel>
      <FieldDescription id={`${id}-description`}>{t.pinHint}</FieldDescription>
      <div
        role="group"
        aria-labelledby={`${id}-label`}
        aria-describedby={describedBy(id, true, error)}
        data-field={latName}
        tabIndex={-1}
      >
        <LocationPicker value={pin} onChange={onChange} boundary={boundary} markerLabel={label} />
      </div>
      <input type="hidden" name={latName} value={pin?.[1] ?? ""} />
      <input type="hidden" name={lngName} value={pin?.[0] ?? ""} />
      <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
        <span aria-live="polite">
          {pin ? fill(t.pinnedAt, { lat: pin[1].toFixed(5), lng: pin[0].toFixed(5) }) : t.noPin}
        </span>
        {pin && (
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange(null)}>
            {t.removePin}
          </Button>
        )}
      </div>
      <FieldError id={`${id}-error`}>{error}</FieldError>
    </Field>
  );
}

function JeepTypeField({ error, dictionary: t }: { error?: string; dictionary: SuggestDictionary }) {
  const id = useId();
  return (
    <FieldSet data-invalid={error ? true : undefined}>
      <FieldLegend variant="label">{t.jeepType}</FieldLegend>
      <RadioGroup
        name="jeepType"
        defaultValue="UNKNOWN"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className="gap-2"
      >
        {JEEP_TYPES.map((type) => (
          <FieldLabel key={type} htmlFor={`${id}-${type}`} className="min-h-11 items-center font-normal">
            <RadioGroupItem id={`${id}-${type}`} value={type} />
            {t[JEEP_TYPE_LABELS[type]]}
          </FieldLabel>
        ))}
      </RadioGroup>
      <FieldError id={`${id}-error`}>{error}</FieldError>
    </FieldSet>
  );
}

type TextFieldProps = React.ComponentProps<"input"> & {
  name: SubmissionField;
  label: string;
  description?: string;
  error?: string;
};

function TextField({ name, label, description, error, required, ...props }: TextFieldProps) {
  const id = useId();
  return (
    <Field data-invalid={error ? true : undefined}>
      <FieldLabel htmlFor={id}>
        {label}
        {required && <RequiredMark />}
      </FieldLabel>
      <Input
        id={id}
        name={name}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, Boolean(description), error)}
        className="h-11"
        {...props}
      />
      {description && <FieldDescription id={`${id}-description`}>{description}</FieldDescription>}
      <FieldError id={`${id}-error`}>{error}</FieldError>
    </Field>
  );
}

type TextAreaFieldProps = React.ComponentProps<"textarea"> & {
  name: SubmissionField;
  label: string;
  description?: string;
  error?: string;
};

function TextAreaField({ name, label, description, error, required, ...props }: TextAreaFieldProps) {
  const id = useId();
  return (
    <Field data-invalid={error ? true : undefined}>
      <FieldLabel htmlFor={id}>
        {label}
        {required && <RequiredMark />}
      </FieldLabel>
      <Textarea
        id={id}
        name={name}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, Boolean(description), error)}
        {...props}
      />
      {description && <FieldDescription id={`${id}-description`}>{description}</FieldDescription>}
      <FieldError id={`${id}-error`}>{error}</FieldError>
    </Field>
  );
}

function RequiredMark() {
  return (
    <span className="text-destructive" aria-hidden="true">
      *
    </span>
  );
}

/** The description and, while one is shown, the error, so readers hear both on focus. */
function describedBy(id: string, hasDescription: boolean, error?: string): string | undefined {
  const ids = [hasDescription && `${id}-description`, error && `${id}-error`].filter(Boolean);
  return ids.length > 0 ? ids.join(" ") : undefined;
}

function focusFirstError(form: HTMLFormElement | null, fieldErrors: FieldErrors) {
  const first = Object.keys(fieldErrors)[0];
  if (!form || !first) return;
  // Pins post through hidden inputs, so a pin error focuses its map group instead.
  const element = form.querySelector<HTMLElement>(`[name="${first}"]:not([type=hidden]), [data-field="${first}"]`);
  (element ?? form.querySelector<HTMLElement>("[aria-invalid=true]"))?.focus();
}
