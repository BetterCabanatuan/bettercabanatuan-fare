import type { Metadata } from "next";
import type { ReactNode } from "react";

import { SourceText } from "@/components/shared/source-text";
import {
  jeepFareReferences,
  jeepRoutes,
  jeepSource,
  routeReferences,
  terminals,
  tricycleFareReferences,
} from "@/lib/data";
import { formatDate } from "@/lib/format-date";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { fill, localizePath } from "@/lib/i18n/locales";

// The services the map calls, with the page each one asks to be credited by.
const services = [
  { key: "osm", name: "OpenStreetMap", href: "https://www.openstreetmap.org/copyright" },
  { key: "carto", name: "CARTO", href: "https://carto.com/attributions" },
  { key: "osrm", name: "OSRM", href: "https://routing.openstreetmap.de/about.html" },
  { key: "photon", name: "Photon", href: "https://photon.komoot.io" },
] as const;

export async function generateMetadata(): Promise<Metadata> {
  const { locale, dict } = await getDictionary();
  return {
    title: dict.sources.title,
    description: dict.sources.description,
    alternates: {
      canonical: localizePath(locale, "/sources"),
      languages: { en: "/sources", tl: "/tl/sources", "x-default": "/sources" },
    },
  };
}

export default async function SourcesPage() {
  const { dict } = await getDictionary();
  const t = dict.sources;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-4 py-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight">{t.title}</h1>
        <p className="text-pretty text-muted-foreground">{t.intro}</p>
      </header>

      <Section title={t.servicesTitle}>
        <ul className="flex flex-col gap-3">
          {services.map((service) => (
            <li key={service.key}>
              <a
                href={service.href}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold underline underline-offset-2"
              >
                {service.name}
              </a>
              <p className="text-sm text-muted-foreground">{t[service.key]}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section title={t.tricycleTitle} note={t.tricycleNote}>
        <UrlList urls={tricycleFareReferences} />
      </Section>

      <Section
        title={t.jeepTitle}
        note={fill(t.jeepNote, {
          authority: jeepSource.reference ?? "",
          date: jeepSource.effectiveDate ? formatDate(jeepSource.effectiveDate) : "",
        })}
      >
        <UrlList urls={jeepFareReferences} />
      </Section>

      <Section title={t.routesTitle} note={t.routesNote}>
        <dl className="flex flex-col gap-3 text-sm">
          {jeepRoutes.map((route) => (
            <div key={route.id}>
              <dt className="font-semibold">{route.name}</dt>
              <dd className="text-muted-foreground">
                <SourceText source={route.source} />
              </dd>
              {(routeReferences[route.id] ?? [])
                .filter((url) => url !== route.source)
                .map((url) => (
                  <dd key={url} className="text-muted-foreground">
                    <SourceText source={url} />
                  </dd>
                ))}
            </div>
          ))}
        </dl>
      </Section>

      <Section title={t.terminalsTitle}>
        <dl className="flex flex-col gap-3 text-sm">
          {terminals.map((terminal) => (
            <div key={terminal.id}>
              <dt className="font-semibold">
                {terminal.name}
                {!terminal.verified && <span className="font-normal text-muted-foreground"> · {t.unverified}</span>}
              </dt>
              <dd className="text-muted-foreground">
                <SourceText source={terminal.source} />
              </dd>
            </div>
          ))}
        </dl>
      </Section>
    </main>
  );
}

function Section({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xl font-bold">{title}</h2>
      {note && <p className="text-pretty text-sm text-muted-foreground">{note}</p>}
      {children}
    </section>
  );
}

function UrlList({ urls }: { urls: string[] }) {
  return (
    <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm marker:text-muted-foreground">
      {urls.map((url) => (
        <li key={url}>
          <SourceText source={url} />
        </li>
      ))}
    </ul>
  );
}
