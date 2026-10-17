import Link from "next/link";

import { getDictionary } from "@/lib/i18n/get-dictionary";
import { localizePath } from "@/lib/i18n/locales";
import { betterCabanatuanUrl } from "@/lib/site";

const linkClass = "inline-flex min-h-11 items-center underline underline-offset-4 opacity-80 hover:opacity-100";

export async function Footer() {
  const { locale, dict } = await getDictionary();
  const portalLinks = [
    { path: "/", label: dict.footer.portalHome },
    { path: "/hotlines", label: dict.footer.portalHotlines },
    { path: "/services/business/get-a-mayors-clearance-for-a-tricycle-mtop", label: dict.footer.portalMtop },
    { path: "/about", label: dict.footer.portalAbout },
    { path: "/contact", label: dict.footer.portalContact },
  ];

  return (
    <footer className="bg-foreground text-background">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-8 text-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p>
            <span className="font-bold">Pamasahe Cabanatuan</span> · {dict.footer.about} {dict.footer.alpha}
          </p>
          <p className="flex shrink-0 flex-wrap gap-x-4">
            <Link href={localizePath(locale, "/feedback")} className={linkClass}>
              {dict.feedback.footerLink}
            </Link>
            <Link href={localizePath(locale, "/contributors")} className={linkClass}>
              {dict.contributors.footerLink}
            </Link>
            <Link href={localizePath(locale, "/sources")} className={linkClass}>
              {dict.footer.sources}
            </Link>
            <Link href={localizePath(locale, "/privacy")} className={linkClass}>
              {dict.footer.privacy}
            </Link>
            <Link href={localizePath(locale, "/terms")} className={linkClass}>
              {dict.footer.terms}
            </Link>
            <Link href={`${localizePath(locale, "/privacy")}#delete`} className={linkClass}>
              {dict.footer.deleteData}
            </Link>
            <a href="https://www.openstreetmap.org/copyright" className={linkClass}>
              {dict.footer.mapData}
            </a>
          </p>
        </div>
        <nav aria-labelledby="footer-portal-heading" className="flex flex-col gap-1 border-t border-background/20 pt-4">
          <h2 id="footer-portal-heading" className="font-semibold">
            {dict.footer.portalHeading}
          </h2>
          <ul className="flex flex-wrap gap-x-4">
            {portalLinks.map((link) => (
              <li key={link.path}>
                <a href={new URL(link.path, betterCabanatuanUrl).href} className={linkClass}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
