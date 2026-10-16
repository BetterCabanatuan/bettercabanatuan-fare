import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";

import { AlphaBanner } from "@/components/shared/alpha-banner";
import { DictionaryProvider } from "@/components/shared/dictionary-provider";
import { Footer } from "@/components/shared/footer";
import { Navbar } from "@/components/shared/navbar";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { locales, openGraphLocale } from "@/lib/i18n/locales";
import { siteName, siteUrl } from "@/lib/site";
import { cn } from "@/lib/utils";
import "../globals.css";

const manrope = Manrope({ subsets: ["latin", "latin-ext"], variable: "--font-sans" });

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata(): Promise<Metadata> {
  const { locale, dict } = await getDictionary();
  return {
    metadataBase: new URL(siteUrl),
    title: { default: dict.meta.title, template: `%s · ${siteName}` },
    description: dict.meta.description,
    applicationName: siteName,
    openGraph: {
      siteName,
      locale: openGraphLocale[locale],
      alternateLocale: locales.filter((other) => other !== locale).map((other) => openGraphLocale[other]),
      type: "website",
      description: dict.meta.description,
    },
  };
}

export const viewport: Viewport = {
  // Matches the alpha strip at the top of every page (--warning), so the status bar blends in.
  themeColor: "#FFF4D6",
  // Lets the page use the full screen on notched phones; edges are padded back with env() insets.
  viewportFit: "cover",
  // Android: the keyboard shrinks the layout instead of covering it, as on iOS.
  interactiveWidget: "resizes-content",
};

export default async function RootLayout({ children }: LayoutProps<"/[lang]">) {
  const { locale, dict } = await getDictionary();

  return (
    <html lang={locale} className={cn("antialiased", manrope.variable)}>
      <body className="flex min-h-dvh flex-col pr-[env(safe-area-inset-right)] pb-[calc(3.5rem+env(safe-area-inset-bottom))] pl-[env(safe-area-inset-left)] sm:pb-[env(safe-area-inset-bottom)]">
        <DictionaryProvider locale={locale} dict={dict}>
          <AlphaBanner />
          <Navbar />
          {children}
          <Footer />
        </DictionaryProvider>
      </body>
    </html>
  );
}
