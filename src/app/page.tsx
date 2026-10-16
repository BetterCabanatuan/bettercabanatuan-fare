import { Map, MapControls } from "@/components/ui/map";

// Cabanatuan City, Nueva Ecija — [longitude, latitude]
const CABANATUAN_CENTER: [number, number] = [120.9667, 15.4865];

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 p-4 sm:p-8">
      <h1 className="text-2xl font-semibold tracking-tight">Cabanatuan Fare</h1>
      <div className="h-[480px] w-full overflow-hidden rounded-lg border">
        <Map center={CABANATUAN_CENTER} zoom={13}>
          <MapControls showLocate showFullscreen />
        </Map>
      </div>
    </main>
  );
}
