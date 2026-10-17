import Link from "next/link";

const SECTIONS = [
  { key: "todas", href: "/admin/todas", label: "TODAs" },
  { key: "routes", href: "/admin/routes", label: "Routes" },
  { key: "feedback", href: "/admin/feedback", label: "Feedback" },
  { key: "data", href: "/admin/data", label: "Data requests" },
] as const;

export type AdminSection = (typeof SECTIONS)[number]["key"];

export function AdminNav({ current }: { current: AdminSection }) {
  return (
    <nav aria-label="Admin sections" className="flex flex-wrap gap-4 text-sm font-semibold">
      {SECTIONS.map((section) =>
        section.key === current ? (
          <span key={section.key} aria-current="page" className="text-muted-foreground">
            {section.label}
          </span>
        ) : (
          <Link key={section.key} href={section.href} className="text-primary underline-offset-4 hover:underline">
            {section.label}
          </Link>
        ),
      )}
    </nav>
  );
}
