import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    // /tl/admin exists because every page lives under [lang]; it is the same admin area.
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/tl/admin", "/api"] },
    sitemap: new URL("/sitemap.xml", siteUrl).toString(),
  };
}
