"use client";

import { useState } from "react";

import type { LngLat } from "@/lib/geo";

type Failure = { reason: "denied" | "failed"; point?: LngLat };

/**
 * Asks the browser for the rider's position. A failure message only applies to the point it
 * was raised for: once point A is set another way, the message goes away on its own.
 */
export function useMyLocation(point: LngLat | undefined, onFound: (position: LngLat) => void) {
  const [locating, setLocating] = useState(false);
  const [failure, setFailure] = useState<Failure | null>(null);

  const locate = (): void => {
    if (locating) return;
    if (!("geolocation" in navigator)) {
      setFailure({ reason: "failed", point });
      return;
    }
    setFailure(null);
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocating(false);
        onFound([coords.longitude, coords.latitude]);
      },
      (error) => {
        setLocating(false);
        setFailure({ reason: error.code === error.PERMISSION_DENIED ? "denied" : "failed", point });
      },
      // Without a timeout a dismissed permission prompt would leave the button waiting forever.
      { timeout: 10000, maximumAge: 60000 },
    );
  };

  const error = failure && failure.point === point ? failure.reason : null;
  return { locate, locating, error };
}
