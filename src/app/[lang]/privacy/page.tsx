import type { Metadata } from "next";

import { LegalPage } from "@/components/legal/legal-page";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { localizePath } from "@/lib/i18n/locales";

export async function generateMetadata(): Promise<Metadata> {
  const { locale, dict } = await getDictionary();
  return {
    title: dict.privacy.title,
    description: dict.privacy.description,
    alternates: {
      canonical: localizePath(locale, "/privacy"),
      languages: { en: "/privacy", tl: "/tl/privacy", "x-default": "/privacy" },
    },
  };
}

export default async function PrivacyPage() {
  const { dict } = await getDictionary();
  return <LegalPage title={dict.privacy.title} intro={dict.privacy.intro} sections={dict.privacy.sections} />;
}
