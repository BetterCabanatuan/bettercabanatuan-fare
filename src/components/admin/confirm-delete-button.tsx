"use client";

import { Trash2 } from "lucide-react";
import { useState, useTransition } from "react";

import type { AdminResult } from "@/app/[lang]/admin/data/actions";
import { Button } from "@/components/ui/button";

type ConfirmDeleteButtonProps = {
  label: string;
  /** What gets deleted, shown before the admin confirms. */
  warning: string;
  action: () => Promise<AdminResult>;
};

/** A delete that asks once more in place, since nothing deleted here can be restored. */
export function ConfirmDeleteButton({ label, warning, action }: ConfirmDeleteButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const run = () =>
    startTransition(async () => {
      const result = await action();
      setMessage(result.ok ? null : result.message);
      setConfirming(false);
    });

  return (
    <div className="flex flex-col gap-2">
      {confirming ? (
        <div role="group" aria-label={label} className="flex flex-col gap-2 rounded-lg border border-destructive/40 p-3">
          <p className="text-sm">{warning} This can&apos;t be undone.</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="destructive" disabled={isPending} onClick={run}>
              {isPending ? "Deleting…" : "Delete permanently"}
            </Button>
            <Button variant="ghost" disabled={isPending} onClick={() => setConfirming(false)} autoFocus>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" className="self-start" onClick={() => setConfirming(true)}>
          <Trash2 aria-hidden />
          {label}
        </Button>
      )}
      <p role="status" className="text-sm text-destructive">
        {message}
      </p>
    </div>
  );
}
