import { getDictionary } from "@/lib/i18n/get-dictionary";

/** Site-wide notice while fares and routes are still being checked against official sources. */
export async function AlphaBanner() {
  const { dict } = await getDictionary();

  return (
    <div role="note" aria-label={dict.banner.label} className="border-b border-warning-border bg-warning text-warning-foreground">
      <p className="mx-auto max-w-5xl px-4 py-2 text-sm">
        <span className="mr-1.5 rounded bg-warning-foreground px-1.5 py-0.5 text-xs font-bold uppercase tracking-wider text-warning">
          {dict.banner.tag}
        </span>
        {dict.banner.text}
      </p>
    </div>
  );
}
