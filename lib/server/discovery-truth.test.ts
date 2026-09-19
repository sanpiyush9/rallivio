import { describe, expect, it } from "vitest";
import { hasValidSignalObservation } from "./discovery-truth";

describe("discovery signal truth gate", () => {
  it("rejects a video with no stats refresh", () => {
    expect(hasValidSignalObservation(null, "2026-09-19T18:15:00.000Z")).toBe(false);
  });

  it("rejects a signal computed before the second observation", () => {
    expect(
      hasValidSignalObservation(
        "2026-09-19T18:15:00.000Z",
        "2026-09-19T16:15:00.000Z",
      ),
    ).toBe(false);
  });

  it("accepts a signal computed at or after the second observation", () => {
    expect(
      hasValidSignalObservation(
        "2026-09-19T18:15:00.000Z",
        "2026-09-19T18:15:01.000Z",
      ),
    ).toBe(true);
  });
});
