/** Site-wide notice while fares and routes are still being checked against official sources. */
export function AlphaBanner() {
  return (
    <div role="note" aria-label="Alpha notice" className="border-b border-warning-border bg-warning text-warning-foreground">
      <p className="mx-auto max-w-5xl px-4 py-2 text-sm">
        <span className="mr-1.5 rounded bg-warning-foreground px-1.5 py-0.5 text-xs font-bold uppercase tracking-wider text-warning">
          Alpha
        </span>
        Fares and routes here are estimates and may differ from the actual fare. Check the official fare
        matrix when in doubt.
      </p>
    </div>
  );
}
