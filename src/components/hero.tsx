import Link from "next/link";

export function Hero() {
  return (
    <section className="bg-primary text-primary-foreground">
      <div className="mx-auto flex max-w-5xl flex-col items-start gap-5 px-4 py-12 sm:py-16">
        <p className="rounded bg-highlight px-2 py-1 text-xs font-bold uppercase tracking-wider text-highlight-foreground">
          Jeep fares updated Sept 28, 2026
        </p>
        <h1 className="text-4xl font-extrabold tracking-tight text-balance sm:text-5xl">
          Magkano ang pamasahe?
        </h1>
        <p className="max-w-xl text-lg text-pretty text-primary-foreground/85">
          Check the legal jeep and tricycle fare in Cabanatuan City before you
          pay. Every amount shows where it comes from and when it took effect.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/fare"
            className="inline-flex min-h-11 items-center rounded-lg bg-highlight px-5 font-bold text-highlight-foreground transition-colors hover:bg-highlight/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-foreground"
          >
            Compute tricycle fare
          </Link>
          <Link
            href="/fare?mode=jeep"
            className="inline-flex min-h-11 items-center rounded-lg border-2 border-primary-foreground px-5 font-bold transition-colors hover:bg-primary-foreground/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-foreground"
          >
            Compute jeep fare
          </Link>
        </div>
      </div>
    </section>
  );
}
