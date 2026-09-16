import fs from "node:fs";
import path from "node:path";

const registry = fs.readFileSync(path.join(process.cwd(), "lib/platform-icons.ts"), "utf8");
const page = fs.readFileSync(path.join(process.cwd(), "app/discover-live2/page.tsx"), "utf8");

const required = [
  "youtube", "instagram", "tiktok", "x", "linkedin", "snapchat",
  "pinterest", "spotify", "twitch", "facebook", "reddit", "discord",
];

const missing = required.filter((slug) => !new RegExp(`\\b${slug}\\s*:`).test(registry));
if (missing.length) {
  console.error(`Platform icon registry missing: ${missing.join(", ")}`);
  process.exit(1);
}
if (/iconify\\.design|iconUrl\\s*=|<img[^>]+logo/.test(page)) {
  console.error("Remote platform icon loading detected in the Discover hero.");
  process.exit(1);
}

console.log(`Platform icon assertion passed: ${required.length} bundled icons configured; remote icon loading absent.`);
