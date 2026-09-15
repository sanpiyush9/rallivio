import { describe, expect, it } from "vitest";
import { freshnessAllows, shrunkResidual } from "@/features/discovery/signals/math";

describe("RALLIVIO signal math", () => {
  it("shrinks a single small sample toward zero", () => {
    const one = shrunkResidual(200, 100, 1, 5);
    const ten = shrunkResidual(200, 100, 10, 5);
    expect(one).not.toBeNull();
    expect(ten).not.toBeNull();
    expect(Math.abs(one!.shrunk)).toBeLessThan(Math.abs(ten!.shrunk));
  });

  it("rejects stale observations", () => {
    const now = Date.parse("2026-09-15T12:00:00.000Z");
    expect(freshnessAllows("2026-09-15T11:30:00.000Z", 60 * 60 * 1000, now)).toBe(true);
    expect(freshnessAllows("2026-09-15T09:00:00.000Z", 60 * 60 * 1000, now)).toBe(false);
  });
});
