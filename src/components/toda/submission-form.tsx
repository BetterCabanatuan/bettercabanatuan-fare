"use client";

import { CircleCheck, MapPin, Plus, X } from "lucide-react";
import Link from "next/link";
import { useActionState, useId, useRef, useState, useTransition, type FormEvent } from "react";

import { submitToda, type SubmitState } from "@/app/toda/submit/actions";
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
import { Textarea } from "@/components/ui/textarea";
import type { LngLat } from "@/lib/geo";
import {
  SUBMISSION_LIMITS,
  formDataToInput,
  parseSubmission,
  type FieldErrors,
  type SubmissionField,
} from "@/lib/toda/submission";

type BarangayRow = { key: number; value: string };

const initialState: SubmitState = { status: "idle" };

export function SubmissionForm({ boundary }: { boundary: LngLat[] }) {
  const [state, dispatch] = useActionState(submitToda, initialState);
  const [isPending, startTransition] = useTransition();
  const [clientErrors, setClientErrors] = useState<FieldErrors | null>(null);
  // Fields edited since the last submit; their old errors no longer apply.
  const [edited, setEdited] = useState<ReadonlySet<string>>(new Set());
  const [pin, setPinState] = useState<LngLat | null>(null);
  const [rows, setRows] = useState<BarangayRow[]>([{ key: 0, value: "" }]);
  const nextKey = useRef(1);
  const formRef = useRef<HTMLFormElement>(null);

  const reported: FieldErrors = clientErrors ?? (state.status === "invalid" ? state.fieldErrors : {});
  const errors = Object.fromEntries(
    Object.entries(reported).filter(([field]) => !edited.has(field)),
  ) as FieldErrors;

  const markEdited = (field: string) => {
    if (field in reported && !edited.has(field)) setEdited(new Set(edited).add(field));
  };
  const setPin = (position: LngLat | null) => {
    setPinState(position);
    markEdited("lat");
  };

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    // Submitting through a transition keeps what the resident typed if the server finds a
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
    return <Received reference={state.reference} />;
  }

  const addRow = () => {
    setRows((current) => [...current, { key: nextKey.current++, value: "" }]);
  };
  const removeRow = (key: number) => {
    setRows((current) => (current.length === 1 ? [{ key: current[0].key, value: "" }] : current.filter((row) => row.key !== key)));
  };

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
          <AlertTitle>Not sent</AlertTitle>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}
      {Object.keys(errors).length > 0 && (
        <Alert variant="destructive" aria-live="polite">
          <AlertTitle>Check the highlighted fields</AlertTitle>
          <AlertDescription>Some answers need fixing before we can send this.</AlertDescription>
        </Alert>
      )}

      <FieldSet>
        <FieldLegend>The TODA</FieldLegend>
        <FieldGroup>
          <TextField
            name="name"
            label="TODA name"
            description="As written on the tricycles or terminal sign, e.g. Sumacab Este TODA."
            required
            autoComplete="off"
            error={errors.name}
          />
          <TextField
            name="units"
            label="Number of tricycles (optional)"
            description="Your best estimate is fine."
            inputMode="numeric"
            type="number"
            min={1}
            step={1}
            error={errors.units}
          />
          <TextField
            name="officialContact"
            label="Official contact number (optional)"
            description="Only the association's office or hotline. Don't enter a driver's or officer's personal number unless they agreed to have it published."
            type="tel"
            autoComplete="off"
            error={errors.officialContact}
          />
        </FieldGroup>
      </FieldSet>

      <FieldSet>
        <FieldLegend>Where the terminal is</FieldLegend>
        <FieldGroup>
          <TextField
            name="barangay"
            label="Barangay of the terminal"
            required
            autoComplete="off"
            error={errors.barangay}
          />
          <TextAreaField
            name="terminalDescription"
            label="Where exactly?"
            description="A landmark people know, e.g. in front of the public market, beside the chapel."
            required
            maxLength={200}
            error={errors.terminalDescription}
          />
          <Field data-invalid={errors.lat ? true : undefined}>
            <FieldLabel id="pin-label">
              <MapPin aria-hidden="true" className="size-4" />
              Pin the terminal on the map (optional)
            </FieldLabel>
            <FieldDescription>
              Tap the map where the tricycles wait. Drag the pin to adjust it.
            </FieldDescription>
            <div aria-labelledby="pin-label" role="group">
              <LocationPicker value={pin} onChange={setPin} boundary={boundary} />
            </div>
            <input type="hidden" name="lat" value={pin?.[1] ?? ""} />
            <input type="hidden" name="lng" value={pin?.[0] ?? ""} />
            <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
              <span aria-live="polite">
                {pin ? `Pinned at ${pin[1].toFixed(5)}, ${pin[0].toFixed(5)}` : "No pin yet"}
              </span>
              {pin && (
                <Button type="button" variant="ghost" size="sm" onClick={() => setPin(null)}>
                  Remove pin
                </Button>
              )}
            </div>
            <FieldError>{errors.lat}</FieldError>
          </Field>
        </FieldGroup>
      </FieldSet>

      <FieldSet>
        <FieldLegend>Barangays served (optional)</FieldLegend>
        <FieldDescription>
          Where these tricycles usually take passengers. Add one barangay per line.
        </FieldDescription>
        <ul className="flex flex-col gap-2">
          {rows.map((row, index) => (
            <li key={row.key} className="flex items-center gap-2">
              <Input
                name="barangaysServed"
                aria-label={`Barangay served ${index + 1}`}
                value={row.value}
                onChange={(event) =>
                  setRows((current) =>
                    current.map((item) => (item.key === row.key ? { ...item, value: event.target.value } : item)),
                  )
                }
                autoComplete="off"
                className="h-11"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-lg"
                aria-label={`Remove barangay ${index + 1}`}
                onClick={() => removeRow(row.key)}
                disabled={rows.length === 1 && row.value === ""}
              >
                <X aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>
        <div>
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={addRow}
            disabled={rows.length >= SUBMISSION_LIMITS.barangaysServed}
          >
            <Plus aria-hidden="true" />
            Add another barangay
          </Button>
        </div>
        <FieldError>{errors.barangaysServed}</FieldError>
      </FieldSet>

      <FieldSet>
        <FieldLegend>About you (optional)</FieldLegend>
        <FieldDescription>
          Only our admins see this, in case they need to ask you about the TODA. It is never published.
        </FieldDescription>
        <FieldGroup>
          <TextField name="submitterName" label="Your name" autoComplete="name" error={errors.submitterName} />
          <TextField
            name="submitterContact"
            label="Mobile number or email"
            autoComplete="email"
            error={errors.submitterContact}
          />
          <TextAreaField
            name="notes"
            label="Anything else?"
            description="E.g. you are a TODA officer, or this replaces an older entry."
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
          {isPending ? "Sending…" : "Send for review"}
        </Button>
        <p className="text-sm text-muted-foreground">
          An admin checks every submission before it appears in the TODA list.
        </p>
      </div>
    </form>
  );
}

function Received({ reference }: { reference: string }) {
  return (
    <div role="status" className="flex flex-col items-start gap-4 rounded-xl border bg-card p-6">
      <CircleCheck aria-hidden="true" className="size-8 text-primary" />
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-bold">Salamat! We got your submission.</h2>
        <p className="text-muted-foreground">
          An admin will check it before it appears in the TODA list. Your reference is{" "}
          <span className="font-mono font-bold text-foreground">{reference}</span>.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button render={<Link href="/toda" />} nativeButton={false} variant="outline" size="lg">
          See the TODA list
        </Button>
        <Button render={<a href="/toda/submit" />} nativeButton={false} variant="ghost" size="lg">
          Add another TODA
        </Button>
      </div>
    </div>
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
        aria-describedby={description ? `${id}-description` : undefined}
        className="h-11"
        {...props}
      />
      {description && <FieldDescription id={`${id}-description`}>{description}</FieldDescription>}
      <FieldError>{error}</FieldError>
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
        aria-describedby={description ? `${id}-description` : undefined}
        {...props}
      />
      {description && <FieldDescription id={`${id}-description`}>{description}</FieldDescription>}
      <FieldError>{error}</FieldError>
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

function focusFirstError(form: HTMLFormElement | null, fieldErrors: FieldErrors) {
  const first = Object.keys(fieldErrors)[0];
  if (!form || !first) return;
  const element = form.querySelector<HTMLElement>(`[name="${first}"]:not([type=hidden])`);
  (element ?? form.querySelector<HTMLElement>("[aria-invalid=true]"))?.focus();
}
