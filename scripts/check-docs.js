/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const root = process.env.DOCS_CHECK_ROOT || process.cwd();
const baseRef = process.env.DOCS_CHECK_BASE || "origin/main";
const headRef = process.env.DOCS_CHECK_HEAD || "HEAD";

function fail(message) {
  console.error(message);
  process.exit(1);
}

function runGit(args) {
  try {
    return execFileSync("git", args, {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  } catch (error) {
    const detail = error.stderr?.toString().trim() || error.message;
    fail(`✗ git ${args.join(" ")} failed: ${detail}`);
  }
}

function read(relativePath) {
  const file = path.join(root, relativePath);
  if (!fs.existsSync(file)) {
    fail(`✗ ${relativePath} is missing.`);
  }
  return fs.readFileSync(file, "utf8");
}

function changedFiles() {
  const range = `${baseRef}...${headRef}`;
  return runGit(["diff", "--name-only", range])
    .split(/\r?\n/)
    .filter(Boolean);
}

function commitMessages() {
  const range = `${baseRef}..${headRef}`;
  return runGit(["log", "--format=%s", range])
    .split(/\r?\n/)
    .filter(Boolean);
}

function branchName() {
  return process.env.GITHUB_HEAD_REF || runGit(["branch", "--show-current"]);
}

function checkBugFixDocumentation(files) {
  const looksLikeFix =
    /fix/i.test(branchName()) || commitMessages().some((message) => /fix/i.test(message));
  const hasFeatureOrLibChange = files.some(
    (file) => file.startsWith("features/") || file.startsWith("lib/")
  );

  if (looksLikeFix && hasFeatureOrLibChange && !files.includes("docs/KNOWN_ISSUES.md")) {
    fail(`✗ This looks like a bug fix, but docs/KNOWN_ISSUES.md was not updated.

Every fix needs:
  - a KI entry (symptom, cause, fix, prevention, ladder level)
  - an index row at the top of the file
  - the maturity report count updated

See docs/RESILIENCE_SYSTEM.md for the capture protocol.`);
  }
}

function checkSessionLog(files) {
  const hasNonDocChange = files.some((file) => !file.startsWith("docs/"));

  if (hasNonDocChange && !files.includes("docs/SESSION_LOG.md")) {
    fail(`✗ Code changed but docs/SESSION_LOG.md was not updated.

Add an entry including a "Next session should" line that names a
specific file and line. This is how the next session starts without
re-deriving context.`);
  }
}

function parseKnownIssues(content) {
  const indexStart = content.indexOf("## Index");
  const maturityStart = content.indexOf("## Maturity report");

  if (indexStart === -1 || maturityStart === -1 || maturityStart <= indexStart) {
    fail("✗ docs/KNOWN_ISSUES.md is missing the required Index or Maturity report sections.");
  }

  const indexText = content.slice(indexStart, maturityStart);
  const indexRows = [
    ...indexText.matchAll(
      /^\|\s*(KI-\d{3})\s*\|([^|]*)\|\s*([0-4])\s*\|\s*([^|]+?)\s*\|\s*$/gm
    ),
  ];
  const indexIds = indexRows.map((match) => match[1]);
  const indexLevels = new Map(indexRows.map((match) => [match[1], Number(match[3])]));
  const indexStatuses = new Map(indexRows.map((match) => [match[1], match[4].trim()]));
  const entryMatches = [...content.matchAll(/^##\s+(KI-\d{3})\s+—/gm)];
  const entryIds = entryMatches.map((match) => match[1]);

  const duplicate = (items) => items.find((item, index) => items.indexOf(item) !== index);
  const duplicateIndex = duplicate(indexIds);
  const duplicateEntry = duplicate(entryIds);

  if (duplicateIndex) fail(`✗ KNOWN_ISSUES index contains duplicate ID ${duplicateIndex}. IDs must be unique.`);
  if (duplicateEntry) fail(`✗ KNOWN_ISSUES contains duplicate entry ${duplicateEntry}. IDs must be unique.`);

  const missingFromIndex = entryIds.filter((id) => !indexIds.includes(id));
  const missingEntry = indexIds.filter((id) => !entryIds.includes(id));

  if (missingFromIndex.length) {
    fail(`✗ KNOWN_ISSUES entry/index mismatch: ${missingFromIndex.join(", ")} missing from the index.`);
  }
  if (missingEntry.length) {
    fail(`✗ KNOWN_ISSUES index/entry mismatch: ${missingEntry.join(", ")} has no matching entry.`);
  }

  const entryLevels = new Map();

  for (const match of entryMatches) {
    const start = match.index;
    const next = entryMatches.find((candidate) => candidate.index > start);
    const block = content.slice(start, next ? next.index : content.length);
    const levelMatch = block.match(/Ladder level:\s*([0-4])\b/);
    const statusMatch = block.match(/Status:\s*(Open|Resolved)\b/);

    if (!levelMatch || !statusMatch) {
      fail(`✗ KNOWN_ISSUES entry ${match[1]} must declare Ladder level and Status.`);
    }

    const level = Number(levelMatch[1]);
    entryLevels.set(match[1], level);

    if (indexLevels.get(match[1]) !== level) {
      fail(`✗ KNOWN_ISSUES index level for ${match[1]} does not match the entry.`);
    }
    if (indexStatuses.get(match[1]) !== statusMatch[1]) {
      fail(`✗ KNOWN_ISSUES index status for ${match[1]} does not match the entry.`);
    }
  }

  const maturitySection = content.slice(maturityStart);
  for (let level = 1; level <= 4; level += 1) {
    const row = maturitySection.match(
      new RegExp(`^\\|\\s*${level}\\s+—\\s+[^|]+\\|\\s*(\\d+)\\s*\\|\\s*$`, "m")
    );
    if (!row) fail(`✗ KNOWN_ISSUES maturity report is missing the Level ${level} count.`);

    const actual = [...entryLevels.values()].filter((value) => value === level).length;
    if (Number(row[1]) !== actual) {
      fail(
        `✗ KNOWN_ISSUES maturity report says Level ${level} has ${row[1]} entries, but ${actual} exist.`
      );
    }
  }
}

function checkKnownIssues() {
  parseKnownIssues(read("docs/KNOWN_ISSUES.md"));
}

function checkNextSession() {
  const content = read("docs/SESSION_LOG.md");
  const entries = [...content.matchAll(/^##\s+\d{4}-\d{2}-\d{2}\s+—/gm)];

  if (!entries.length) {
    fail("✗ docs/SESSION_LOG.md has no dated session entry.");
  }

  const section = content.slice(entries[0].index);
  const heading = section.match(/^###\s+Next session should\s*$/m);

  if (!heading) {
    fail('✗ The most recent SESSION_LOG entry is missing a "Next session should" section.');
  }

  const after = section.slice(heading.index + heading[0].length);
  const nextHeading = after.search(/^###\s+/m);
  const value = (nextHeading === -1 ? after : after.slice(0, nextHeading)).trim();

  if (!value || /^\[fill in\]$/i.test(value) || /^TBD$/i.test(value) || value.length < 20) {
    fail(
      '✗ The most recent SESSION_LOG "Next session should" line is missing a specific next action (minimum 20 characters).'
    );
  }
}

const files = changedFiles();
checkBugFixDocumentation(files);
checkSessionLog(files);
checkKnownIssues();
checkNextSession();
console.log("✓ Documentation enforcement checks passed.");
