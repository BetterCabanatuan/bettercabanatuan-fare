"use client";

import { Check } from "lucide-react";
import { useState, useTransition } from "react";

import { resolveFeedback } from "@/app/[lang]/admin/feedback/actions";
import { Button } from "@/components/ui/button";

export function ResolveFeedbackButton({ id }: { id: string }) {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-2">
      <Button
        className="self-start"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            const result = await resolveFeedback(id);
            setMessage(result.ok ? null : result.message);
          })
        }
      >
        <Check aria-hidden />
        {isPending ? "Resolving…" : "Mark resolved"}
      </Button>
      <p role="status" className="text-sm text-destructive">
        {message}
      </p>
    </div>
  );
}
