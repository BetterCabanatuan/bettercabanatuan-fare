import { CircleAlert } from "lucide-react";

export function UnconfirmedBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex w-fit items-center gap-1 rounded-full border border-warning-border bg-warning px-2 py-0.5 text-xs font-bold whitespace-nowrap text-warning-foreground">
      <CircleAlert aria-hidden="true" className="size-3.5" />
      {label}
    </span>
  );
}
