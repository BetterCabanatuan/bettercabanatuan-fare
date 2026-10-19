"use client";

import { MessageSquareWarning } from "lucide-react";
import Link from "next/link";

import { useDictionary } from "@/components/shared/dictionary-provider";
import { Button } from "@/components/ui/button";

/**
 * Sits right under the fare result: that is when a rider compares our number with what
 * they paid, so it is the moment they are most likely to report a wrong fare.
 */
export function FareFeedbackPrompt({ href }: { href: string }) {
  const { dict } = useDictionary();
  const t = dict.feedback.prompt;

  return (
    <aside aria-label={t.heading} className="flex gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-4">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <MessageSquareWarning aria-hidden className="size-5" />
      </span>
      <div className="flex min-w-0 flex-col items-start gap-1">
        <p className="font-bold tracking-tight">{t.heading}</p>
        <p className="text-sm text-pretty text-muted-foreground">{t.body}</p>
        <Button render={<Link href={href} />} nativeButton={false} variant="outline" className="mt-2 h-11 bg-background">
          {t.action}
        </Button>
      </div>
    </aside>
  );
}
