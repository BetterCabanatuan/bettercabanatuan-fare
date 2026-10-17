"use client";

import { Plus, Trash2 } from "lucide-react";
import { useId, useRef, useState, useTransition, type FormEvent } from "react";

import { saveTerminals } from "@/app/[lang]/admin/todas/actions";
import { LocationPicker } from "@/components/toda/location-picker";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { LngLat } from "@/lib/geo";
import { MAX_CONNECTED_TERMINALS, type MainTerminal } from "@/lib/toda/terminals";

type Row = { key: number; terminalDescription: string; barangay: string; pin: LngLat | null };

type TodaTerminalsEditorProps = {
  id: string;
  /** Main terminal first, then the connected ones. */
  terminals: MainTerminal[];
  boundary: LngLat[];
};

/** Lets an admin move, add and remove a TODA's terminals, saved all at once. */
export function TodaTerminalsEditor({ id, terminals, boundary }: TodaTerminalsEditorProps) {
  const [rows, setRows] = useState<Row[]>(() =>
    terminals.map(({ terminalDescription, barangay, lat, lng }, key) => ({
      key,
      terminalDescription,
      barangay,
      pin: lat !== null && lng !== null ? [lng, lat] : null,
    })),
  );
  const nextKey = useRef(terminals.length);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const update = (key: number, change: Partial<Row>) =>
    setRows((current) => current.map((row) => (row.key === key ? { ...row, ...change } : row)));

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await saveTerminals(id, formData);
      setMessage(result.ok ? { ok: true, text: "Saved. The directory shows the new positions." } : { ok: false, text: result.message });
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      <ol className="flex flex-col gap-6">
        {rows.map((row, index) => (
          <li key={row.key}>
            <TerminalRow
              row={row}
              title={index === 0 ? "Main terminal" : `Terminal ${index + 1}`}
              boundary={boundary}
              onChange={(change) => update(row.key, change)}
              onRemove={rows.length > 1 ? () => setRows((current) => current.filter((r) => r.key !== row.key)) : undefined}
            />
          </li>
        ))}
      </ol>

      <div className="flex flex-col gap-3 border-t pt-6 sm:flex-row sm:items-center">
        <Button
          type="button"
          variant="outline"
          size="lg"
          disabled={rows.length > MAX_CONNECTED_TERMINALS}
          onClick={() =>
            setRows((current) => [...current, { key: nextKey.current++, terminalDescription: "", barangay: "", pin: null }])
          }
        >
          <Plus aria-hidden="true" />
          Add another terminal
        </Button>
        <Button type="submit" size="lg" disabled={isPending}>
          {isPending ? "Saving…" : "Save positions"}
        </Button>
      </div>
      {message && (
        <p role={message.ok ? "status" : "alert"} className={message.ok ? "text-sm text-primary" : "text-sm text-destructive"}>
          {message.text}
        </p>
      )}
    </form>
  );
}

type TerminalRowProps = {
  row: Row;
  title: string;
  boundary: LngLat[];
  onChange: (change: Partial<Row>) => void;
  onRemove?: () => void;
};

function TerminalRow({ row, title, boundary, onChange, onRemove }: TerminalRowProps) {
  const id = useId();
  return (
    <FieldSet className="rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <FieldLegend className="mb-0">{title}</FieldLegend>
        {onRemove && (
          <Button type="button" variant="ghost" size="sm" onClick={onRemove} aria-label={`Remove ${title.toLowerCase()}`}>
            <Trash2 aria-hidden="true" />
            Remove
          </Button>
        )}
      </div>
      <Field>
        <FieldLabel htmlFor={`${id}-description`}>Where exactly?</FieldLabel>
        <Input
          id={`${id}-description`}
          name="terminalDescription"
          value={row.terminalDescription}
          onChange={(event) => onChange({ terminalDescription: event.target.value })}
          maxLength={200}
          className="h-11"
        />
      </Field>
      <Field>
        <FieldLabel htmlFor={`${id}-barangay`}>Barangay</FieldLabel>
        <Input
          id={`${id}-barangay`}
          name="barangay"
          value={row.barangay}
          onChange={(event) => onChange({ barangay: event.target.value })}
          maxLength={60}
          className="h-11"
        />
      </Field>
      <Field>
        <FieldLabel id={`${id}-pin`}>Position</FieldLabel>
        <div role="group" aria-labelledby={`${id}-pin`}>
          <LocationPicker value={row.pin} onChange={(pin) => onChange({ pin })} boundary={boundary} markerLabel={title} />
        </div>
        <input type="hidden" name="lat" value={row.pin?.[1] ?? ""} />
        <input type="hidden" name="lng" value={row.pin?.[0] ?? ""} />
        <p className="text-sm text-muted-foreground">
          {row.pin ? `Pinned at ${row.pin[1].toFixed(5)}, ${row.pin[0].toFixed(5)}` : "No pin yet"}
        </p>
      </Field>
    </FieldSet>
  );
}
