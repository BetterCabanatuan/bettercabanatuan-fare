import type { Metadata } from "next";

import { Hero } from "@/components/hero";
import { HowItWorks } from "@/components/home/how-it-works";
import { RideOptions } from "@/components/home/ride-options";
import { TrustPoints } from "@/components/home/trust-points";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { localizePath } from "@/lib/i18n/locales";

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getDictionary();
  return {
    alternates: {
      canonical: localizePath(locale, "/"),
      languages: { en: "/", tl: "/tl", "x-default": "/" },
    },
  };
}

export default function Home() {
  return (
    <main className="flex-1">
      <Hero />
      <RideOptions />
      <HowItWorks />
      <TrustPoints />
    </main>
  );
}
