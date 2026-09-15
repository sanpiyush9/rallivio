import { createRequire } from "node:module";
import { defineConfig, globalIgnores } from "eslint/config";

const require = createRequire(import.meta.url);

function asConfigArray(moduleValue, name) {
  let value = moduleValue;
  for (let depth = 0; depth < 3; depth += 1) {
    if (Array.isArray(value)) return value;
    if (value && typeof value === "object" && "default" in value) {
      value = value.default;
      continue;
    }
    break;
  }
  throw new TypeError(`${name} did not export an ESLint config array`);
}

const nextVitals = asConfigArray(require("eslint-config-next/core-web-vitals"), "next/core-web-vitals");
const nextTs = asConfigArray(require("eslint-config-next/typescript"), "next/typescript");

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", "node_modules/**", "out/**", "build/**", "next-env.d.ts"]),
]);
