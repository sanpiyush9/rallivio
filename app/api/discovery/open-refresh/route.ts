import { NextResponse } from "next/server";
import { refresh, sb, signals } from "@/lib/server/youtube-discovery";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST() {
  try {
    const claim = await sb("rpc/claim_discovery_open_refresh", {
      method: "POST",
      body: JSON.stringify({ p_cooldown_seconds: 300 }),
    });

    if (!claim.ok) {
      throw new Error(`Open-refresh gate failed: ${claim.status} ${await claim.text()}`);
    }

    const claimed = Boolean(await claim.json());
    if (!claimed) {
      return NextResponse.json({
        ok: true,
        state: "COOLDOWN",
        message: "A recent open-triggered observation is already in progress or completed.",
      });
    }

    const observation = await refresh({ limit: 50, worker: "rallivio-open-refresh" });
    const signalResult = await signals();

    return NextResponse.json({
      ok: true,
      state: "REFRESHED",
      observation,
      signals: signalResult,
    });
  } catch (error) {
    console.error("discovery open refresh failed", error);
    return NextResponse.json(
      {
        ok: false,
        state: "OPEN_REFRESH_FAILED",
        error: error instanceof Error ? error.message : "unknown",
      },
      { status: 502 },
    );
  }
}
