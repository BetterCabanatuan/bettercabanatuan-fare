// Routing and place search, called straight from the browser. Only coordinates and
// the typed search text are sent.
import type { Place, RoadRoute } from "@/components/fare/types";
import type { LngLat } from "@/lib/geo";

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
    geometry: { coordinates: LngLat[] };
    legs?: { steps?: OsrmStep[] }[];
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

export async function fetchRoadRoute(
  a: LngLat,
  b: LngLat,
  signal?: AbortSignal,
): Promise<RoadRoute | null> {
  const url = `${OSRM_URL}/${a[0]},${a[1]};${b[0]},${b[1]}?overview=full&geometries=geojson&steps=true`;
  const response = await fetch(url, { signal });
  // OSRM answers "no route" with a 400 and a JSON body, so read the body before
  // treating the status as a failure.
  const body = (await response.json().catch(() => null)) as OsrmResponse | null;
  if (body?.code === "NoRoute") return null;
  if (!response.ok || !body) throw new Error(`Routing failed with status ${response.status}`);

  const route = body.routes?.[0];
  if (!route) return null;

  const steps = route.legs?.flatMap((leg) => leg.steps ?? []) ?? [];
  const national = steps.find((step) => step.ref && NATIONAL_ROUTE_REF.test(step.ref));

  return {
    line: route.geometry.coordinates,
    distanceKm: route.distance / 1000,
    nationalRoad: national ? national.name || national.ref || null : null,
  };
}

function toPlace(feature: PhotonFeature, position: LngLat = feature.geometry.coordinates): Place {
  const { name, street, housenumber, district, locality, city } = feature.properties;
  const streetLabel = [street, housenumber].filter(Boolean).join(" ");
  const detail = [district ?? locality, city].filter(Boolean).join(", ");
  return {
    position,
    label: name ?? (streetLabel || city || "Unnamed place"),
    ...(detail && { detail }),
  };
}

export async function searchPlaces(query: string, signal?: AbortSignal): Promise<Place[]> {
  const params = new URLSearchParams({ q: query, limit: "6", lang: "en", bbox: CITY_BBOX });
  const body = await getJson<PhotonResponse>(`${PHOTON_URL}/api/?${params}`, signal);
  return (body.features ?? []).map((feature) => toPlace(feature));
}

export async function reversePlace(position: LngLat, signal?: AbortSignal): Promise<Place> {
  const params = new URLSearchParams({
    lon: String(position[0]),
    lat: String(position[1]),
    lang: "en",
  });
  const body = await getJson<PhotonResponse>(`${PHOTON_URL}/reverse?${params}`, signal);
  const feature = body.features?.[0];
  // Keep the pin where it was dropped; only the name comes from the nearest feature.
  return feature ? toPlace(feature, position) : { position, label: "Dropped pin" };
}
