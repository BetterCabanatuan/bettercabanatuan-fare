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
  themeColor: "#1B3F8B",
};

export default async function RootLayout({ children }: LayoutProps<"/[lang]">) {
  const { locale, dict } = await getDictionary();

  return (
    <html lang={locale} className={cn("antialiased", manrope.variable)}>
      <body className="flex min-h-dvh flex-col">
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
