import Link from "next/link";
import { Suspense } from "react";

import { LanguageToggle } from "@/components/shared/language-toggle";
import { MainNav, MainNavLinks, type NavItem } from "@/components/shared/main-nav";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { localizePath } from "@/lib/i18n/locales";

export async function Navbar() {
  const { locale, dict } = await getDictionary();
  const farePath = localizePath(locale, "/fare");
  const items: NavItem[] = [
    { key: "tricycle", href: farePath, label: dict.nav.tricycle, shortLabel: dict.nav.tabTricycle },
    { key: "jeep", href: `${farePath}?mode=jeep`, label: dict.nav.jeep, shortLabel: dict.nav.tabJeep },
    { key: "toda", href: localizePath(locale, "/toda"), label: dict.nav.toda, shortLabel: dict.nav.tabToda },
  ];

  return (
    <>
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-5xl items-center gap-2 px-4 py-2">
          <Link
            href={localizePath(locale, "/")}
            className="mr-auto flex min-h-11 items-center gap-2.5 rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <span
              aria-hidden="true"
              className="grid size-[38px] shrink-0 place-items-center rounded-lg bg-highlight text-lg font-extrabold text-highlight-foreground"
            >
              ₱
            </span>
            <span className="flex flex-col uppercase leading-none">
              <span className="text-base font-extrabold tracking-tight">Pamasahe</span>
              <span className="mt-1 text-[10px] font-semibold tracking-[0.18em] text-muted-foreground">
                {dict.nav.city}
              </span>
            </span>
          </Link>
          {/* From sm up the links sit in the header; on phones they move to the tab bar below. */}
          <nav aria-label={dict.nav.main} className="hidden sm:block">
            <Suspense fallback={<MainNavLinks items={items} variant="top" />}>
              <MainNav items={items} variant="top" />
            </Suspense>
          </nav>
          <LanguageToggle locale={locale} label={dict.nav.language} switchTo={dict.nav.switchTo} />
        </div>
      </header>

      <nav
        aria-label={dict.nav.main}
        // Hidden while typing: on iOS a fixed bar rides up with the keyboard and covers search results.
        className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] backdrop-blur-md sm:hidden [body:has(:is(input,textarea,select):focus)_&]:hidden"
      >
        <Suspense fallback={<MainNavLinks items={items} variant="tabs" />}>
          <MainNav items={items} variant="tabs" />
        </Suspense>
      </nav>
    </>
  );
}
