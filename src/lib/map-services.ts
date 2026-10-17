// Routing and place search, called straight from the browser. Only coordinates and
// the typed search text are sent.
import type { Place, RoadRoute } from "@/components/fare/types";
import type { LngLat } from "@/lib/geo";
import { detourVias, pickRoadOptions } from "@/lib/road-routes";

// Free public server with fair-use limits; the routing provider is an open item in the spec (§10 #5).
const OSRM_URL = "https://routing.openstreetmap.de/routed-car/route/v1/driving";
// Free public server with fair-use limits; the geocoding provider is an open item in the spec (§10 #6).
const PHOTON_URL = "https://photon.komoot.io";

// Rough box around Cabanatuan City so search results stay local.
const CITY_BBOX = "120.879,15.435,121.094,15.565";

// Philippine national route numbers (N1, N5, ...) and Asian Highway numbers (AH26).
const NATIONAL_ROUTE_REF = /\b(?:N\d+|AH\d+)\b/;

type OsrmStep = { name?: string; ref?: string };

type OsrmResponse = {
  code?: string;
  routes?: {
    distance: number;
    duration: number;
    geometry: { coordinates: LngLat[] };
    legs?: { distance: number; steps?: OsrmStep[] }[];
  }[];
};

type PhotonFeature = {
  geometry: { coordinates: LngLat };
  properties: {
    name?: string;
    street?: string;
    housenumber?: string;
    district?: string;
    locality?: string;
    city?: string;
  };
};

type PhotonResponse = { features?: PhotonFeature[] };

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
  return (await response.json()) as T;
}

type RoadOptions = { alternatives: boolean; turnAtStops?: boolean };

/** One OSRM request through the given points; [] when OSRM finds no road. */
async function requestRoads(points: LngLat[], options: RoadOptions, signal?: AbortSignal): Promise<RoadRoute[]> {
  const coordinates = points.map(([lng, lat]) => `${lng},${lat}`).join(";");
  const params = new URLSearchParams({
    overview: "full",
    geometries: "geojson",
    steps: "true",
    alternatives: String(options.alternatives),
    ...(options.turnAtStops && { continue_straight: "false" }),
  });
  const url = `${OSRM_URL}/${coordinates}?${params}`;
  const response = await fetch(url, { signal });
  // OSRM answers "no route" with a 400 and a JSON body, so read the body before
  // treating the status as a failure.
  const body = (await response.json().catch(() => null)) as OsrmResponse | null;
  if (body?.code === "NoRoute") return [];
  if (!response.ok || !body) throw new Error(`Routing failed with status ${response.status}`);

  return (body.routes ?? []).map((route) => {
    const steps = route.legs?.flatMap((leg) => leg.steps ?? []) ?? [];
    const national = steps.find((step) => step.ref && NATIONAL_ROUTE_REF.test(step.ref));
    return {
      line: route.geometry.coordinates,
      distanceKm: route.distance / 1000,
      legsKm: route.legs?.map((leg) => leg.distance / 1000) ?? [],
      durationMin: route.duration / 60,
      nationalRoad: national ? national.name || national.ref || null : null,
    };
  });
}

/**
 * The roads between A and B, shortest first; [] when there is none. The direct request
 * decides success: detours only add choices, so a failed detour is skipped.
 */
export async function fetchRoadRoutes(a: LngLat, b: LngLat, signal?: AbortSignal): Promise<RoadRoute[]> {
  const detourRequests = detourVias(a, b).map((via) =>
    requestRoads([a, via, b], { alternatives: false }, signal).catch((): RoadRoute[] => []),
  );
  const [direct, ...detours] = await Promise.all([requestRoads([a, b], { alternatives: true }, signal), ...detourRequests]);
  return direct.length === 0 ? [] : pickRoadOptions(direct, detours.flat());
}

/** One road through every point in order, for a suggested jeep route; null when OSRM finds none. */
export async function fetchRoadThrough(points: LngLat[], signal?: AbortSignal): Promise<RoadRoute | null> {
  // OSRM's car profile won't turn at a stop by default, so a stop tapped just past a
  // junction sends the line around the block. Stops only shape the line; they are not
  // where the jeep turns. The admin action asks OSRM the same way so it publishes this line.
  const [road] = await requestRoads(points, { alternatives: false, turnAtStops: true }, signal);
  return road ?? null;
}

// Null when Photon has nothing readable to call the place; callers skip it or use their own label.
function toPlace(feature: PhotonFeature, position: LngLat = feature.geometry.coordinates): Place | null {
  const { name, street, housenumber, district, locality, city } = feature.properties;
  const streetLabel = [street, housenumber].filter(Boolean).join(" ");
  const detail = [district ?? locality, city].filter(Boolean).join(", ");
  const label = name ?? (streetLabel || city);
  if (!label) return null;
  return {
    position,
    label,
    ...(detail && { detail }),
  };
}

export async function searchPlaces(query: string, signal?: AbortSignal): Promise<Place[]> {
  const params = new URLSearchParams({ q: query, limit: "6", lang: "en", bbox: CITY_BBOX });
  const body = await getJson<PhotonResponse>(`${PHOTON_URL}/api/?${params}`, signal);
  return (body.features ?? []).map((feature) => toPlace(feature)).filter((place) => place !== null);
}

export async function reversePlace(position: LngLat, signal?: AbortSignal): Promise<Place | null> {
  const params = new URLSearchParams({
    lon: String(position[0]),
    lat: String(position[1]),
    lang: "en",
  });
  const body = await getJson<PhotonResponse>(`${PHOTON_URL}/reverse?${params}`, signal);
  const feature = body.features?.[0];
  // Keep the pin where it was dropped; only the name comes from the nearest feature.
  return feature ? toPlace(feature, position) : null;
}
