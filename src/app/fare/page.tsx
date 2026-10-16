import type { Metadata } from "next";
import { Suspense } from "react";

import { FarePlanner } from "@/components/fare/fare-planner";
import {
  cityBoundary,
  jeepRoutes,
  jeepRules,
  jeepSource,
  landmarks,
  tricycleRules,
  tricycleSource,
} from "@/lib/data";

export const metadata: Metadata = {
  title: "Tricycle and jeep fare map",
  description:
    "Set where you start and where you're going in Cabanatuan City to see the tricycle fare, and find jeepney routes when they are mapped.",
  alternates: { canonical: "/fare" },
};

export default function FarePage() {
  return (
    // The planner reads the trip from the address, so it renders in the browser behind Suspense
    // while the rest of the page is prerendered.
    <Suspense fallback={<main className="flex-1" aria-busy="true" />}>
      <FarePlanner
        tricycleRules={tricycleRules}
        tricycleSource={tricycleSource}
        jeepRules={jeepRules}
        jeepSource={jeepSource}
        jeepRoutes={jeepRoutes}
        landmarks={landmarks}
        boundary={cityBoundary}
      />
    </Suspense>
  );
}
