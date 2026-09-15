import { describe, expect, it } from "vitest";
import { canReserve, DAILY_SEARCH_LIMIT, DAILY_UNIT_LIMIT } from "@/features/discovery/acquisition/budget";

describe("YouTube quota guard", () => {
  it("allows a reservation inside both limits", () => {
    expect(canReserve(9_900, 59, 100, 1)).toBe(true);
  });

  it("rejects reservations that exceed unit or search limits", () => {
    expect(canReserve(DAILY_UNIT_LIMIT - 50, 10, 100, 0)).toBe(false);
    expect(canReserve(0, DAILY_SEARCH_LIMIT, 100, 1)).toBe(false);
  });
});
