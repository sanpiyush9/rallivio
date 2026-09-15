import { createRequire } from "node:module";
import { defineConfig, globalIgnores } from "eslint/config";

const require = createRequire(import.meta.url);
const nextVitalsModule = require("eslint-config-next/core-web-vitals");
const nextTsModule = require("eslint-config-next/typescript");
const nextVitals = nextVitalsModule.default ?? nextVitalsModule;
const nextTs = nextTsModule.default ?? nextTsModule;

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", "node_modules/**", "out/**", "build/**", "next-env.d.ts"]),
]);
