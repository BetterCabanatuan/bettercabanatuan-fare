import type { Viewport } from "next";

import { manrope } from "@/lib/fonts";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { cn } from "@/lib/utils";
import "../../globals.css";

// The rest of the site is light only. This page follows the phone's dark mode by adding the
// .dark class (globals.css) before the first paint, so there is no flash of white.
const followSystemTheme = `if(matchMedia("(prefers-color-scheme: dark)").matches)document.documentElement.classList.add("dark")`;

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
    { media: "(prefers-color-scheme: dark)", color: "#0A0A0A" },
  ],
  viewportFit: "cover",
};

/**
 * A root layout for the maintenance page alone. It sits outside app/[lang]/layout.tsx so the
 * page goes without the site's navbar, tab bar and footer, whose links lead to pages that are down.
 */
export default async function MaintenanceLayout({ children }: LayoutProps<"/[lang]">) {
  const { locale } = await getDictionary();

  return (
    // The theme script changes the class before React hydrates.
    <html lang={locale} className={cn("antialiased", manrope.variable)} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: followSystemTheme }} />
      </head>
      <body className="flex min-h-dvh flex-col pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)]">
        {children}
      </body>
    </html>
  );
}
