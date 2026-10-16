import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Hero } from "@/components/hero";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const modes = [
  {
    href: "/fare",
    title: "Tricycle fare",
    description: "Set where you start and where you're going to see the fare for your trip.",
  },
  {
    href: "/fare?mode=jeep",
    title: "Jeep fare",
    description: "Find the jeepney routes on the map and the fare for how far you ride.",
  },
];

export default function Home() {
  return (
    <main className="flex-1">
      <Hero />
      <section aria-labelledby="modes-heading" className="mx-auto max-w-5xl px-4 py-10">
        <h2 id="modes-heading" className="mb-4 text-xl font-bold tracking-tight">
          What are you riding?
        </h2>
        <ul className="grid gap-4 sm:grid-cols-2">
          {modes.map((mode) => (
            <li key={mode.href}>
              <Link
                href={mode.href}
                className="group flex h-full items-center gap-4 rounded-xl border bg-card p-5 text-card-foreground transition-colors hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <span className="flex flex-1 flex-col gap-1">
                  <span className="text-lg font-bold">{mode.title}</span>
                  <span className="text-sm text-muted-foreground">{mode.description}</span>
                </span>
                <ArrowRight
                  aria-hidden="true"
                  className="size-5 shrink-0 text-primary transition-transform group-hover:translate-x-0.5"
                />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
