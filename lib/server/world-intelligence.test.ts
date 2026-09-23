import { describe, expect, it } from "vitest";
import { accelerationFromSeries, groupTrendObservations, scoreTrend } from "./world-intelligence";

describe("world intelligence", () => {
  it("detects positive acceleration", () => {
    expect(accelerationFromSeries([100, 120, 180])).toBeGreaterThan(0);
  });

  it("does not invent a score when there are no observations", () => {
    const result = scoreTrend([]);
    expect(result.score).toBe(0);
    expect(result.evidence.observationCount).toBe(0);
  });

  it("uses cross-source evidence", () => {
    const observations = [
      { source: "youtube", entityKey: "event-a", observedAt: "2026-09-23T10:00:00Z", value: 100, region: "IN" },
      { source: "x", entityKey: "event-a", observedAt: "2026-09-23T10:05:00Z", value: 150, region: "US" },
      { source: "news", entityKey: "event-a", observedAt: "2026-09-23T10:10:00Z", value: 260, region: "GB" },
    ];

    const result = scoreTrend(observations);
    expect(result.evidence.sourceCount).toBe(3);
    expect(result.evidence.regionCount).toBe(3);
    expect(result.evidence.acceleration).toBeGreaterThan(0);
  });

  it("groups observations by canonical entity key", () => {
    const groups = groupTrendObservations([
      { source: "youtube", entityKey: "a", observedAt: "2026-09-23T10:00:00Z", value: 1 },
      { source: "x", entityKey: "a", observedAt: "2026-09-23T10:01:00Z", value: 2 },
      { source: "news", entityKey: "b", observedAt: "2026-09-23T10:02:00Z", value: 3 },
    ]);

    expect(groups.get("a")).toHaveLength(2);
    expect(groups.get("b")).toHaveLength(1);
  });
});
