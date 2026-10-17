import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

// Pages are prerendered from the JSON in data/ and only change with a deploy, so the
// build output in Workers Static Assets is the whole cache: no R2 bucket, KV or D1.
// Database reads skip this cache and go to the Supabase Data API.
// See https://opennext.js.org/cloudflare/caching
export default defineCloudflareConfig({
  incrementalCache: staticAssetsIncrementalCache,
});
