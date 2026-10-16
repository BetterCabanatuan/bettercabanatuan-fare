import { CircleAlert, FileCheck, MessageSquareText } from "lucide-react";

import { getDictionary } from "@/lib/i18n/get-dictionary";

export async function TrustPoints() {
  const { dict } = await getDictionary();
  const t = dict.home;
  const points = [
    { key: "source", Icon: FileCheck, ...t.trust.source },
    { key: "unconfirmed", Icon: CircleAlert, ...t.trust.unconfirmed },
    { key: "open", Icon: MessageSquareText, ...t.trust.open },
  ];

  return (
    <section aria-labelledby="trust-heading" className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
      <h2 id="trust-heading" className="mb-6 text-2xl font-extrabold tracking-tight sm:text-3xl">
        {t.trustHeading}
      </h2>
      <ul className="grid gap-x-8 gap-y-6 md:grid-cols-3">
        {points.map(({ key, Icon, title, body }) => (
          <li key={key} className="flex gap-4">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Icon aria-hidden="true" className="size-5" />
            </span>
            <div className="flex min-w-0 flex-col gap-1">
              <h3 className="font-extrabold tracking-tight">{title}</h3>
              <p className="text-sm text-pretty text-muted-foreground">{body}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
