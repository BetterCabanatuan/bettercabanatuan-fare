import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack traces its .wasm loader with a pattern that matches the whole project, so
  // the .wasm files of dev tools (wrangler's blake3, shiki) land in the Worker bundle and
  // push it past Cloudflare's size limit. The app loads neither at runtime. Next's own
  // .wasm files must stay: the OpenNext build expects them.
  outputFileTracingExcludes: {
    "/*": ["node_modules/{blake3-wasm,shiki}/**/*.wasm"],
  },
  experimental: {
    agentFeedback: true,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
