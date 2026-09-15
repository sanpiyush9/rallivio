import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = process.cwd();
const scriptPath = join(projectRoot, "scripts/check-docs.js");

const knownIssues = `# KNOWN ISSUES

## Index

| ID | Symptom keywords | Level | Status |
|---|---|---|---|
| KI-001 | example | 1 | Open |

## Maturity report

| Level | Count |
|---|---|
| 1 — Documented | 1 |
| 2 — Detected | 0 |
| 3 — Auto-recovered | 0 |
| 4 — Prevented | 0 |

## KI-001 — Example issue
First seen: 2026-09-15 · Status: Open · Ladder level: 1 → target 2
Severity: LOW

### Symptom
Example.

### Cause
Example.

### Fix
Example.

### Prevention
Example.

### Related
None.
`;

const validSession = `# SESSION LOG

## 2026-09-15 — Test session
Branch: feature/test
Status: Complete

### Done
- Test work.

### Not done
- Nothing.

### Next session should
Open lib/example.js line 1 and continue the documented verification work.

### Gotchas discovered
- None.

### Documents touched
- None.
`;

function git(cwd, args) {
  return execFileSync("git", args, { cwd, encoding: "utf8" }).trim();
}

function setupRepo() {
  const cwd = mkdtempSync(join(tmpdir(), "rallivio-docs-check-"));
  mkdirSync(join(cwd, "docs"), { recursive: true });
  mkdirSync(join(cwd, "lib"), { recursive: true });
  writeFileSync(join(cwd, "docs/KNOWN_ISSUES.md"), knownIssues);
  writeFileSync(join(cwd, "docs/SESSION_LOG.md"), validSession);
  writeFileSync(join(cwd, "lib/example.js"), "export const example = true;\n");
  git(cwd, ["init", "-b", "main"]);
  git(cwd, ["config", "user.email", "test@example.com"]);
  git(cwd, ["config", "user.name", "Docs Check Test"]);
  git(cwd, ["add", "."]);
  git(cwd, ["commit", "-m", "chore: baseline"]);
  return cwd;
}

function runCheck(cwd) {
  try {
    const output = execFileSync("node", [scriptPath], {
      cwd: projectRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        DOCS_CHECK_ROOT: cwd,
        DOCS_CHECK_BASE: "HEAD~1",
        DOCS_CHECK_HEAD: "HEAD",
      },
      stdio: ["ignore", "pipe", "pipe"],
    });
    return { status: 0, output };
  } catch (error) {
    return {
      status: error.status ?? 1,
      output: `${error.stdout ?? ""}${error.stderr ?? ""}`,
    };
  }
}

function commitChange(cwd, message) {
  git(cwd, ["add", "."]);
  git(cwd, ["commit", "-m", message]);
}

function cleanup(cwd) {
  rmSync(cwd, { recursive: true, force: true });
}

describe("documentation enforcement", () => {
  it("passes when all documentation requirements are satisfied", () => {
    const cwd = setupRepo();
    try {
      writeFileSync(join(cwd, "lib/example.js"), "export const example = false;\n");
      writeFileSync(join(cwd, "docs/SESSION_LOG.md"), `${validSession}\n## 2026-09-15 — Code change\nBranch: feature/test\nStatus: Complete\n\n### Done\n- Updated lib/example.js.\n\n### Next session should\nOpen lib/example.js line 1 and verify the regression test before changing behavior.\n\n### Gotchas discovered\n- None.\n\n### Documents touched\n- SESSION_LOG.md only.\n`);
      commitChange(cwd, "chore: update implementation");
      const result = runCheck(cwd);
      expect(result.status).toBe(0);
      expect(result.output).toContain("Documentation enforcement checks passed");
    } finally {
      cleanup(cwd);
    }
  });

  it("fails Check A when a fix changes lib without KNOWN_ISSUES", () => {
    const cwd = setupRepo();
    try {
      writeFileSync(join(cwd, "lib/example.js"), "export const example = false;\n");
      writeFileSync(join(cwd, "docs/SESSION_LOG.md"), validSession);
      commitChange(cwd, "fix: correct example behavior");
      const result = runCheck(cwd);
      expect(result.status).toBe(1);
      expect(result.output).toContain("This looks like a bug fix");
      expect(result.output).toContain("docs/KNOWN_ISSUES.md was not updated");
    } finally {
      cleanup(cwd);
    }
  });

  it("fails Check B when non-doc files change without SESSION_LOG", () => {
    const cwd = setupRepo();
    try {
      writeFileSync(join(cwd, "lib/example.js"), "export const example = false;\n");
      commitChange(cwd, "chore: update implementation");
      const result = runCheck(cwd);
      expect(result.status).toBe(1);
      expect(result.output).toContain("Code changed but docs/SESSION_LOG.md was not updated");
    } finally {
      cleanup(cwd);
    }
  });

  it("fails Check C when the index and entries disagree", () => {
    const cwd = setupRepo();
    try {
      writeFileSync(join(cwd, "docs/KNOWN_ISSUES.md"), knownIssues.replace("| KI-001 | example | 1 | Open |", "| KI-002 | example | 1 | Open |"));
      commitChange(cwd, "docs: break known issue index");
      const result = runCheck(cwd);
      expect(result.status).toBe(1);
      expect(result.output).toContain("KNOWN_ISSUES entry/index mismatch");
    } finally {
      cleanup(cwd);
    }
  });

  it("fails Check D when Next session should is a placeholder", () => {
    const cwd = setupRepo();
    try {
      writeFileSync(join(cwd, "docs/SESSION_LOG.md"), validSession.replace("Open lib/example.js line 1 and continue the documented verification work.", "[fill in]"));
      commitChange(cwd, "docs: break next-session guidance");
      const result = runCheck(cwd);
      expect(result.status).toBe(1);
      expect(result.output).toContain("Next session should");
      expect(result.output).toContain("specific next action");
    } finally {
      cleanup(cwd);
    }
  });
});
