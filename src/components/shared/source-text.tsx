import { Fragment } from "react";

import { sourceParts } from "@/lib/source-text";

/**
 * A data source note with its URLs and OpenStreetMap ids as links. They open in a new tab
 * so a rider checking a source from the map keeps their trip.
 */
export function SourceText({ source }: { source: string }) {
  return sourceParts(source).map((part) =>
    part.href ? (
      <a
        key={part.at}
        href={part.href}
        target="_blank"
        rel="noopener noreferrer"
        className="wrap-anywhere underline underline-offset-2 hover:text-foreground"
      >
        {part.text}
      </a>
    ) : (
      <Fragment key={part.at}>{part.text}</Fragment>
    ),
  );
}
