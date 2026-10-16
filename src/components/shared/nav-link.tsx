"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export function NavLink({ href, children }: { href: string; children: ReactNode }) {
  const pathname = usePathname();
  // Matches on pathname only: reading the query would need useSearchParams and a Suspense boundary.
  const isCurrent = pathname === href.split("?")[0];

  return (
    <Link
      href={href}
      aria-current={isCurrent ? "page" : undefined}
      className="inline-flex min-h-11 items-center rounded-md px-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring aria-[current=page]:text-primary"
    >
      {children}
    </Link>
  );
}
