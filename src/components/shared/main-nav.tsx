"use client";

import { Users } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { ComponentType, SVGProps } from "react";

import { JeepIcon, TricycleIcon } from "@/components/shared/vehicle-icons";
import { stripLocale } from "@/lib/i18n/locales";
import { cn } from "@/lib/utils";

export type NavKey = "tricycle" | "jeep" | "toda";

export type NavItem = {
  key: NavKey;
  href: string;
  /** Full label for the desktop bar. */
  label: string;
  /** Short label that fits under an icon in the phone tab bar. */
  shortLabel: string;
};

const icons: Record<NavKey, ComponentType<SVGProps<SVGSVGElement>>> = {
  tricycle: TricycleIcon,
  jeep: JeepIcon,
  toda: Users,
};

type Variant = "top" | "tabs";

/**
 * Main navigation with the current page marked. Tricycle and jeep share /fare and differ
 * only by ?mode=, so this reads the query and must sit inside a Suspense boundary;
 * use MainNavLinks without `current` as the fallback.
 */
export function MainNav({ items, variant }: { items: NavItem[]; variant: Variant }) {
  const path = stripLocale(usePathname());
  const mode = useSearchParams().get("mode");

  const current: NavKey | undefined =
    path === "/fare" ? (mode === "jeep" ? "jeep" : "tricycle") : path.startsWith("/toda") ? "toda" : undefined;

  return <MainNavLinks items={items} variant={variant} current={current} />;
}

export function MainNavLinks({ items, variant, current }: { items: NavItem[]; variant: Variant; current?: NavKey }) {
  if (variant === "top") {
    return (
      <ul className="flex gap-1">
        {items.map((item) => (
          <li key={item.key}>
            <Link
              href={item.href}
              aria-current={item.key === current ? "page" : undefined}
              className="inline-flex min-h-11 items-center rounded-md px-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring aria-[current=page]:text-primary"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul className="grid grid-cols-3">
      {items.map((item) => {
        const Icon = icons[item.key];
        const isCurrent = item.key === current;
        return (
          <li key={item.key}>
            <Link
              href={item.href}
              aria-current={isCurrent ? "page" : undefined}
              // Full label for screen readers when the visible one is shortened.
              aria-label={item.shortLabel === item.label ? undefined : item.label}
              className="group flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs font-semibold text-muted-foreground select-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring aria-[current=page]:text-primary"
            >
              <span
                className={cn(
                  "flex h-7 w-14 items-center justify-center rounded-full transition-[background-color,transform] duration-150 ease-out group-active:scale-95 motion-reduce:transition-none",
                  isCurrent ? "bg-primary/10" : "group-active:bg-muted",
                )}
              >
                <Icon aria-hidden="true" className="size-6" />
              </span>
              {item.shortLabel}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
