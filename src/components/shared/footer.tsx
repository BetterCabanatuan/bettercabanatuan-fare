import Link from "next/link";

import { LogoMark } from "@/components/shared/logo-mark";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { fill, localizePath } from "@/lib/i18n/locales";
import { appVersion, betterCabanatuanUrl } from "@/lib/site";

type FooterLink = { href: string; label: string; external?: boolean };
type FooterSection = { id: string; heading: string; links: FooterLink[] };

const linkClass =
  "inline-flex min-h-11 items-center text-sm text-background/75 underline-offset-4 transition-colors hover:text-background hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-background";

function FooterAnchor({ href, label, external }: FooterLink) {
  return external ? (
    <a href={href} className={linkClass}>
      {label}
    </a>
  ) : (
    <Link href={href} className={linkClass}>
      {label}
    </Link>
  );
}

export async function Footer() {
  const { locale, dict } = await getDictionary();
  const t = dict.footer;
  const path = (to: string) => localizePath(locale, to);
  const portal = (to: string) => new URL(to, betterCabanatuanUrl).href;

  const sections: FooterSection[] = [
    {
      id: "fares",
      heading: t.faresHeading,
      links: [
        { href: path("/fare"), label: dict.nav.tricycle },
        { href: `${path("/fare")}?mode=jeep`, label: dict.nav.jeep },
        { href: path("/toda"), label: t.todaDirectory },
        { href: path("/sources"), label: t.sources },
      ],
    },
    {
      id: "help",
      heading: t.helpHeading,
      links: [
        { href: path("/fare/suggest"), label: t.suggestRoute },
        { href: path("/toda/submit"), label: t.addToda },
        { href: path("/feedback"), label: dict.feedback.footerLink },
        { href: path("/contributors"), label: dict.contributors.footerLink },
        { href: "https://github.com/BetterCabanatuan/bettercabanatuan-fare", label: t.github, external: true },
      ],
    },
    {
      id: "portal",
      heading: t.portalHeading,
      links: [
        { href: portal("/"), label: t.portalHome, external: true },
        { href: portal("/hotlines"), label: t.portalHotlines, external: true },
        {
          href: portal("/services/business/get-a-mayors-clearance-for-a-tricycle-mtop"),
          label: t.portalMtop,
          external: true,
        },
        { href: portal("/about"), label: t.portalAbout, external: true },
        { href: portal("/contact"), label: t.portalContact, external: true },
        { href: "https://www.facebook.com/bettercabanatuan.org", label: t.facebook, external: true },
      ],
    },
  ];

  const legalLinks: FooterLink[] = [
    { href: path("/privacy"), label: t.privacy },
    { href: path("/terms"), label: t.terms },
    { href: `${path("/privacy")}#delete`, label: t.deleteData },
    { href: "https://www.openstreetmap.org/copyright", label: t.mapData, external: true },
  ];

  return (
    <footer className="bg-foreground text-background">
      <div className="mx-auto max-w-5xl px-4 pt-12 pb-8">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-[1.5fr_1fr_1fr_1fr] lg:gap-x-10">
          <div className="col-span-2 flex flex-col items-start gap-4 lg:col-span-1">
            <Link
              href={path("/")}
              className="flex min-h-11 items-center gap-3 rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-background"
            >
              {/* The logo's blue city outline disappears on the dark band, so it sits on a white tile. */}
              <span className="rounded-lg bg-background p-1.5">
                <LogoMark className="h-8 w-auto" />
              </span>
              <span className="flex flex-col uppercase leading-none">
                <span className="text-base font-extrabold tracking-tight">Pamasahe</span>
                <span className="mt-1 text-[10px] font-semibold tracking-[0.18em] text-background/70">
                  {dict.nav.city}
                </span>
              </span>
            </Link>
            <p className="max-w-sm text-sm text-pretty text-background/75">{t.tagline}</p>
            <p className="max-w-sm rounded-md border border-highlight/40 px-3 py-2 text-xs text-pretty text-highlight">
              {t.alpha}
            </p>
          </div>

          {sections.map((section) => (
            <nav key={section.id} aria-labelledby={`footer-${section.id}`} className="min-w-0">
              <h2 id={`footer-${section.id}`} className="mb-2 text-sm font-bold tracking-wider uppercase">
                {section.heading}
              </h2>
              <ul>
                {section.links.map((link) => (
                  <li key={link.href}>
                    <FooterAnchor {...link} />
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-background/20 pt-6 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-background/75">
            <span className="font-bold text-background">Pamasahe Cabanatuan</span> · {t.about}
            <span className="mt-1 flex flex-wrap items-center gap-x-2 font-mono text-xs text-highlight">
              {fill(t.version, { version: appVersion })}
              <span aria-hidden>·</span>
              <Link
                href={path("/whats-new")}
                className="inline-flex min-h-11 items-center underline underline-offset-4 hover:text-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-background"
              >
                {dict.whatsNew.footerLink}
              </Link>
            </span>
          </p>
          <nav aria-label={t.legalHeading}>
            <ul className="flex flex-wrap gap-x-5">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <FooterAnchor {...link} />
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
}
