import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // shadcn components are copied in from the registry and kept close to upstream so they
  // can be updated. They sync with MapLibre and Embla through refs and effects, which the
  // React Compiler rules flag; app code keeps both rules.
  {
    files: ["src/components/ui/**", "src/hooks/use-mobile.ts"],
    rules: {
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/refs": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Throwaway Node scripts that rendered the demo video; not part of the app.
    "demo-video/**",
  ]),
]);

export default eslintConfig;
