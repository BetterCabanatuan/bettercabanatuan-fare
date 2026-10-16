import type { Metadata } from "next";
import { Suspense } from "react";

import { FarePlanner } from "@/components/fare/fare-planner";
import {
  cityBoundary,
  jeepPreviousRates,
  jeepRoutes,
  jeepRules,
  jeepSource,
  landmarks,
  terminals,
  tricycleRules,
  tricycleSource,
} from "@/lib/data";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { localizePath } from "@/lib/i18n/locales";
import { listVerifiedRoutes } from "@/lib/routes/queries";

export async function generateMetadata(): Promise<Metadata> {
  const { locale, dict } = await getDictionary();
  return {
    title: dict.meta.fareTitle,
    description: dict.meta.fareDescription,
    alternates: {
      canonical: localizePath(locale, "/fare"),
      languages: { en: "/fare", tl: "/tl/fare", "x-default": "/fare" },
    },
  };
}

export default async function FarePage() {
  // Verified resident routes come from a cached query, so they join the prerendered
  // shell with the presets and the page stays static until an admin approves one.
  const communityRoutes = await listVerifiedRoutes();

  return (
    // The planner reads the trip from the address, so it renders in the browser behind Suspense
    // while the rest of the page is prerendered.
    <Suspense fallback={<main className="flex-1" aria-busy="true" />}>
      <FarePlanner
        tricycleRules={tricycleRules}
        tricycleSource={tricycleSource}
        jeepRules={jeepRules}
        jeepPreviousRates={jeepPreviousRates}
        jeepSource={jeepSource}
        jeepRoutes={[...jeepRoutes, ...communityRoutes]}
        landmarks={landmarks}
        terminals={terminals}
        boundary={cityBoundary}
      />
    </Suspense>
  );
}
