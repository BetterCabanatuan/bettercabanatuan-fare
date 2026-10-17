import { ArrowRight, MessageSquareWarning, Route, Users } from "lucide-react";
import Link from "next/link";

import { getDictionary } from "@/lib/i18n/get-dictionary";
import { localizePath } from "@/lib/i18n/locales";

export async function Community() {
  const { locale, dict } = await getDictionary();
  const t = dict.home;
  const ways = [
    { href: localizePath(locale, "/fare/suggest"), Icon: Route, ...t.community.route },
    { href: localizePath(locale, "/toda/submit"), Icon: Users, ...t.community.toda },
    { href: localizePath(locale, "/feedback"), Icon: MessageSquareWarning, ...t.community.fare },
  ];

  return (
    <section aria-labelledby="community-heading" className="border-t bg-muted">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
        <div className="mb-6 flex max-w-2xl flex-col gap-3">
          <h2 id="community-heading" className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            {t.communityHeading}
          </h2>
          <p className="text-pretty text-muted-foreground">{t.communityIntro}</p>
        </div>
        <ul className="grid gap-4 md:grid-cols-3">
          {ways.map(({ href, Icon, title, body }) => (
            <li key={href}>
              <Link
                href={href}
                className="group flex h-full flex-col gap-3 rounded-2xl border bg-card p-5 text-card-foreground transition-[border-color,transform] duration-150 ease-out hover:border-primary active:scale-[0.98] motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:p-6"
              >
                <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon aria-hidden="true" className="size-5" />
                </span>
                <span className="flex items-center gap-2 text-lg font-extrabold tracking-tight">
                  {title}
                  <ArrowRight
                    aria-hidden="true"
                    className="size-4 shrink-0 text-primary transition-transform group-hover:translate-x-0.5"
                  />
                </span>
                <span className="text-sm text-pretty text-muted-foreground">{body}</span>
              </Link>
            </li>
          ))}
        </ul>
        <Link
          href={localizePath(locale, "/contributors")}
          className="mt-6 inline-flex min-h-11 items-center gap-1.5 font-bold text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {t.contributorsLink}
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </div>
    </section>
  );
}
