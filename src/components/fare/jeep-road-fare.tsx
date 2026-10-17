"use client";

import { useId, useState } from "react";

import { RoadOptions } from "@/components/fare/road-options";
import { JeepFareBasis, JeepFareBreakdown, JeepTypeToggle } from "@/components/fare/jeep-fare-calculator";
import type { RouteStatus } from "@/components/fare/types";
import { useDictionary } from "@/components/shared/dictionary-provider";
import { Spinner } from "@/components/ui/spinner";
import type { FareSourceInfo } from "@/lib/data";
import { displayKm, formatPeso, jeepFare, type JeepFareRules, type JeepType } from "@/lib/fare";
import { fill } from "@/lib/i18n/locales";

type JeepRoadFareProps = {
  rules: JeepFareRules;
  source: FareSourceInfo;
  route: RouteStatus;
  hasBothPoints: boolean;
  onSelectRoad: (index: number) => void;
};

/** Jeep fare from the A→B road distance. */
export function JeepRoadFare({ rules, source, route, hasBothPoints, onSelectRoad }: JeepRoadFareProps) {
  const { dict } = useDictionary();
  const t = dict.jeep;
  const [type, setType] = useState<JeepType>("traditional");
  const resultTitleId = useId();

  const roadRoute = hasBothPoints && route.state === "ready" ? route.routes[route.selected] : null;
  const routeError = hasBothPoints && route.state === "error" ? route.reason : null;
  const measuring = hasBothPoints && route.state === "loading";
  const idle = !roadRoute && !routeError && !measuring;

  const fare = roadRoute ? jeepFare(rules, type, roadRoute.distanceKm) : null;
  const distanceText =
    roadRoute && fare
      ? [
          fill(t.roadKm, { km: displayKm(roadRoute.distanceKm).toFixed(1) }),
          fill(t.billedKm, { km: fare.billableKm }),
        ].join(" · ")
      : "";

  return (
    <div className="flex flex-col gap-3">
      <div aria-live="polite" className="flex flex-col gap-3">
        {measuring && (
          <p className="flex items-center gap-2 text-sm">
            <Spinner aria-hidden role="presentation" />
            {t.measuring}
          </p>
        )}
        {routeError === "no-route" && <p className="text-sm">{t.noRoute}</p>}
        {routeError === "unreachable" && <p className="text-sm">{t.unreachable}</p>}
        {idle && <p className="text-sm">{t.setPoints}</p>}
      </div>

      {hasBothPoints && route.state === "ready" && route.routes.length > 1 && (
        <RoadOptions
          roads={route.routes}
          selected={route.selected}
          onSelect={onSelectRoad}
          fareFor={(km) => jeepFare(rules, type, km).regular}
        />
      )}

      {fare && (
        <section
          aria-labelledby={resultTitleId}
          className="flex flex-col gap-4 rounded-2xl border bg-card p-4 text-card-foreground"
        >
          <h2 id={resultTitleId} className="text-base font-bold tracking-tight">
            {t.tripFareTitle}
          </h2>

          <JeepTypeToggle value={type} onChange={setType} />

          <div className="flex flex-col gap-4 rounded-xl bg-foreground p-4 text-background">
            <dl className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <dt className="text-sm text-background/80">{t.regular}</dt>
                <dd className="text-4xl leading-none font-bold tracking-tight text-highlight tabular-nums">
                  {formatPeso(fare.regular)}
                </dd>
              </div>
              <div className="flex flex-col gap-1">
                <dt className="text-sm text-background/80">{t.discountedRiders}</dt>
                <dd className="text-4xl leading-none font-bold tracking-tight tabular-nums">
                  {formatPeso(fare.discounted)}
                </dd>
              </div>
            </dl>
            <div className="flex flex-col gap-0.5">
              <p className="text-sm font-medium tabular-nums">{distanceText}</p>
              <p className="text-sm text-background/70">{t.roadNote}</p>
            </div>
          </div>

          <JeepFareBreakdown rules={rules} type={type} fare={fare} />

          <JeepFareBasis rules={rules} source={source} />
        </section>
      )}
    </div>
  );
}
