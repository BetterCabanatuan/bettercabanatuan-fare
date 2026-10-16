"use client";

import { ChevronDownIcon } from "lucide-react";

import { useDictionary } from "@/components/shared/dictionary-provider";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

type Stage = "past" | "current" | "draft";

const stageStyles: Record<Stage, string> = {
  past: "border-border",
  current: "rounded-r-lg border-highlight bg-highlight/20",
  draft: "border-dashed border-warning-border",
};

export function TricycleFareHistory() {
  const { dict } = useDictionary();
  const h = dict.tricycle.history;

  const entries = [
    { key: "ordinance2007", stage: "past", ...h.ordinance2007 },
    { key: "early2018", stage: "past", ...h.early2018 },
    { key: "november2018", stage: "current", ...h.november2018 },
    { key: "draft2026", stage: "draft", ...h.draft2026 },
  ] as const;

  return (
    <Collapsible className="rounded-2xl border bg-card text-card-foreground">
      <h3>
        <CollapsibleTrigger className="group flex min-h-11 w-full items-center justify-between gap-2 rounded-2xl px-4 py-3 text-left text-base font-bold tracking-tight outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50">
          {h.title}
          <ChevronDownIcon
            aria-hidden
            className="size-4 shrink-0 transition-transform group-data-panel-open:rotate-180"
          />
        </CollapsibleTrigger>
      </h3>
      <CollapsibleContent>
        <div className="flex flex-col gap-3 border-t px-4 pt-3 pb-4">
          <ol className="flex flex-col gap-2">
            {entries.map(({ key, stage, when, what }) => (
              <li key={key} className={`flex flex-col gap-1 border-l-2 py-2 pr-2 pl-3 ${stageStyles[stage]}`}>
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold tabular-nums">{when}</span>
                  {stage === "current" && (
                    <Badge className="bg-highlight text-highlight-foreground">{h.current}</Badge>
                  )}
                  {stage === "draft" && (
                    <Badge variant="outline" className="border-warning-border bg-warning text-warning-foreground">
                      {h.draft}
                    </Badge>
                  )}
                </span>
                <span className="text-sm">{what}</span>
              </li>
            ))}
          </ol>
          <p className="text-xs text-muted-foreground">{h.note}</p>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
