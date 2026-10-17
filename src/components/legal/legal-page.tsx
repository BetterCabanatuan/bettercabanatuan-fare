import type { ReactNode } from "react";

import { formatDate } from "@/lib/format-date";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { fill } from "@/lib/i18n/locales";
import { CONTACT_EMAIL, LEGAL_UPDATED, type LegalSection } from "@/lib/legal";

// Web addresses and email addresses in the text become links. A trailing full stop or
// comma ends the sentence, not the address.
const LINKABLE = /(https:\/\/\S+?(?=[.,;]?(?:\s|$))|[\w.+-]+@[\w-]+(?:\.[\w-]+)+)/;

function withLinks(text: string): ReactNode[] {
  return fill(text, { email: CONTACT_EMAIL })
    .split(LINKABLE)
    .map((part, i) =>
      // split() puts captured addresses at odd positions.
      i % 2 === 0 ? (
        part
      ) : (
        <a
          key={part}
          href={part.includes("@") ? `mailto:${part}` : part}
          className="font-semibold break-words text-primary underline-offset-4 hover:underline"
        >
          {part}
        </a>
      ),
    );
}

type LegalPageProps = { title: string; intro: string; sections: LegalSection[] };

/** The Privacy Policy and Terms of Use: a dated page of numbered, linkable sections. */
export async function LegalPage({ title, intro, sections }: LegalPageProps) {
  const { dict } = await getDictionary();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">{fill(dict.legal.updated, { date: formatDate(LEGAL_UPDATED) })}</p>
        <p className="text-pretty text-lg">{intro}</p>
      </header>

      <nav aria-labelledby="legal-contents" className="rounded-2xl border bg-card p-4">
        <h2 id="legal-contents" className="mb-2 text-sm font-bold tracking-tight">
          {dict.legal.onThisPage}
        </h2>
        <ol className="grid list-decimal gap-x-6 pl-5 text-sm sm:grid-cols-2">
          {sections.map((section) => (
            <li key={section.id}>
              <a href={`#${section.id}`} className="inline-flex min-h-9 items-center text-primary underline-offset-4 hover:underline">
                {section.heading}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      {sections.map((section, index) => (
        <section key={section.id} id={section.id} aria-labelledby={`${section.id}-heading`} className="flex scroll-mt-4 flex-col gap-3">
          <h2 id={`${section.id}-heading`} className="text-xl font-bold tracking-tight">
            {index + 1}. {section.heading}
          </h2>
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph} className="text-pretty">
              {withLinks(paragraph)}
            </p>
          ))}
          {section.items && (
            <ul className="flex list-disc flex-col gap-2 pl-5">
              {section.items.map((item) => (
                <li key={item} className="text-pretty">
                  {withLinks(item)}
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </main>
  );
}
