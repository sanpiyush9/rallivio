import { supabaseService } from "@/lib/supabase/rest";

const DAILY_UNIT_LIMIT = 10_000;
const DAILY_SEARCH_LIMIT = 60;

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
