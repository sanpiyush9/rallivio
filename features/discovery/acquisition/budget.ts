import { supabaseService } from "@/lib/supabase/rest";

export const DAILY_UNIT_LIMIT = 10_000;
export const DAILY_SEARCH_LIMIT = 60;

export function canReserve(currentUnits: number, currentSearchCalls: number, units: number, searchCalls = 0) {
  return currentUnits + units <= DAILY_UNIT_LIMIT && currentSearchCalls + searchCalls <= DAILY_SEARCH_LIMIT;
}

export async function reserveYouTubeQuota(units: number, searchCalls = 0) {
  if (units < 0 || searchCalls < 0) throw new Error("Quota reservation cannot be negative");
  const result = await supabaseService<boolean>("rpc/reserve_youtube_quota", {
    method: "POST",
    body: JSON.stringify({ p_units: units, p_search_calls: searchCalls }),
  });
  if (!result) {
    throw new Error(`YouTube quota budget would be exceeded (max ${DAILY_UNIT_LIMIT} units / ${DAILY_SEARCH_LIMIT} search calls)`);
  }
}
