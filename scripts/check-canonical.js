/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const canonicalPath = path.join(root, "docs", "CANONICAL.md");

if (!fs.existsSync(canonicalPath)) {
  console.error("canonical-check: docs/CANONICAL.md is missing");
  process.exit(1);
}

const canonical = fs.readFileSync(canonicalPath, "utf8");
const failures = [];

// Rows with a real version and date are the CURRENT entries. Rows marked
// "not yet written" are intentionally placeholders and are not required yet.
const rowPattern = /\|[^|]+\|\s*`([^`]+)`\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|/g;
for (const match of canonical.matchAll(rowPattern)) {
  const file = match[1];
  const version = match[2].trim();
  const updated = match[3].trim();
  if (version === "—" || updated.toLowerCase() === "not yet written") continue;

  const target = path.join(root, file);
  if (!fs.existsSync(target)) {
    failures.push(`CURRENT file missing: ${file}`);
  }
}

// Superseded entries must begin with the prescribed warning banner.
const supersededSection = canonical.split("## Superseded — DO NOT USE")[1]?.split("## How to update this file")[0] ?? "";
for (const match of supersededSection.matchAll(/\|\s*`([^`]+)`\s*\|/g)) {
  const file = match[1];
  const target = path.join(root, file);
  if (!fs.existsSync(target)) {
    failures.push(`SUPERSEDED file missing: ${file}`);
    continue;
  }
  const firstLine = fs.readFileSync(target, "utf8").split(/\r?\n/, 1)[0];
  if (!firstLine.startsWith("> ⚠️ SUPERSEDED")) {
    failures.push(`SUPERSEDED file lacks first-line warning banner: ${file}`);
  }
}

// Every Markdown spec under docs/specs must be represented in the index.
const specsDir = path.join(root, "docs", "specs");
if (fs.existsSync(specsDir)) {
  for (const entry of fs.readdirSync(specsDir, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith(".md")) continue;
    const relative = `docs/specs/${entry.name}`;
    if (!canonical.includes(`\`${relative}\``)) {
      failures.push(`Spec missing from CANONICAL.md: ${relative}`);
    }
  }
}

if (failures.length) {
  console.error("canonical-check failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("canonical-check passed");
