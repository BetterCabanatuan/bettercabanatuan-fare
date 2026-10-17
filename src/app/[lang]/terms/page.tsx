import type { Metadata } from "next";

import { LegalPage } from "@/components/legal/legal-page";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { localizePath } from "@/lib/i18n/locales";

export async function generateMetadata(): Promise<Metadata> {
  const { locale, dict } = await getDictionary();
  return {
    title: dict.terms.title,
    description: dict.terms.description,
    alternates: {
      canonical: localizePath(locale, "/terms"),
      languages: { en: "/terms", tl: "/tl/terms", "x-default": "/terms" },
    },
  };
}

export default async function TermsPage() {
  const { dict } = await getDictionary();
  return <LegalPage title={dict.terms.title} intro={dict.terms.intro} sections={dict.terms.sections} />;
}
