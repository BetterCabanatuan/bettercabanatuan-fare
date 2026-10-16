import Link from "next/link";

import { LanguageToggle } from "@/components/shared/language-toggle";
import { NavLink } from "@/components/shared/nav-link";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { localizePath } from "@/lib/i18n/locales";

export async function Navbar() {
  const { locale, dict } = await getDictionary();
  const farePath = localizePath(locale, "/fare");

  return (
    <header className="border-b bg-background">
      {/* On phones the toggle sits beside the logo and the links take their own row. */}
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-2 gap-y-1 px-4 py-2">
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
        <nav aria-label={dict.nav.main} className="order-3 w-full sm:order-2 sm:w-auto">
          <ul className="flex flex-wrap gap-1">
            <li>
              <NavLink href={farePath}>{dict.nav.tricycle}</NavLink>
            </li>
            <li>
              <NavLink href={`${farePath}?mode=jeep`}>{dict.nav.jeep}</NavLink>
            </li>
            <li>
              <NavLink href={localizePath(locale, "/toda")}>{dict.nav.toda}</NavLink>
            </li>
          </ul>
        </nav>
        <div className="order-2 sm:order-3">
          <LanguageToggle locale={locale} label={dict.nav.language} switchTo={dict.nav.switchTo} />
        </div>
      </div>
    </header>
  );
}
