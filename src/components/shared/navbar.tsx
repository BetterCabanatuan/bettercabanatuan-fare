import Link from "next/link";

import { NavLink } from "@/components/shared/nav-link";

export function Navbar() {
  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2">
        <Link
          href="/"
          className="flex min-h-11 items-center gap-2.5 rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
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
              Cabanatuan City
            </span>
          </span>
        </Link>
        <nav aria-label="Main">
          <ul className="flex flex-wrap gap-1">
            <li>
              <NavLink href="/fare">Tricycle fare</NavLink>
            </li>
            <li>
              <NavLink href="/fare?mode=jeep">Jeep fare</NavLink>
            </li>
            <li>
              <NavLink href="/toda">TODA</NavLink>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
