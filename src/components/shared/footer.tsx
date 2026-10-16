import Link from "next/link";

import { getDictionary } from "@/lib/i18n/get-dictionary";
import { localizePath } from "@/lib/i18n/locales";

const linkClass = "inline-flex min-h-11 items-center underline underline-offset-4 opacity-80 hover:opacity-100";

export async function Footer() {
  const { locale, dict } = await getDictionary();

  return (
    <footer className="bg-foreground text-background">
      <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-8 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p>
          <span className="font-bold">Pamasahe Cabanatuan</span> · {dict.footer.about} {dict.footer.alpha}
        </p>
        <p className="flex shrink-0 flex-wrap gap-x-4">
          <Link href={localizePath(locale, "/sources")} className={linkClass}>
            {dict.footer.sources}
          </Link>
          <a href="https://www.openstreetmap.org/copyright" className={linkClass}>
            {dict.footer.mapData}
          </a>
        </p>
      </div>
    </footer>
  );
}
