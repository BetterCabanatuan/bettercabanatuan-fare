import { Clock, House, Phone } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import { FareBoard } from "@/components/home/fare-board";
import { LanguageToggle } from "@/components/shared/language-toggle";
import { LogoMark } from "@/components/shared/logo-mark";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { fill } from "@/lib/i18n/locales";
import { formatMaintenanceUntil, isMaintenanceOn, parseMaintenanceUntil } from "@/lib/maintenance";
import { betterCabanatuanUrl } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getDictionary();
  return {
    title: dict.maintenance.heading,
    description: dict.maintenance.description,
    robots: { index: false, follow: false },
  };
}

/**
 * Served by src/proxy.ts with a 503 in place of every public page while MAINTENANCE_MODE
 * is on. Visiting /maintenance while it is off gives a 404, so the page can't tell riders
 * the site is down when it isn't.
 */
export default async function MaintenancePage() {
  // Rendered per request, because the flags are Worker variables that change without a build.
  await connection();
  if (!isMaintenanceOn(process.env.MAINTENANCE_MODE)) notFound();

  const { locale, dict } = await getDictionary();
  const t = dict.maintenance;
  const until = parseMaintenanceUntil(process.env.MAINTENANCE_UNTIL, new Date());
  const helpLinks = [
    { path: "/hotlines", label: dict.footer.portalHotlines, Icon: Phone },
    { path: "/", label: dict.footer.portalHome, Icon: House },
  ];

  return (
    <>
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-2">
          <div className="mr-auto flex min-h-11 items-center gap-2.5">
            {/* The peso in the mark is black, so dark mode sets the mark on a light tile. */}
            <LogoMark className="h-[38px] w-auto shrink-0 dark:box-content dark:rounded-md dark:bg-white dark:p-1" />
            <span className="flex flex-col uppercase leading-none">
              <span className="text-base font-extrabold tracking-tight">Pamasahe</span>
              <span className="mt-1 text-[10px] font-semibold tracking-[0.18em] text-muted-foreground">
                {dict.nav.city}
              </span>
            </span>
          </div>
          <LanguageToggle locale={locale} label={dict.nav.language} switchTo={dict.nav.switchTo} />
        </div>
      </header>

      <main className="flex-1">
        {/* A dimmer blue in dark mode, so the band doesn't glare on a dark screen. */}
        <section className="bg-primary text-primary-foreground dark:bg-primary/30">
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 py-12 sm:py-16 lg:grid-cols-[1.1fr_1fr] lg:gap-14 lg:py-20">
            <div className="flex min-w-0 flex-col items-start gap-5">
              <h1 className="text-3xl font-extrabold tracking-tight text-balance sm:text-4xl lg:text-5xl">
                {t.heading}
              </h1>
              <p className="max-w-xl text-lg text-pretty text-primary-foreground/85">{t.intro}</p>
              <p className="flex items-start gap-3 rounded-lg bg-highlight px-4 py-3 text-lg font-bold text-pretty text-highlight-foreground">
                <Clock aria-hidden className="mt-0.5 size-6 shrink-0" />
                {until ? (
                  <time dateTime={until.toISOString()}>
                    {fill(t.backBy, { time: formatMaintenanceUntil(until, locale) })}
                  </time>
                ) : (
                  t.backUnknown
                )}
              </p>
              <p className="max-w-xl text-pretty text-primary-foreground/85">{t.reload}</p>
            </div>
            <div className="flex min-w-0 flex-col gap-3">
              <p className="text-pretty text-primary-foreground/85">{t.fareBoardNote}</p>
              <FareBoard />
            </div>
          </div>
        </section>

        <section aria-labelledby="help-heading" className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
          <h2 id="help-heading" className="text-2xl font-extrabold tracking-tight">
            {t.helpHeading}
          </h2>
          <p className="mt-2 max-w-xl text-pretty text-muted-foreground">{t.helpText}</p>
          <ul className="mt-6 grid gap-3 sm:max-w-2xl sm:grid-cols-2">
            {helpLinks.map(({ path, label, Icon }) => (
              <li key={path}>
                <a
                  href={new URL(path, betterCabanatuanUrl).href}
                  className="flex min-h-14 items-center gap-3 rounded-lg border px-4 py-3 font-bold transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  <Icon aria-hidden className="size-5 shrink-0 text-primary dark:text-ring" />
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="border-t">
        <p className="mx-auto max-w-6xl px-4 py-6 text-sm text-muted-foreground">
          <span className="font-bold text-foreground">Pamasahe Cabanatuan</span> · {dict.footer.about}
        </p>
      </footer>
    </>
  );
}
