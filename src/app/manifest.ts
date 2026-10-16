import type { MetadataRoute } from "next";

import { siteName } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${siteName}: jeep and tricycle fares`,
    short_name: "Pamasahe",
    description: "Check the legal jeep and tricycle fare in Cabanatuan City before you pay.",
    start_url: "/fare",
    display: "standalone",
    background_color: "#FFFFFF",
    theme_color: "#1B3F8B",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      // Full-bleed with the pin inside the safe zone, so Android's circle or squircle mask never clips it.
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
